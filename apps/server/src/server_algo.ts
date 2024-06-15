import * as turf from "@turf/turf";
import polyline from "@mapbox/polyline";
import { Feature, LineString, Point } from "geojson";

// Static data files
import basePoints from "../data/bbox_healdsburg_points.json";
import segment_map from "../data/bbox_healdsburg_segment_map.json";

const values = Object.values(segment_map);
const totalDistanceMeters = values.reduce(
  (acc, s) => acc + s.properties.distance,
  0
);

import { Pool } from "pg";
import {
  bulkInsertActivities,
  getActivitiesByUserId,
  getActivitySegmentsByUserId,
  insertUserActivitySegments,
  markActivityAsDeleted,
  updateUserScore,
} from "./db";
import {
  Activity,
  ActivityDB,
  User,
  UserActivitySegmentsDB,
  UserDB,
} from "./types";
import { getStravaData } from "./strava";
import { log } from "./log";

export const getTotalScore = () => {
  return Math.floor(totalDistanceMeters);
};

const DISTANCE_THRESHOLD_METERS = 20;

type GeoPoint = Feature<Point>;

const isWithinDistance = (point: GeoPoint, polyline: LineString) => {
  const distance = turf.pointToLineDistance(
    point.geometry.coordinates,
    polyline,
    {
      units: "meters",
    }
  );
  if (!point.properties) point.properties = {};
  point.properties.distanceFromLine = distance;
  return distance <= DISTANCE_THRESHOLD_METERS;
};

export const findBasemapPoints = (
  activityId: string,
  encodedUserPolyline: string | null
) => {
  if (!encodedUserPolyline) throw new Error("No user polyline provided");
  log(`[ALGO] Processing Activity ${activityId} ...`);

  // Must be in [lon, lat] format!
  const polyLineLineString = polyline.toGeoJSON(encodedUserPolyline);

  const start = Date.now();

  const nearbyPoints = basePoints.features.filter((point) =>
    isWithinDistance(point as GeoPoint, polyLineLineString)
  );
  const end = Date.now();

  log(
    `[INFO] Processed ${basePoints.features.length} basemap Points with ${polyLineLineString.coordinates.length} user Points and found ${nearbyPoints.length} hits in ${end - start}ms`
  );

  return nearbyPoints as GeoPoint[];
};

const userPointsMap = (userPoints: GeoPoint[]) => {
  const map = new Map<string, number>();
  userPoints.forEach((point, idx) => {
    const key = point.geometry.coordinates.join(",");
    map.set(key, idx);
  });
  return map;
};

export const baseMapPointsToBaseMapSegments = (userPoints: GeoPoint[]) => {
  const map = userPointsMap(userPoints);
  const segmentMatches: string[] = [];
  values.forEach((s) => {
    const start = s.geometry.coordinates[0];
    const end = s.geometry.coordinates[1];
    const startKey = start.join(",");
    const endKey = end.join(",");
    const segmentKey = `${startKey}_${endKey}`;
    const startOverlap = map.get(startKey);
    const endOverlap = map.get(endKey);
    // TODO: maybe make this more robust
    if (startOverlap && endOverlap) {
      segmentMatches.push(segmentKey);
    }
  });
  log(`[ALGO] Found ${segmentMatches.length} segment matches`);
  return segmentMatches;
};

export const activityToBasemapSegments = async (
  pool: Pool,
  activity: ActivityDB,
  userActivities: Array<ActivityDB & UserActivitySegmentsDB>
) => {
  try {
    const polyline = activity.data.map.summary_polyline;
    if (!polyline)
      return log(`[SERVER] [ALGO] No polyline found for activity`, activity.id);

    const existingSegment = userActivities.find(
      (a) => a.activity_id === activity.id
    );

    if (existingSegment && existingSegment.data.map.summary_polyline)
      return log(`[SERVER] [ALGO] Activity already processed`, activity.id);

    const flaggedActivity = activity.data.flagged;
    console.log(
      `[SERVER] [ALGO] flaggedActivity`,
      flaggedActivity,
      activity.id
    );

    const nearbyPoints = findBasemapPoints(activity.id, polyline);
    log(`[SERVER] [ALGO] nearbyPoints`, nearbyPoints.length);
    const segments = flaggedActivity
      ? []
      : baseMapPointsToBaseMapSegments(nearbyPoints);

    const insertedSegments = await insertUserActivitySegments(
      pool,
      activity.user_id,
      activity.id,
      segments
    );
    log(
      `[SERVER] [ALGO] inserted ${insertedSegments.segments.length} segments`
    );
  } catch (error) {
    console.error(`[SERVER] [ALGO] Error processing activity`, activity.id);
  }
};

export const refreshUserActivities = async (pool: Pool, user: UserDB) => {
  const name = user.data.username || user.data.firstname;

  // Get the user's Strava data
  const activities = (await getStravaData(
    user,
    "athlete/activities?per_page=200&after=1717228800",
    pool
  )) as Activity[];
  console.log(`[STRAVA] [${name}] found ${activities?.length} activities`);

  const currentActivities = await getActivitiesByUserId(pool, user.id);
  const incomingActivityIds = activities.map((a) => a.id.toString());

  // for each current activity, check if it exists in the incoming activities. If not, delete it.
  const deletes = currentActivities.map(async (activity) => {
    if (!incomingActivityIds.includes(activity.id)) {
      console.log(`${activity.data.name} does not exist, deleting...`);
      return markActivityAsDeleted(pool, activity.id);
    }
  });
  await Promise.all(deletes);

  await bulkInsertActivities(pool, user.id, activities);

  const updatedActivities = await getActivitiesByUserId(pool, user.id);

  return updatedActivities;
};

export const runAlgoOnActivities = async (
  pool: Pool,
  activities: ActivityDB[],
  userId: string
) => {
  const userSegments = await getActivitySegmentsByUserId(pool, userId);
  const start = Date.now();
  await Promise.all(
    activities.map((activity) =>
      activityToBasemapSegments(pool, activity, userSegments)
    )
  );
  const end = Date.now();
  console.log(
    `[SERVER] [ALGO] Processed ${activities.length} activities in ${end - start}ms`
  );
};

export const calculateUserScore = (segments: UserActivitySegmentsDB[]) => {
  // Map of segmentId to distance
  const userSegmentMap = new Map<string, number>();
  segments.forEach((s) => {
    s.segments.forEach((id) => {
      if (userSegmentMap.has(id)) return;
      // Look up segment in segmentMap
      // @ts-expect-error - TS doesn't like this but it's fine
      const globalSegment = segment_map[id];
      if (globalSegment && globalSegment.properties.distance)
        userSegmentMap.set(id, globalSegment.properties.distance);
    });
  });
  const allUserSegments = Array.from(userSegmentMap.values());
  const userDistanceScoreMeters = allUserSegments.reduce(
    (acc, d) => acc + d,
    0
  );
  // Round down
  return Math.floor(userDistanceScoreMeters);
};

export const calculateAllScores = (allSegments: UserActivitySegmentsDB[]) => {
  // group segments by userId
  const userSegmentsMap = new Map<string, UserActivitySegmentsDB[]>();
  allSegments.forEach((s) => {
    if (!userSegmentsMap.has(s.user_id)) userSegmentsMap.set(s.user_id, []);
    const userSegments = userSegmentsMap.get(s.user_id);
    if (userSegments) userSegments.push(s);
  });

  // console.log(`MAP`, userSegmentsMap);

  // Iterate on each user's segments
  const userScoreMap = new Map<string, number>();
  userSegmentsMap.forEach((segments, userId) => {
    const score = calculateUserScore(segments);
    userScoreMap.set(userId, score);
    console.log(`[SERVER] [SCORE] ${userId}`, score);
  });
  return userScoreMap;
};

const mToKm = (m: number) => (m / 1000).toFixed(3);

export const metersToKilometers = (score: number, round?: boolean) => {
  return round
    ? Math.round(score / 1000).toString()
    : (score / 1000).toFixed(1);
};

export const updateScore = async (pool: Pool, userId: string) => {
  const segments = await getActivitySegmentsByUserId(pool, userId);
  const score = calculateUserScore(segments);
  if (!!score) {
    const scoreRes = await updateUserScore(pool, userId, score);
    console.log(`USER ${userId} SCORE UPDATED`, scoreRes.score);
    return score;
    // } else {
    //   console.log("User score is undefined, defaulting to ZERO");
    //   const scoreRes = await updateUserScore(pool, userId, 0);
    //   console.log(`USER ${userId} SCORE UPDATED`, scoreRes.score);
    //   return score;
  }
};
