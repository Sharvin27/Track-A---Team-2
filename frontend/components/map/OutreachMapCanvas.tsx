"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import { divIcon, point } from "leaflet";
import type { LatLngExpression } from "leaflet";
import type {
  MapFocusRequest,
  MapLocation,
  MapNeedRegion,
  MapViewportState,
} from "./OutreachMapDashboard";
import type { PlacementTargetStatus } from "@/types/placement";
import { latLngBounds } from "leaflet";

const mapCenter: LatLngExpression = [40.7395, -73.9363];
const INDIVIDUAL_MARKER_ZOOM = 15;
const nycBounds = latLngBounds(
  [40.4774, -74.2591],
  [40.9176, -73.7004],
);

function createMarkerIcon(
  status: PlacementTargetStatus,
  selected: boolean,
  recommended: boolean,
) {
  const size = 18;
  const fill =
    status === "verified"
      ? "#16a34a"
      : status === "pending_review"
        ? "#f59e0b"
        : status === "rejected"
          ? "#ef4444"
          : "#64748b";
  const ring = selected ? "#1f1a0b" : recommended ? "#dbeafe" : "#ffffff";
  const shadow =
    status === "verified"
      ? "rgba(22,163,74,0.22)"
      : status === "pending_review"
        ? "rgba(245,158,11,0.24)"
        : status === "rejected"
          ? "rgba(239,68,68,0.24)"
          : recommended
            ? "rgba(96,165,250,0.30)"
            : "rgba(100,116,139,0.22)";

  return divIcon({
    className: "",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 999px;
        background: ${fill};
        border: 4px solid ${ring};
        box-shadow: 0 10px 18px ${shadow};
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createClusterIcon(
  count: number,
  kind: "recommended" | "not_started" | "pending_review" | "rejected",
) {
  const background =
    kind === "recommended"
      ? "rgba(96,165,250,0.94)"
      : kind === "pending_review"
        ? "rgba(245,158,11,0.92)"
        : kind === "rejected"
          ? "rgba(239,68,68,0.92)"
          : "rgba(100,116,139,0.92)";
  const shadow =
    kind === "recommended"
      ? "rgba(96,165,250,0.24)"
      : kind === "pending_review"
        ? "rgba(217,119,6,0.22)"
        : kind === "rejected"
          ? "rgba(239,68,68,0.22)"
          : "rgba(100,116,139,0.22)";
  const ring =
    kind === "recommended"
      ? "rgba(239,246,255,0.96)"
      : kind === "pending_review"
        ? "rgba(255,246,214,0.95)"
        : kind === "rejected"
          ? "rgba(254,226,226,0.96)"
          : "rgba(241,245,249,0.95)";

  return divIcon({
    className: "",
    html: `
      <div style="
        min-width: 34px;
        height: 34px;
        padding: 0 10px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${background};
        border: 3px solid ${ring};
        box-shadow: 0 10px 20px ${shadow};
        color: #fffdf8;
        font-size: 12px;
        font-weight: 800;
      ">${count}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function ViewportReporter({
  onViewportChange,
  onMapClick,
}: {
  onViewportChange: (viewport: MapViewportState) => void;
  onMapClick: () => void;
}) {
  const map = useMap();

  const report = useCallback(() => {
    const bounds = map.getBounds();

    onViewportChange({
      zoom: map.getZoom(),
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    });
  }, [map, onViewportChange]);

  useMapEvents({
    click: () => {
      onMapClick();
    },
    moveend: () => {
      report();
    },
    zoomend: () => {
      report();
    },
  });

  useEffect(() => {
    report();
  }, [map, report]);

  return null;
}

function InitializeNycView() {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;
    const baseZoom = map.getBoundsZoom(nycBounds, false, point(36, 36));
    const initialZoom = Math.min(baseZoom + 2, INDIVIDUAL_MARKER_ZOOM - 1);

    map.setView(nycBounds.getCenter(), initialZoom, {
      animate: true,
      duration: 0.8,
    });

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [map]);

  return null;
}

function ApplyFocusRequest({
  focusRequest,
}: {
  focusRequest: MapFocusRequest | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusRequest) return;

    map.stop();
    map.setView([focusRequest.lat, focusRequest.lng], focusRequest.zoom ?? 15, {
      animate: true,
      duration: 0.8,
    });
  }, [focusRequest, map]);

  return null;
}

export default function OutreachMapCanvas({
  locations,
  highlightedRegions,
  recommendedLocationIds,
  selectedLocation,
  focusRequest,
  onSelect,
  onMapClick,
  onViewportChange,
}: {
  locations: MapLocation[];
  highlightedRegions: MapNeedRegion[];
  recommendedLocationIds: string[];
  selectedLocation: MapLocation | null;
  focusRequest: MapFocusRequest | null;
  onSelect: (id: string) => void;
  onMapClick: () => void;
  onViewportChange: (viewport: MapViewportState) => void;
}) {
  return (
    <MapContainer
      center={mapCenter}
      zoom={10}
      zoomControl={false}
      markerZoomAnimation={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="topright" />

      <InitializeNycView />
      <ApplyFocusRequest focusRequest={focusRequest} />
      <ViewportReporter
        onViewportChange={onViewportChange}
        onMapClick={onMapClick}
      />

      {highlightedRegions.map((region) => (
        <GeoJSON
          key={region.regionCode}
          data={region.geometry}
          style={{
            color: "#c2410c",
            weight: 1.5,
            opacity: 0.7,
            fillColor: "#f59e0b",
            fillOpacity: 0.12,
          }}
          eventHandlers={{
            click: () => onMapClick(),
          }}
        />
      ))}

      <LocationMarkers
        locations={locations}
        selectedLocation={selectedLocation}
        recommendedLocationIds={recommendedLocationIds}
        onSelect={onSelect}
      />
    </MapContainer>
  );
  return null;
}

function LocationMarkers({
  locations,
  selectedLocation,
  recommendedLocationIds,
  onSelect,
}: {
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  recommendedLocationIds: string[];
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const recommendedIdSet = useMemo(
    () => new Set(recommendedLocationIds),
    [recommendedLocationIds],
  );
  const zoom = map.getZoom();
  const clusters =
    zoom < INDIVIDUAL_MARKER_ZOOM
      ? clusterLocations(locations, zoom, recommendedIdSet)
      : [];

  if (zoom < INDIVIDUAL_MARKER_ZOOM) {
    return (
      <>
        {clusters.map((cluster) => {
          if (cluster.locations.length === 1) {
            const location = cluster.locations[0];
            const selected = location.id === selectedLocation?.id;
            const recommended = recommendedIdSet.has(location.id);
            const placementStatus = getLocationPlacementStatus(location);

            return (
              <Fragment key={location.id}>
                <Marker
                  position={[location.lat, location.lng]}
                  icon={createMarkerIcon(placementStatus, selected, recommended)}
                  eventHandlers={{
                    click: () => onSelect(location.id),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <strong>{location.name}</strong>
                      <div style={{ marginTop: 4 }}>{location.address}</div>
                      <div style={{ marginTop: 6 }}>
                        {getStatusLabel(placementStatus)} · {location.category}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            );
          }

          return (
            <Marker
              key={cluster.id}
              position={[cluster.lat, cluster.lng]}
              icon={createClusterIcon(cluster.locations.length, cluster.kind)}
              eventHandlers={{
                click: () => {
                  map.setView(
                    [cluster.lat, cluster.lng],
                    Math.min(map.getZoom() + 2, INDIVIDUAL_MARKER_ZOOM),
                    { animate: true },
                  );
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: 170 }}>
                  <strong>{cluster.locations.length} spots here</strong>
                  <div style={{ marginTop: 6 }}>
                    Zoom in to reveal individual places.
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  }

  return (
    <>
      {locations.map((location) => {
        const selected = location.id === selectedLocation?.id;
        const recommended = recommendedIdSet.has(location.id);
        const placementStatus = getLocationPlacementStatus(location);

        return (
          <Fragment key={location.id}>
            <Marker
              position={[location.lat, location.lng]}
              icon={createMarkerIcon(placementStatus, selected, recommended)}
              eventHandlers={{
                click: () => onSelect(location.id),
              }}
            >
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <strong>{location.name}</strong>
                  <div style={{ marginTop: 4 }}>{location.address}</div>
                  <div style={{ marginTop: 6 }}>
                    {getStatusLabel(placementStatus)} · {location.category}
                  </div>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
}

function clusterLocations(
  locations: MapLocation[],
  zoom: number,
  recommendedIdSet: Set<string>,
) {
  const cellSize = zoom < 11 ? 0.03 : zoom < 12 ? 0.018 : 0.01;
  const clusters = new Map<
    string,
    {
      id: string;
      lat: number;
      lng: number;
      kind: "recommended" | "not_started" | "pending_review" | "rejected";
      locations: MapLocation[];
    }
  >();

  for (const location of locations) {
    const placementStatus = getLocationPlacementStatus(location);

    if (placementStatus === "verified") {
      continue;
    }

    const kind = recommendedIdSet.has(location.id)
      ? "recommended"
      : placementStatus;
    const cellKey = `${kind}:${Math.floor(location.lat / cellSize)}:${Math.floor(location.lng / cellSize)}`;
    const existing = clusters.get(cellKey);

    if (existing) {
      existing.locations.push(location);
      existing.lat =
        existing.locations.reduce((sum, item) => sum + item.lat, 0) /
        existing.locations.length;
      existing.lng =
        existing.locations.reduce((sum, item) => sum + item.lng, 0) /
        existing.locations.length;
    } else {
      clusters.set(cellKey, {
        id: cellKey,
        lat: location.lat,
        lng: location.lng,
        kind,
        locations: [location],
      });
    }
  }

  return Array.from(clusters.values());
}

function getLocationPlacementStatus(location: MapLocation): PlacementTargetStatus {
  if (location.placementStatus) {
    return location.placementStatus;
  }

  return location.covered ? "verified" : "not_started";
}

function getStatusLabel(status: PlacementTargetStatus) {
  if (status === "verified") return "Covered";
  if (status === "pending_review") return "Pending review";
  if (status === "rejected") return "Retake needed";
  return "Needs coverage";
}
