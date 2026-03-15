"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import type { RoutePoint, SessionStop } from "@/types/tracker";

interface TrackerMapProps {
  routePoints: RoutePoint[];
  currentPoint: RoutePoint | null;
  stops: SessionStop[];
  height?: number | string;
  overlay?: ReactNode;
  onSnapshotReady?: (capture: (() => Promise<string | null>) | null) => void;
}

const FALLBACK_CENTER: [number, number] = [-73.9857, 40.7484];

export default function TrackerMap({
  routePoints,
  currentPoint,
  stops,
  height = 520,
  overlay = null,
  onSnapshotReady,
}: TrackerMapProps) {
  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const latestRoutePointsRef = useRef<RoutePoint[]>(routePoints);
  const latestStopsRef = useRef<SessionStop[]>(stops);
  const latestCurrentPointRef = useRef<RoutePoint | null>(currentPoint);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    latestRoutePointsRef.current = routePoints;
    latestStopsRef.current = stops;
    latestCurrentPointRef.current = currentPoint;
  }, [currentPoint, routePoints, stops]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (tokenMissing) {
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: FALLBACK_CENTER,
      zoom: 11,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#f4d03f",
          "line-width": 6,
          "line-opacity": 0.92,
        },
      });

      onSnapshotReady?.(async () => {
        try {
          return await captureRouteSnapshot({
            map,
            routePoints: latestRoutePointsRef.current,
            stops: latestStopsRef.current,
            currentPoint: latestCurrentPointRef.current,
          });
        } catch {
          return null;
        }
      });
    });

    map.on("error", () => {
      setMapError("The map failed to load. Check your Mapbox token and network access.");
    });

    return () => {
      onSnapshotReady?.(null);
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
      currentMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [onSnapshotReady, tokenMissing]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const handleResize = () => mapRef.current?.resize();
    const timeoutId = window.setTimeout(handleResize, 120);
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [height]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("route") as GeoJSONSource | undefined;

    source?.setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routePoints.map((point) => [point.lng, point.lat]),
      },
      properties: {},
    });
  }, [routePoints]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !currentPoint) {
      return;
    }

    if (!currentMarkerRef.current) {
      const markerElement = document.createElement("div");
      markerElement.style.width = "18px";
      markerElement.style.height = "18px";
      markerElement.style.borderRadius = "999px";
      markerElement.style.background = "#4d7c0f";
      markerElement.style.border = "3px solid white";
      markerElement.style.boxShadow = "0 0 0 8px rgba(91,145,32,0.18)";

      currentMarkerRef.current = new mapboxgl.Marker(markerElement)
        .setLngLat([currentPoint.lng, currentPoint.lat])
        .addTo(map);
    } else {
      currentMarkerRef.current.setLngLat([currentPoint.lng, currentPoint.lat]);
    }

    map.easeTo({
      center: [currentPoint.lng, currentPoint.lat],
      zoom: Math.max(map.getZoom(), 15.5),
      duration: 500,
      essential: true,
    });
  }, [currentPoint]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = stops.map((stop) => {
      const element = document.createElement("div");
      element.style.width = "14px";
      element.style.height = "14px";
      element.style.borderRadius = "999px";
      element.style.background = "#5d8c2a";
      element.style.border = "2px solid #fefce8";
      element.style.boxShadow = "0 4px 12px rgba(93,140,42,0.35)";

      const popupContent = document.createElement("div");
      popupContent.style.fontSize = "12px";
      popupContent.style.lineHeight = "1.4";

      const title = document.createElement("strong");
      title.textContent = stop.type.replaceAll("_", " ");
      popupContent.appendChild(title);

      if (stop.label) {
        const label = document.createElement("div");
        label.textContent = stop.label;
        popupContent.appendChild(label);
      }

      return new mapboxgl.Marker(element)
        .setLngLat([stop.lng, stop.lat])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setDOMContent(popupContent))
        .addTo(map);
    });
  }, [stops]);

  return (
    <div
      style={{
        position: "relative",
        height,
        borderRadius: 24,
        overflow: "hidden",
        background: "linear-gradient(160deg, #efe7cd 0%, #f8f3e3 100%)",
        border: "1px solid rgba(190,155,70,0.18)",
        boxShadow: "0 18px 38px rgba(190,155,70,0.14)",
      }}
    >
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(26,18,0,0.42) 0%, rgba(26,18,0,0.14) 18%, rgba(26,18,0,0) 36%, rgba(26,18,0,0) 64%, rgba(26,18,0,0.18) 84%, rgba(26,18,0,0.48) 100%)",
          pointerEvents: "none",
        }}
      />
      {overlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          {overlay}
        </div>
      ) : null}
      {tokenMissing || mapError ? (
        <div
          style={{
            position: "absolute",
            inset: 16,
            borderRadius: 16,
            background: "rgba(26,18,0,0.78)",
            color: "#f8f1d8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
            lineHeight: 1.5,
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Map unavailable</p>
            <p style={{ fontSize: 13 }}>
              {tokenMissing
                ? "Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to render the live map."
                : mapError}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function captureRouteSnapshot({
  map,
  routePoints,
  stops,
  currentPoint,
}: {
  map: mapboxgl.Map;
  routePoints: RoutePoint[];
  stops: SessionStop[];
  currentPoint: RoutePoint | null;
}) {
  const canvas = map.getCanvas();
  if (!canvas.width || !canvas.height) {
    return null;
  }

  const snapshotCanvas = document.createElement("canvas");
  snapshotCanvas.width = canvas.width;
  snapshotCanvas.height = canvas.height;
  const context = snapshotCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  const originalView = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };

  const pointsForBounds = [
    ...routePoints.map((point) => [point.lng, point.lat] as [number, number]),
    ...stops.map((stop) => [stop.lng, stop.lat] as [number, number]),
  ];

  if (pointsForBounds.length > 0) {
    const bounds = pointsForBounds.reduce(
      (accumulator, coordinate) => accumulator.extend(coordinate),
      new mapboxgl.LngLatBounds(pointsForBounds[0], pointsForBounds[0])
    );

    map.fitBounds(bounds, {
      padding: 56,
      maxZoom: 15.5,
      duration: 0,
      essential: true,
    });

    await waitForMapIdle(map);
  }

  context.drawImage(canvas, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

  drawRouteLine(context, map, routePoints);
  drawStopMarkers(context, map, stops);
  drawTerminalMarker(context, map, routePoints[0], "#f8df5e", "#31401f", "S");
  drawTerminalMarker(
    context,
    map,
    currentPoint ?? routePoints[routePoints.length - 1],
    "#6f8f2f",
    "#fffdf2",
    "E"
  );

  map.jumpTo({
    center: originalView.center,
    zoom: originalView.zoom,
    bearing: originalView.bearing,
    pitch: originalView.pitch,
  });

  return snapshotCanvas.toDataURL("image/jpeg", 0.82);
}

function drawRouteLine(
  context: CanvasRenderingContext2D,
  map: mapboxgl.Map,
  routePoints: RoutePoint[]
) {
  if (routePoints.length < 2) {
    return;
  }

  context.save();
  context.beginPath();
  routePoints.forEach((point, index) => {
    const projected = map.project([point.lng, point.lat]);
    if (index === 0) {
      context.moveTo(projected.x, projected.y);
    } else {
      context.lineTo(projected.x, projected.y);
    }
  });
  context.strokeStyle = "#f4d03f";
  context.lineWidth = 7;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.shadowColor = "rgba(49,64,31,0.26)";
  context.shadowBlur = 12;
  context.stroke();
  context.restore();
}

function drawStopMarkers(
  context: CanvasRenderingContext2D,
  map: mapboxgl.Map,
  stops: SessionStop[]
) {
  stops.forEach((stop) => {
    const projected = map.project([stop.lng, stop.lat]);

    context.save();
    context.beginPath();
    context.arc(projected.x, projected.y, 9, 0, Math.PI * 2);
    context.fillStyle = "#5d8c2a";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#fff8d6";
    context.stroke();
    context.restore();
  });
}

function drawTerminalMarker(
  context: CanvasRenderingContext2D,
  map: mapboxgl.Map,
  point: RoutePoint | undefined,
  fillColor: string,
  textColor: string,
  label: string
) {
  if (!point) {
    return;
  }

  const projected = map.project([point.lng, point.lat]);

  context.save();
  context.beginPath();
  context.arc(projected.x, projected.y, 13, 0, Math.PI * 2);
  context.fillStyle = fillColor;
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "#fffdf2";
  context.stroke();
  context.fillStyle = textColor;
  context.font = "700 11px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, projected.x, projected.y + 0.5);
  context.restore();
}

function waitForMapIdle(map: mapboxgl.Map) {
  return new Promise<void>((resolve) => {
    if (map.loaded()) {
      requestAnimationFrame(() => resolve());
      return;
    }

    map.once("idle", () => resolve());
  });
}
