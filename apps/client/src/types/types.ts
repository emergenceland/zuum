import { LngLat } from "mapbox-gl";
import { Feature, LineString } from "geojson";
import type { UserWithScore } from "../../../server/src/types";

enum ActivityType {
  AlpineSki = "AlpineSki",
  BackcountrySki = "BackcountrySki",
  Canoeing = "Canoeing",
  Crossfit = "Crossfit",
  EBikeRide = "EBikeRide",
  Elliptical = "Elliptical",
  Hike = "Hike",
  IceSkate = "IceSkate",
  InlineSkate = "InlineSkate",
  Kayaking = "Kayaking",
  Kitesurf = "Kitesurf",
  NordicSki = "NordicSki",
  Ride = "Ride",
  RockClimbing = "RockClimbing",
  RollerSki = "RollerSki",
  Rowing = "Rowing",
  Run = "Run",
  Snowboard = "Snowboard",
  Snowshoe = "Snowshoe",
  StairStepper = "StairStepper",
  StandUpPaddling = "StandUpPaddling",
  Surfing = "Surfing",
  Swim = "Swim",
  VirtualRide = "VirtualRide",
  Walk = "Walk",
  WeightTraining = "WeightTraining",
  Windsurf = "Windsurf",
  Workout = "Workout",
  Yoga = "Yoga",
}

export type Activity = {
  id: string;
  name: string;
  distance: number;
  map: { id: string; summary_polyline: string };
  sport_type: ActivityType;
  start_date: Date;
  startLatLng: LngLat;
};

export type Athlete = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
};

export type AuthInfo = {
  access_token: string;
  athlete: Athlete;
} | null;

export type SegmentMap = { [key: string]: Feature<LineString> };

export type Score = UserWithScore & { totalScore: number };

export type LeaderboardResponse = {
  scores: UserWithScore[];
  totalScore: number;
};
