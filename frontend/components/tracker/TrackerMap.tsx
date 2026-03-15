"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import type { RoutePoint, SessionStop } from "@/types/tracker";

interface TrackerMapProps {
  routePoints: RoutePoint[];
  currentPoint: RoutePoint | null;
  stops: SessionStop[];
}

const FALLBACK_CENTER: [number, number] = [-73.9857, 40.7484];

export default function TrackerMap({
  routePoints,
  currentPoint,
  stops,
}: TrackerMapProps) {
  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const currentMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

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
      style: "mapbox://styles/mapbox/streets-v12",
      center: FALLBACK_CENTER,
      zoom: 11,
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
          "line-color": "#f59e0b",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });
    });

    map.on("error", () => {
      setMapError("The map failed to load. Check your Mapbox token and network access.");
    });

    return () => {
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current = [];
      currentMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [tokenMissing]);

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
      markerElement.style.background = "#2563eb";
      markerElement.style.border = "3px solid white";
      markerElement.style.boxShadow = "0 0 0 8px rgba(37,99,235,0.18)";

      currentMarkerRef.current = new mapboxgl.Marker(markerElement)
        .setLngLat([currentPoint.lng, currentPoint.lat])
        .addTo(map);
    } else {
      currentMarkerRef.current.setLngLat([currentPoint.lng, currentPoint.lat]);
    }

    map.easeTo({
      center: [currentPoint.lng, currentPoint.lat],
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
      element.style.background = "#15803d";
      element.style.border = "2px solid #fefce8";
      element.style.boxShadow = "0 4px 12px rgba(21,128,61,0.35)";

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
        height: 520,
        borderRadius: 18,
        overflow: "hidden",
        background: "linear-gradient(160deg, #efe7cd 0%, #f8f3e3 100%)",
        border: "1px solid rgba(190,155,70,0.18)",
      }}
    >
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
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
