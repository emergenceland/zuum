import mapboxgl, { LngLatLike, NavigationControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import polyline from "@mapbox/polyline";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export const HEALDSBURG_CENTER = [-122.864818, 38.619019] as LngLatLike;
export const DEFAULT_ZOOM = 13;

export const createMap = (containerId: string, center?: LngLatLike) => {
  console.log(`📍 CREATING MAP FOR ${containerId}`);
  return new mapboxgl.Map({
    container: containerId,
    style: "mapbox://styles/mapbox/light-v10",
    center: center || HEALDSBURG_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 12,
  }).addControl(new NavigationControl(), "bottom-right");
};

/* LineString from summaryPolyline */
export const lineStringFromSummary = (summary: string) =>
  polyline.toGeoJSON(summary);
