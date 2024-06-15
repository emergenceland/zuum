import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import { useMemo, useRef } from "react";
import { FeatureCollection } from "@turf/turf";
import { Geometry } from "geojson";
import shapeData from "../data/shapefile_healdsburg.json";
import { DARK, LIGHT, MAIN } from "../lib/styles";
import { Score } from "../types/types";
import { metersToKilometers } from "../lib/utils";

const shape = shapeData as FeatureCollection<Geometry>;

const scale = 2;

const WIDTH = 300 * scale;
const TITLE_HEIGHT = 50 * scale;
const SHAPE_HEIGHT = 325 * scale;
const TAG_HEIGHT = 92 * scale;
const PADDING = 24 * scale;

const TOTAL_HEIGHT = SHAPE_HEIGHT + TAG_HEIGHT + TITLE_HEIGHT + PADDING * 1.5;

const SVGtoPNG = (
  svgElement: SVGSVGElement,
  scaleFactor = 4
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgElement.clientWidth * scaleFactor;
      canvas.height = svgElement.clientHeight * scaleFactor;
      const context = canvas.getContext("2d");

      if (context) {
        context.scale(scaleFactor, scaleFactor);
        context.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(svgUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create PNG blob"));
          }
        }, "image/png");
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Failed to load SVG image"));
    };
    img.src = svgUrl;
  });
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};

const shareImage = async (svgElement: SVGSVGElement) => {
  try {
    const pngBlob = await SVGtoPNG(svgElement);
    const file = new File([pngBlob], "map.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Map",
        text: "Check out this map!",
      });
    } else {
      console.log(`no navigator share, downloading...`);
      download(pngBlob, "map.png");
    }
  } catch (error) {
    console.error("Error sharing image:", error);
  }
};

type ShareButtonProps = {
  name: string;
  data: FeatureCollection<Geometry>;
  score: Score;
};

export default function ShareButton(props: ShareButtonProps) {
  const { name, data, score } = props;
  const svgRef = useRef<SVGSVGElement>(null);

  /* SCORE VALUES */
  const percentCovered = useMemo(() => {
    return Math.round((score.score / score.totalScore) * 100);
  }, [score]);

  const outerProgWidth = WIDTH - PADDING * 2;
  const innerProgWidth = outerProgWidth * (percentCovered / 100) - 8;

  const drawGeoJSON = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll().remove();

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
      .attr("stroke-width", 2);

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
      .attr("font-size", 20 * scale)
      .attr("font-weight", "bold")
      .attr("fill", DARK)
      .attr("font-family", "'Space Mono', monospace")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .text(`${name}'s Map`);

    // Subtitle text
    svg
      .append("text")
      .attr("x", WIDTH / 2)
      .attr("y", PADDING + 28 * scale)
      .attr("font-size", 12 * scale)
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
      .attr("font-size", 48 * scale)
      .attr("font-weight", "bold")
      .attr("fill", DARK)
      .attr("font-family", "'Space Mono', monospace")
      .attr("dominant-baseline", "hanging")
      .text(`${percentCovered}%`);

    // KM covered
    svg
      .append("text")
      .attr("x", PADDING)
      .attr("y", rectY + 48 * scale)
      .attr("font-size", 12 * scale)
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
      .attr("y", rectY + 60 * scale)
      .attr("font-size", 20 * scale)
      .attr("font-weight", "bold")
      .attr("fill", DARK)
      .attr("opacity", 0.5)
      .attr("font-family", "'Space Mono', monospace")
      .attr("dominant-baseline", "text-after-edge")
      .attr("text-anchor", "end")
      .text("ミZuum");

    const progY = TOTAL_HEIGHT - PADDING - 20 * scale;

    svg
      .append("rect")
      .attr("x", PADDING)
      .attr("y", progY)
      .attr("width", WIDTH - PADDING * 2)
      .attr("height", 20 * scale)
      .attr("fill", DARK)
      .attr("rx", 10 * scale)
      .attr("rx", 10 * scale);

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
    progGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", LIGHT);

    svg
      .append("rect")
      .attr("x", PADDING + 4 * scale)
      .attr("y", progY + 4 * scale)
      .attr("width", innerProgWidth)
      .attr("height", 12 * scale)
      .attr("fill", "url(#prog)")
      .attr("rx", 6 * scale)
      .attr("ry", 6 * scale);
  };

  const handleMapExport = () => {
    drawGeoJSON();
    setTimeout(() => {
      const svgElement = svgRef.current;
      if (svgElement) {
        console.log(`[SHARING...]`);
        shareImage(svgElement);
      }
    }, 100);
  };

  return (
    <>
      <div className="absolute opacity-0" style={{ top: -10000, left: -10000 }}>
        <svg
          ref={svgRef}
          width={WIDTH}
          height={TOTAL_HEIGHT}
          style={{
            backgroundColor: DARK,
          }}
        />
      </div>
      <button
        className="px-4 py-3 bg-dark rounded-2xl text-white font-bold flex flex-row gap-2 items-center"
        onClick={handleMapExport}
      >
        Share Map ✨
      </button>
    </>
  );
}
