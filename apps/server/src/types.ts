/*******************************
  DB Types  
*******************************/

export interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  refresh_token: string;
  access_token: string;
  expires_at: number;
}

export type UserWithData = {
  id: string;
  score?: number;
  data: User;
};

export type PodUser = {
  semaphore_id: string;
  strava_id: string;
  proof: string;
};

export type UserDB = UserWithData & {
  created_at: string;
  updated_at: string;
};

export type PodUserDB = PodUser & {
  created_at: string;
  updated_at: string;
};

export type ActivityWithData = {
  id: string;
  user_id: string;
  data: Activity;
};

export type ActivityDB = ActivityWithData & {
  created_at: string;
  updated_at: string;
};

export type UserActivitySegments = {
  user_id: string;
  activity_id: string;
  segments: string[];
};

export type UserActivitySegmentsDB = UserActivitySegments & {
  created_at: string;
  updated_at: string;
};

/*******************************
  Strava Types  
*******************************/
type Athlete = {
  id: number;
  username: string | null;
  resource_state: number;
  firstname: string;
  lastname: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string;
  sex: string | null;
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight: number | null;
  profile_medium: string;
  profile: string;
  friend: string | null;
  follower: string | null;
};

export type AuthResponse = {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: Athlete;
};

export type RefreshResponse = {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
};

type AthleteActivity = {
  id: number;
  resource_state: number;
};

type Map = {
  id: string;
  summary_polyline: string | null;
  resource_state: number;
};

export type Activity = {
  resource_state: number;
  athlete: AthleteActivity;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  workout_type: string | null;
  id: number;
  external_id: string;
  upload_id: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: Map;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string;
  from_accepted_tag: boolean;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  average_watts: number;
  weighted_average_watts: number;
  kilojoules: number;
  device_watts: boolean;
  has_heartrate: boolean;
  average_heartrate: number;
  max_heartrate: number;
  max_watts: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  suffer_score: number;
};

/*******************************
  Synthetics Types
*******************************/

export interface FullActivity extends ActivityDB {
  segment_data?: UserActivitySegmentsDB;
}

export interface UserWithScore {
  id: string;
  score: number;
  username: string;
  firstname: string;
  lastname: string;
}
