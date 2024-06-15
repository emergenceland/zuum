import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
} from "geojson";
import shapeData from "../data/shapefile_healdsburg.json";
import { Score } from "../types/types";
import { FullActivity } from "../../../server/src/types";
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import { lineStringFromSummary } from "./mapbox";
import { LIGHT, MAIN, DARK } from "./styles";
import { metersToKilometers } from "./utils";

const shape = shapeData as FeatureCollection<Geometry>;

const WIDTH = 300;
const TITLE_HEIGHT = 50;
const SHAPE_HEIGHT = 325;
const TAG_HEIGHT = 92;
const PADDING = 24;
const TOTAL_HEIGHT = SHAPE_HEIGHT + TAG_HEIGHT + TITLE_HEIGHT + PADDING * 1.5;

const outerProgWidth = WIDTH - PADDING * 2;

type MapProps = {
  name: string;
  data: FeatureCollection<Geometry>;
  score: Score;
};

const percentCovered = (score: Score) => {
  return Math.round((score.score / score.totalScore) * 100);
};

export const createVirtualSVG = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", WIDTH.toString());
  svg.setAttribute("height", TOTAL_HEIGHT.toString());
  svg.setAttribute("style", `background-color: ${DARK};`);
  return svg;
};

export const svgToBase64 = (svgElement: SVGSVGElement): string => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const base64Encoded = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64Encoded}`;
};

export const polylineFeatures = (activities: FullActivity[]) =>
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
    });

export const polylinesFeatureCollection = (
  polylineFeatures: Feature<LineString, GeoJsonProperties>[]
) => {
  return {
    type: "FeatureCollection",
    features: polylineFeatures,
  } as FeatureCollection;
};

const drawGeoJSON = (
  svgElement: SVGSVGElement,
  name: string,
  data: FeatureCollection<Geometry>,
  score: Score
) => {
  const innerProgWidth = outerProgWidth * (percentCovered(score) / 100) - 8;
  const svg = d3.select(svgElement);
  svg.selectAll().remove();

  svg.append("defs").append("style").attr("type", "text/css").text(`
		@font-face {
			font-family: 'Space Mono';
			src: url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
		}
		.space-mono {
			font-family: 'Space Mono', monospace;
		}
	`);

  const projection = d3Geo
    .geoMercator()
    .fitSize([WIDTH, SHAPE_HEIGHT], shape)
    .precision(0.1);

  const pathGenerator = d3Geo.geoPath().projection(projection);

  // Define the gradient within the defs section
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient.append("stop").attr("offset", "0%").attr("stop-color", LIGHT);
  gradient.append("stop").attr("offset", "100%").attr("stop-color", MAIN);

  // Define a mask with both the shape and the lines
  const mask = svg.append("defs").append("mask").attr("id", "combinedMask");
  mask.selectAll().remove();

  // Add a white rectangle to define the full area of the mask
  mask
    .append("rect")
    .attr("width", WIDTH)
    .attr("height", TOTAL_HEIGHT)
    .attr("fill", "white");

  const maskGroup = mask
    .append("g")
    .attr("transform", `translate(0, ${PADDING + TITLE_HEIGHT})`);

  // Add the shape paths to the mask in black (areas to be visible)
  maskGroup
    .selectAll(".shape-path")
    .data(shape.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("class", "shape-path")
    .attr("fill", "black");

  // Add the line paths to the mask in white (areas to be cut out)
  maskGroup
    .selectAll(".line-path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("class", "line-path")
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // Create a rectangle for the entire canvas
  svg
    .append("rect")
    .attr("width", WIDTH)
    .attr("height", TOTAL_HEIGHT)
    .attr("fill", "blue")
    .attr("fill", "url(#gradient)")
    .attr("mask", "url(#combinedMask)");

  // Title text
  svg
    .append("text")
    .attr("x", WIDTH / 2)
    .attr("y", PADDING)
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .attr("fill", DARK)
    .attr("class", "space-mono")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "hanging")
    .text(`${name}'s Map`);

  // Subtitle text
  svg
    .append("text")
    .attr("x", WIDTH / 2)
    .attr("y", PADDING + 28)
    .attr("font-size", "12px")
    .attr("fill", DARK)
    .attr("font-family", "'Inter', sans-serif")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "hanging")
    .text(`Healdsburg, CA`);

  // Rectangle that holds the tag
  const rectY = SHAPE_HEIGHT + TITLE_HEIGHT + PADDING * 0.5;

  // Percent Covered
  svg
    .append("text")
    .attr("x", PADDING)
    .attr("y", rectY)
    .attr("font-size", "48px")
    .attr("font-weight", "bold")
    .attr("fill", DARK)
    .attr("class", "space-mono")
    .attr("dominant-baseline", "hanging")
    .text(`${percentCovered(score)}%`);

  // KM covered
  svg
    .append("text")
    .attr("x", PADDING)
    .attr("y", rectY + 48)
    .attr("font-size", "12px")
    .attr("fill", DARK)
    .attr("font-family", "'Inter', sans-serif")
    .attr("dominant-baseline", "hanging")
    .text(
      `${metersToKilometers(score.score)} / ${metersToKilometers(score.totalScore, true)} km`
    );

  // Zuum
  svg
    .append("text")
    .attr("x", WIDTH - PADDING)
    .attr("y", rectY + 60)
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .attr("fill", DARK)
    .attr("opacity", 0.5)
    .attr("class", "space-mono")
    .attr("dominant-baseline", "text-after-edge")
    .attr("text-anchor", "end")
    .text("ミZuum");

  svg
    .append("rect")
    .attr("x", PADDING)
    .attr("y", TOTAL_HEIGHT - PADDING - 20)
    .attr("width", WIDTH - PADDING * 2)
    .attr("height", 20)
    .attr("fill", DARK)
    .attr("rx", 10)
    .attr("rx", 10);

  // Define the gradient with switched x and y
  const progGradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "prog")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  progGradient.append("stop").attr("offset", "0%").attr("stop-color", MAIN);
  progGradient.append("stop").attr("offset", "100%").attr("stop-color", LIGHT);

  svg
    .append("rect")
    .attr("x", PADDING + 4)
    .attr("y", TOTAL_HEIGHT - PADDING - 20 + 4)
    .attr("width", innerProgWidth)
    .attr("height", 12)
    .attr("fill", "url(#prog)")
    .attr("rx", 6)
    .attr("ry", 6);
};

export async function base64Map(props: MapProps) {
  const { name, data, score } = props;
  const svgElement = createVirtualSVG();
  drawGeoJSON(svgElement, name, data, score);

  console.log(`[CONVERTING TO BASE64...]`);
  return await svgToBase64(svgElement);
}
