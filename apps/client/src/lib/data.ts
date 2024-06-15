import segmentMap from "../data/bbox_healdsburg_segment_map.json";
import type { FullActivity } from "../../../server/src/types";
import { SegmentMap } from "../types/types";
import * as turf from "@turf/turf";
import { FeatureCollection } from "@turf/turf";
import { Geometry } from "geojson";

export const buildUserSegmentMap = (
  userId: string,
  activities: FullActivity[]
) => {
  const copy = JSON.parse(JSON.stringify(segmentMap)) as SegmentMap;
  // For each activity, check if it has segments
  console.log(`Processing ${activities.length} activities`);
  const start = Date.now();
  activities.forEach((activity) => {
    const segments = activity.segment_data?.segments;
    if (!segments || segments.length === 0) return;
    console.log(
      `Activity ${activity.data.name} has ${segments.length} segments`
    );
    // For each segment, look up the segment in the segmentMap
    segments.forEach((id) => {
      const segmentMapValue = copy[id];
      // console.log(`SEGMENT`, segment, `MAP VALUE`, segmentMapValue);
      if (segmentMapValue) {
        if (!segmentMapValue.properties) segmentMapValue.properties = {};
        segmentMapValue.properties[activity.id] = true;
        const count = segmentMapValue.properties.count || 0;
        segmentMapValue.properties.count = count + 1;
        // console.log(`UPDATED`, segmentMapValue.properties);
      }
    });
  });
  const end = Date.now();
  console.log(`Processed ${activities.length} activities in ${end - start}ms`);
  localStorage.setItem(`${userId}-segmentMap`, JSON.stringify(copy));
};

export const getSegmentMap = (userId: string): SegmentMap => {
  const segmentMap = localStorage.getItem(`${userId}-segmentMap`);
  if (!segmentMap) throw new Error(`No segment map found for ${userId}`);
  return JSON.parse(segmentMap) as SegmentMap;
};

export const segmentMapToGeoJson = (segmentMap: SegmentMap) => {
  const values = Object.values(segmentMap);
  const collection = turf.featureCollection(values);
  console.log(`[CLIENT] segmentMapToGeoJson`, collection);
  return collection;
};

export const metersToMiles = (meters: number) => {
  const miles = meters / 1609.344;
  return Math.round(miles);
};

export const getTotalDistance = (segments: FeatureCollection<Geometry>) => {
  return segments.features.reduce((acc, feature) => {
    if (feature.properties && feature.properties.distance) {
      return acc + feature.properties.distance;
    }
    return acc;
  }, 0);
};
