import * as turf from "@turf/turf";
import {
  Dispatch,
  SetStateAction,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Expression,
  LngLatBoundsLike,
  Map,
  MapMouseEvent,
  MapboxGeoJSONFeature,
} from "mapbox-gl";
import {
  DEFAULT_ZOOM,
  HEALDSBURG_CENTER,
  createMap,
  lineStringFromSummary,
} from "../lib/mapbox";
import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
} from "geojson";
import {
  buildUserSegmentMap,
  getSegmentMap,
  segmentMapToGeoJson,
} from "../lib/data";
import type { FullActivity } from "../../../server/src/types";
import { POLYLINES, TRAVELED_WAYS, UNTRAVELED_WAYS } from "../lib/styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faX } from "@fortawesome/free-solid-svg-icons";
import Spacer from "./common/Spacer";
import ShareButton from "./ShareButton";
import { Athlete, Score } from "../types/types";

type BaseMapProps = {
  athlete: Athlete;
  activities: FullActivity[];
  score: Score;
  selectedActivity: string;
  setSelectedActivity: Dispatch<SetStateAction<string>>;
  setShowActivityList: Dispatch<SetStateAction<boolean>>;
  showPolylines: boolean;
  showUntravelled: boolean;
  showTravelled: boolean;
};

const userId = localStorage.getItem("loggedInUser");

/* MAPBOX EXPRESSIONS */
const paintByTotalCount = [
  "case",
  ["all", ["has", "count"], [">", ["get", "count"], 0]],
  TRAVELED_WAYS,
  UNTRAVELED_WAYS,
] as Expression;

const paintByActivityId = (id: string) => {
  return [
    "case",
    ["all", ["has", id], ["==", ["get", id], true]],
    TRAVELED_WAYS,
    UNTRAVELED_WAYS,
  ] as Expression;
};

const BaseMap = memo(function BaseMap(props: BaseMapProps) {
  const {
    athlete,
    activities,
    score,
    selectedActivity,
    setSelectedActivity,
    setShowActivityList,
    showPolylines,
    showUntravelled,
    showTravelled,
  } = props;

  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  if (!userId) throw new Error("No logged in user");

  // Memoized data source from activities
  const polylineFeatures = useMemo(
    () =>
      activities
        .filter((a) => !!a.data.map?.summary_polyline)
        .map((a) => {
          const polyline = a.data.map.summary_polyline;
          return {
            type: "Feature",
            id: a.id,
            geometry: lineStringFromSummary(polyline as string),
            properties: { name: a.data.name },
          } as Feature<LineString, GeoJsonProperties>;
        }),
    [activities],
  );

  const polylinesFeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: polylineFeatures,
    } as FeatureCollection;
  }, [polylineFeatures]);

  // Render base segments and polylines
  useEffect(() => {
    if (!activities || activities.length === 0) {
      console.log("[🛑 NO ACTIVITIES]");
      return;
    }
    if (!mapLoaded || !mapRef.current) return;

    const currMap = mapRef.current;
    console.log(`[🚧 BUILDING SEGMENT MAP]`);
    buildUserSegmentMap(userId, activities);
    const segmentsMap = getSegmentMap(userId);

    // Create data sources
    const geoJsonFromSegments = segmentMapToGeoJson(segmentsMap);

    // Remove old layers and sources
    if (currMap.getLayer("ways-layer")) currMap.removeLayer("ways-layer");
    if (currMap.getLayer("polylines-layer"))
      currMap.removeLayer("polylines-layer");
    if (currMap.getSource("ways")) currMap.removeSource("ways");
    if (currMap.getSource("polylines")) currMap.removeSource("polylines");

    // Add sources
    currMap.addSource("ways", {
      type: "geojson",
      data: geoJsonFromSegments,
    });

    currMap.addSource("polylines", {
      type: "geojson",
      data: polylinesFeatureCollection,
    });

    // Add layers
    currMap.addLayer({
      id: "ways-layer",
      type: "line",
      source: "ways",
      layout: {
        visibility: "visible",
      },
      paint: {
        "line-width": 2,
        "line-color": paintByTotalCount,
      },
    });

    currMap.addLayer(
      {
        id: "polylines-layer",
        type: "line",
        source: "polylines",
        layout: {
          visibility: "visible",
        },
        paint: {
          "line-color": POLYLINES,
          "line-width": 2,
        },
      },
      "ways-layer",
    );

    // Add event listeners
    currMap.on("mouseenter", "polylines-layer", () => {
      currMap.getCanvas().style.cursor = "pointer";
    });

    currMap.on("mouseleave", "polylines-layer", () => {
      currMap.getCanvas().style.cursor = "";
    });
  }, [mapLoaded, activities, polylineFeatures, polylinesFeatureCollection]);

  /* USER EVENTS */

  const handleSelectActivity = useCallback(
    (id: string | number, map: Map) => {
      const stringId = id.toString();
      console.log({ stringId });
      setSelectedActivity(stringId);
      map.setPaintProperty(
        "ways-layer",
        "line-color",
        paintByActivityId(stringId),
      );
      map.setFilter("polylines-layer", ["==", ["id"], id]);
      const feature = polylineFeatures.find((f) => f.id == id);
      const featureBounds = turf.bbox(feature);
      map.fitBounds(featureBounds as LngLatBoundsLike);
    },
    [polylineFeatures],
  );

  const handleUnselectActivity = useCallback((map: Map) => {
    setSelectedActivity("");
    map.setFilter("polylines-layer", null);
    map.flyTo({ zoom: DEFAULT_ZOOM, center: HEALDSBURG_CENTER });
    map.setPaintProperty("ways-layer", "line-color", paintByTotalCount);
  }, []);

  const handleFeatureClick = useCallback(
    (feature: MapboxGeoJSONFeature) => {
      const currMap = mapRef.current;
      const id = feature.id;
      if (!currMap || !id) return;
      const stringId = id.toString();

      // If already selected, unclick feature
      if (selectedActivity === stringId) {
        handleUnselectActivity(currMap);
      } else {
        handleSelectActivity(id, currMap);
      }
    },
    [mapRef, selectedActivity],
  );

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const currMap = mapRef.current;
    if (selectedActivity === "") handleUnselectActivity(currMap);
    else handleSelectActivity(Number(selectedActivity), currMap);
  }, [mapLoaded, mapRef, selectedActivity]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    // Click event
    mapRef.current.on(
      "click",
      "polylines-layer",
      (
        e: MapMouseEvent & {
          features?: MapboxGeoJSONFeature[];
        },
      ) => {
        const feature = e.features?.[0];
        if (!feature) return;
        handleFeatureClick(feature);
      },
    );
  }, [mapLoaded, mapRef]);

  // Show and hide polylines
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (!showPolylines)
      mapRef.current.setLayoutProperty("polylines-layer", "visibility", "none");
    else
      mapRef.current.setLayoutProperty(
        "polylines-layer",
        "visibility",
        "visible",
      );
  }, [mapLoaded, showPolylines]);

  // Show and hide ways
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const currMap = mapRef.current;
    if (!currMap.getLayer("ways-layer")) return;
    let filter = null;

    if (showTravelled && !showUntravelled) {
      filter = ["all", ["has", "count"], [">", ["get", "count"], 0]];
    } else if (showUntravelled && !showTravelled) {
      filter = ["all", ["!has", "count"]];
    } else if (!showTravelled && !showUntravelled) {
      filter = ["==", "impossible", true];
    }

    currMap.setFilter("ways-layer", filter);
  }, [mapLoaded, showUntravelled, showTravelled]);

  // Render map tiles on mount
  useEffect(() => {
    if (mapRef.current) return;
    const mapbox = createMap("map");
    mapRef.current = mapbox;
    mapRef.current.on("load", () => {
      setMapLoaded(true);
    });
  }, []);

  const selectedFullActivity = useMemo(() => {
    return activities.find((a) => a.id === selectedActivity);
  }, [activities, selectedActivity]);

  return (
    <div className="relative w-full flex-grow border-2 border-dark rounded-2xl overflow-hidden">
      <div className="absolute top-3 right-3" style={{ zIndex: 3 }}>
        <button
          className="bg-dark rounded-xl flex items-center justify-center active:opacity-50"
          style={{ width: 48, height: 48 }}
          onClick={() => setShowActivityList(true)}
        >
          <FontAwesomeIcon icon={faLayerGroup} size={"lg"} color={"#ffffff"} />
        </button>
      </div>
      <div className="absolute bottom-2 left-2" style={{ zIndex: 3 }}>
        <ShareButton
          name={athlete.firstname}
          data={polylinesFeatureCollection}
          score={score}
        />
      </div>
      {selectedFullActivity ? (
        <div
          className="absolute top-3 left-3 bg-white rounded-xl bg-opacity-75 py-1 px-3 flex flex-row items-center overflow-hidden border border-dark"
          style={{ zIndex: 3, maxWidth: "50%" }}
        >
          <button onClick={() => setSelectedActivity("")}>
            <FontAwesomeIcon icon={faX} size={"xs"} color={"DARK"} />
          </button>
          <Spacer width={16} />
          <p className="whitespace-nowrap text-ellipsis overflow-hidden text-dark font-bold text-lg">
            {selectedFullActivity.data.name}
          </p>
        </div>
      ) : (
        <div
          className="absolute top-3 left-3 bg-white rounded-xl bg-opacity-75 py-1 px-3 flex flex-col overflow-hidden border border-dark text-xs"
          style={{ zIndex: 3, maxWidth: "50%" }}
        >
          <div className="flex flex-row gap-2 items-center">
            <div className="h-3 w-3" style={{ backgroundColor: POLYLINES }} />
            <p>My activities</p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <div
              className="h-3 w-3"
              style={{ backgroundColor: TRAVELED_WAYS }}
            />
            <p>Explored streets</p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <div
              className="h-3 w-3"
              style={{ backgroundColor: UNTRAVELED_WAYS }}
            />
            <p>Unexplored streets</p>
          </div>
        </div>
      )}
      <div id="map" className="w-full h-full" />
    </div>
  );
});

export { BaseMap };
