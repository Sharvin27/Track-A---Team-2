"use client";

import dynamic from "next/dynamic";
import { useEffect, useEffectEvent, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

export type MapHub = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type MapLocation = {
  id: string;
  sourceKey: string;
  osmId: string;
  osmType: string;
  name: string;
  address: string;
  neighborhood: string;
  regionCode: string | null;
  regionName: string | null;
  regionNeedScore: number | null;
  category: string;
  priority: "High" | "Medium" | "Low";
  score: number;
  covered: boolean;
  lastChecked: string;
  assignedTo: string;
  notes: string;
  lat: number;
  lng: number;
  importedAt: string;
};

export type MapNeedRegion = {
  id: string;
  regionCode: string;
  regionName: string;
  boroughName: string;
  regionType: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  centroidLat: number;
  centroidLng: number;
  foodInsecurePercentage: number | null;
  foodNeedScore: number;
  weightedRank: number | null;
  sourceYear: string;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapViewportState = {
  zoom: number;
  bounds: MapBounds | null;
};

export type MapFocusRequest = {
  key: number;
  lat: number;
  lng: number;
  zoom?: number;
  bounds?: [number, number, number, number];
};

type DistanceLocation = MapLocation & { distanceMiles: number };
type RankedLocation = DistanceLocation & {
  priorityScore: number;
  derivedPriority: "High" | "Medium" | "Low";
  suitabilityScore: number;
  needComponent: number;
  distanceComponent: number;
  coverageComponent: number;
  gapBonus: number;
};
type LayerVisibility = {
  recommended: boolean;
  uncovered: boolean;
  covered: boolean;
  regions: boolean;
};
type PriorityOrigin = {
  lat: number;
  lng: number;
  label: string;
};

type LocationsResponse = {
  success: boolean;
  count: number;
  data: MapLocation[];
  message?: string;
};

type ImportResponse = {
  success: boolean;
  data?: {
    importedCount: number;
    sourceCount: number;
    importedAt: string;
    regions?: { region: string; importedCount: number; sourceCount: number }[];
    failures?: { region: string; message: string }[];
  };
  message?: string;
};

type UpdateLocationResponse = {
  success: boolean;
  data?: MapLocation;
  message?: string;
};

type NeedRegionsResponse = {
  success: boolean;
  count: number;
  data: MapNeedRegion[];
  message?: string;
};

type NeedRegionImportResponse = {
  success: boolean;
  data?: {
    importedCount: number;
    sourceCount: number;
    sourceYear: string;
    annotatedHotspotCount: number;
  };
  message?: string;
};

const OutreachMapCanvas = dynamic(() => import("./OutreachMapCanvas"), {
  ssr: false,
});

const hubs: MapHub[] = [
  { id: "hub-manhattan", name: "Manhattan Volunteer Base", lat: 40.7831, lng: -73.9712 },
  { id: "hub-bronx", name: "Bronx Outreach Hub", lat: 40.8448, lng: -73.8648 },
  { id: "hub-brooklyn", name: "Brooklyn Print Room", lat: 40.6782, lng: -73.9442 },
  { id: "hub-queens", name: "Queens Meetup", lat: 40.7282, lng: -73.7949 },
  { id: "hub-staten", name: "Staten Island Base", lat: 40.5795, lng: -74.1502 },
];

const priorityStyle = {
  High: { bg: "rgba(239,68,68,0.14)", color: "#b91c1c" },
  Medium: { bg: "rgba(245,158,11,0.16)", color: "#b45309" },
  Low: { bg: "rgba(34,197,94,0.14)", color: "#15803d" },
};

const HOTSPOT_REVEAL_ZOOM = 15;

export default function OutreachMapDashboard() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [needRegions, setNeedRegions] = useState<MapNeedRegion[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>({
    recommended: true,
    uncovered: true,
    covered: false,
    regions: true,
  });
  const [viewport, setViewport] = useState<MapViewportState>({ zoom: 12, bounds: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasAutoSeeded, setHasAutoSeeded] = useState(false);
  const [hasAutoSeededRegions, setHasAutoSeededRegions] = useState(false);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [priorityOrigin, setPriorityOrigin] = useState<PriorityOrigin>({
    lat: hubs[0].lat,
    lng: hubs[0].lng,
    label: hubs[0].name,
  });

  const locationsWithDistance: DistanceLocation[] = locations.map((location) => ({
    ...location,
    distanceMiles: getDistanceMiles(
      priorityOrigin.lat,
      priorityOrigin.lng,
      location.lat,
      location.lng,
    ),
  }));

  const regionLocationCounts = getRegionLocationCounts(locationsWithDistance);
  const highlightedRegions = getHighlightedRegions(
    needRegions,
    regionLocationCounts,
    viewport.zoom,
    0.2,
    10,
  );
  const highlightedRegionCodes = new Set(highlightedRegions.map((region) => region.regionCode));
  const rankedLocations = rankLocations(
    locationsWithDistance,
    highlightedRegionCodes,
    regionLocationCounts,
  );
  const recommendedTargetCount = Math.max(
    1,
    Math.round(locationsWithDistance.length * 0.2),
  );
  const recommendedLocations = rankedLocations.filter((location) =>
    isRecommendedLocation(location, highlightedRegionCodes),
  ).slice(0, recommendedTargetCount);
  const layeredLocations = getLayeredLocations(rankedLocations, recommendedLocations, layers);
  const recommendedLocationIds = recommendedLocations.map((location) => location.id);
  const visibleLocations = getVisibleLocations(
    rankLocations(layeredLocations, highlightedRegionCodes, regionLocationCounts),
    viewport,
    highlightedRegionCodes,
  );

  const selectedLocation =
    rankedLocations.find((location) => location.id === selectedLocationId) || null;

  const runInitialLoad = useEffectEvent(() => {
    void loadStoredHotspots(true);
    void loadNeedRegions(true);
  });

  const runLocationSearch = useEffectEvent((query: string) => {
    void searchForLocation(query);
  });

  useEffect(() => {
    runInitialLoad();
  }, []);

  useEffect(() => {
    function handleSearch(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        runLocationSearch(detail);
      }
    }

    window.addEventListener("lemontree:map-search", handleSearch as EventListener);

    return () => {
      window.removeEventListener("lemontree:map-search", handleSearch as EventListener);
    };
  }, []);

  async function loadStoredHotspots(autoSeedIfEmpty = false) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        limit: "15000",
      });

      const response = await fetch(`${API_BASE_URL}/api/locations?${params.toString()}`);
      const payload = (await response.json()) as LocationsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load stored hotspots");
      }

      const nextLocations = payload.data || [];
      setLocations(nextLocations);

      if (nextLocations.length === 0 && autoSeedIfEmpty && !hasAutoSeeded) {
        setHasAutoSeeded(true);
        void syncNycHotspots(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load OSM hotspots",
      );
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNeedRegions(autoSeedIfEmpty = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/need-regions`);
      const payload = (await response.json()) as NeedRegionsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load need regions");
      }

      const nextRegions = payload.data || [];
      setNeedRegions(nextRegions);

      if (nextRegions.length === 0 && autoSeedIfEmpty && !hasAutoSeededRegions) {
        setHasAutoSeededRegions(true);
        void syncNeedRegions(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load need regions",
      );
    }
  }

  async function syncNeedRegions(silent = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/need-regions/import/nyc-open-data`, {
        method: "POST",
      });
      const payload = (await response.json()) as NeedRegionImportResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to import NYC need regions");
      }

      await loadNeedRegions();

      if (!silent) {
        setSyncMessage(
          `Imported ${payload.data.importedCount} NYC need regions from ${payload.data.sourceYear} data.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import NYC need regions",
      );
    }
  }

  async function searchForLocation(query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    setIsSearching(true);
    setErrorMessage(null);
    setSyncMessage(null);

    try {
      const params = new URLSearchParams({
        q: normalizedQuery.includes("New York")
          ? normalizedQuery
          : `${normalizedQuery}, New York City`,
        format: "jsonv2",
        limit: "1",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      );
      const payload = (await response.json()) as Array<{
        lat: string;
        lon: string;
        boundingbox?: [string, string, string, string];
      }>;

      if (!response.ok || payload.length === 0) {
        throw new Error("Location not found. Try a neighborhood or street address.");
      }

      const firstMatch = payload[0];
      const resultLat = Number(firstMatch.lat);
      const resultLng = Number(firstMatch.lon);

      setFocusRequest({
        key: Date.now(),
        lat: resultLat,
        lng: resultLng,
        zoom: getSearchZoom(normalizedQuery),
      });
      setPriorityOrigin({
        lat: resultLat,
        lng: resultLng,
        label: normalizedQuery,
      });
      setShowTools(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to search for location",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function syncNycHotspots(silent = false) {
    setErrorMessage(null);

    try {
      await syncNeedRegions(true);
      const response = await fetch(`${API_BASE_URL}/api/locations/import/osm/nyc`, {
        method: "POST",
      });

      const payload = (await response.json()) as ImportResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to import NYC hotspots from OSM");
      }

      await loadStoredHotspots();
      await loadNeedRegions();

      if (!silent) {
        const failedRegions = payload.data.failures?.length ?? 0;
        setSyncMessage(
          failedRegions > 0
            ? `Imported region overlays and ${payload.data.importedCount} hotspot records. ${failedRegions} hotspot region${failedRegions === 1 ? "" : "s"} still failed and can be retried.`
            : `Imported NYC need regions and ${payload.data.importedCount} hotspot records across all 5 boroughs.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import NYC hotspots from OSM",
      );
    }
  }

  async function toggleCovered(id: string, covered: boolean) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          covered: !covered,
          lastChecked: "Just now",
          assignedTo: !covered ? "Volunteer confirmed" : "Open shift",
        }),
      });

      const payload = (await response.json()) as UpdateLocationResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to update hotspot");
      }

      setLocations((current) =>
        current.map((location) =>
          location.id === payload.data?.id ? payload.data : location,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update hotspot",
      );
    }
  }

  function openGoogleMapsLocation(location: RankedLocation) {
    const params = new URLSearchParams({
      q: `${location.name} ${location.address}`.trim(),
    });

    window.open(`https://www.google.com/maps/search/?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        minHeight: 640,
        overflow: "hidden",
        background: "#dbe7dd",
      }}
    >
      <OutreachMapCanvas
        locations={visibleLocations}
        highlightedRegions={layers.regions ? highlightedRegions : []}
        recommendedLocationIds={recommendedLocationIds}
        selectedLocation={selectedLocation}
        focusRequest={focusRequest}
        onSelect={setSelectedLocationId}
        onMapClick={() => setSelectedLocationId(null)}
        onViewportChange={setViewport}
      />

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          <button
            onClick={() => setShowTools((current) => !current)}
            style={toolButtonStyle}
          >
            {showTools ? "Close Tools" : "Map Tools"}
          </button>
        </div>

        {showTools && (
          <div
            style={{
              width: 320,
              maxWidth: "calc(100vw - 36px)",
              borderRadius: 22,
              padding: "16px 16px 14px",
              background: "rgba(255,252,244,0.95)",
              border: "1px solid rgba(190,155,70,0.18)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 18px 40px rgba(32,24,8,0.12)",
              pointerEvents: "auto",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11.5, color: "#8a7a50", fontWeight: 700, marginBottom: 8 }}>
                Map layers
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  ["recommended", "Recommended"],
                  ["uncovered", "Uncovered"],
                  ["covered", "Covered"],
                  ["regions", "High-need regions"],
                ].map(([key, label]) => {
                  const layerKey = key as keyof LayerVisibility;
                  const active = layers[layerKey];

                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setLayers((current) => ({
                          ...current,
                          [layerKey]: !current[layerKey],
                        }))
                      }
                      style={{
                        padding: "7px 11px",
                        borderRadius: 999,
                        border: `1px solid ${active ? "#f5c842" : "rgba(190,155,70,0.18)"}`,
                        background: active ? "#fff1b8" : "#fffaf0",
                        color: active ? "#8a5a00" : "#7a6a40",
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11.5, color: "#8a7a50", marginTop: 6 }}>
                Default view shows recommended, uncovered, and high-need regions first.
              </p>
            </div>

            <p style={{ marginTop: 10, fontSize: 11.5, color: "#8a7a50", lineHeight: 1.45 }}>
              Use the search bar in the page header to jump to any address,
              neighborhood, or landmark in NYC.
            </p>

            {syncMessage && (
              <p style={{ marginTop: 10, fontSize: 11.5, color: "#6b5a22", background: "#fff6d6", border: "1px solid rgba(245,200,66,0.25)", borderRadius: 12, padding: "10px 12px" }}>
                {syncMessage}
              </p>
            )}

            {errorMessage && (
              <p style={{ marginTop: 10, fontSize: 11.5, color: "#b91c1c", background: "rgba(254,226,226,0.72)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "10px 12px" }}>
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 500,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {[
          {
            key: "legend",
            content: (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <LegendItem
                  label="Recommended spot"
                  icon={
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: "#60a5fa",
                        border: "3px solid #eff6ff",
                        boxShadow: "0 6px 14px rgba(96,165,250,0.18)",
                        display: "inline-block",
                      }}
                    />
                  }
                />
                <LegendItem
                  label="Uncovered spot"
                  icon={
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: "#f59e0b",
                        border: "3px solid #ffffff",
                        boxShadow: "0 6px 14px rgba(245,158,11,0.18)",
                        display: "inline-block",
                      }}
                    />
                  }
                />
                <LegendItem
                  label="Covered spot"
                  icon={
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: "#16a34a",
                        border: "3px solid #ffffff",
                        boxShadow: "0 6px 14px rgba(22,163,74,0.18)",
                        display: "inline-block",
                      }}
                    />
                  }
                />
                <LegendItem
                  label="Higher-need region"
                  icon={
                    <span
                      style={{
                        width: 18,
                        height: 12,
                        borderRadius: 4,
                        background: "rgba(245,158,11,0.12)",
                        border: "2px solid #c2410c",
                        display: "inline-block",
                      }}
                    />
                  }
                />
              </div>
            ),
          },
          {
            key: "status",
            content:
              isSearching
                ? "Finding that area..."
                : viewport.zoom < HOTSPOT_REVEAL_ZOOM
                ? "Zoom in or search to reveal individual hotspots"
                : layeredLocations.length > visibleLocations.length
                ? "Zoom in to reveal more places"
                : "Map shows current hotspot set",
          },
        ].map((item) => (
          <div
            key={item.key}
            style={{
              pointerEvents: "auto",
              borderRadius: 999,
              padding: "10px 14px",
              background: "rgba(255,252,244,0.92)",
              boxShadow: "0 8px 24px rgba(26,22,11,0.10)",
              color: "#6f5e37",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {item.content}
          </div>
        ))}
      </div>

      {selectedLocation && (
        <div
          style={{
            position: "absolute",
            right: 18,
            top: "50%",
            transform: "translateY(-50%)",
            width: 310,
            maxWidth: "calc(100vw - 36px)",
            zIndex: 500,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              borderRadius: 22,
              padding: "16px 16px 14px",
              background: "rgba(26,22,11,0.92)",
              border: "1px solid rgba(245,200,66,0.14)",
              color: "#fff7de",
              backdropFilter: "blur(18px)",
              boxShadow: "0 22px 40px rgba(17,14,6,0.24)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,200,66,0.56)", marginBottom: 6 }}>
                  Selected Hotspot
                </p>
                <h3 style={{ fontSize: 23, lineHeight: 1.08, letterSpacing: "-0.5px" }}>
                  {selectedLocation.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLocationId(null)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff7de",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: "rgba(255,247,222,0.72)", lineHeight: 1.5, marginBottom: 12 }}>
              {selectedLocation.address}
            </p>

            {selectedLocation.regionName ? (
              <p style={{ fontSize: 12, color: "rgba(245,200,66,0.82)", marginBottom: 10 }}>
                {selectedLocation.regionName}
              </p>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: selectedLocation.covered ? "rgba(34,197,94,0.16)" : "rgba(245,158,11,0.16)", color: selectedLocation.covered ? "#86efac" : "#fcd34d", fontSize: 11.5, fontWeight: 700 }}>
                {selectedLocation.covered ? "Covered" : "Needs coverage"}
              </span>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: priorityStyle[selectedLocation.derivedPriority].bg, color: "#fff7de", fontSize: 11.5, fontWeight: 700 }}>
                {selectedLocation.derivedPriority} priority
              </span>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,247,222,0.76)", lineHeight: 1.55, marginBottom: 12 }}>
              {selectedLocation.notes}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => openGoogleMapsLocation(selectedLocation)}
                style={{
                  width: "100%",
                  borderRadius: 15,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#fff7de",
                  fontSize: 12.5,
                  fontWeight: 800,
                  boxShadow: "0 10px 22px rgba(15,23,42,0.18)",
                }}
              >
                Get directions
              </button>
              <button
                onClick={() => void toggleCovered(selectedLocation.id, selectedLocation.covered)}
                style={{
                  width: "100%",
                  borderRadius: 15,
                  padding: "12px 14px",
                  background: selectedLocation.covered
                    ? "linear-gradient(135deg, #1f8f47 0%, #166534 100%)"
                    : "linear-gradient(135deg, #f5c842 0%, #f59e0b 100%)",
                  color: selectedLocation.covered ? "#effff3" : "#1a1000",
                  fontSize: 12.5,
                  fontWeight: 800,
                  boxShadow: selectedLocation.covered
                    ? "0 10px 22px rgba(34,197,94,0.22)"
                    : "0 10px 22px rgba(245,200,66,0.22)",
                }}
              >
                {selectedLocation.covered ? "Mark as uncovered" : "Mark hotspot as covered"}
              </button>
            </div>

          </div>
        </div>
      )}

      {(isLoading || errorMessage) && (
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 18,
            zIndex: 500,
            pointerEvents: "none",
          }}
        >
          {isLoading && (
            <div style={statusChipStyle}>Loading stored hotspots...</div>
          )}
          {!isLoading && errorMessage && (
            <div style={{ ...statusChipStyle, color: "#b91c1c", background: "rgba(255,245,245,0.94)" }}>
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const toolButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,252,244,0.95)",
  border: "1px solid rgba(190,155,70,0.18)",
  boxShadow: "0 8px 24px rgba(26,22,11,0.10)",
  color: "#5f502d",
  fontSize: 12,
  fontWeight: 800,
  backdropFilter: "blur(18px)",
};

const statusChipStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,252,244,0.94)",
  boxShadow: "0 8px 24px rgba(26,22,11,0.10)",
  color: "#6f5e37",
  fontSize: 11.5,
  fontWeight: 700,
};

function getVisibleLocations(
  locations: RankedLocation[],
  viewport: MapViewportState,
  highlightedRegionCodes: Set<string>,
) {
  const bounds = viewport.bounds;
  const inBounds = bounds
    ? locations.filter((location) => isLocationInBounds(location, bounds))
    : locations;

  const sorted = [...inBounds].sort((a, b) => {
    if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore;
    return a.distanceMiles - b.distanceMiles;
  });
  const highNeedLocations = sorted.filter((location) =>
    isHighlightedRegionLocation(location, highlightedRegionCodes),
  );

  if (viewport.zoom < 11) {
    return mergeVisibleLocations(highNeedLocations, sorted.slice(0, 220));
  }

  if (viewport.zoom < 13) {
    return mergeVisibleLocations(highNeedLocations, sorted.slice(0, 420));
  }

  if (viewport.zoom < HOTSPOT_REVEAL_ZOOM) {
    return mergeVisibleLocations(highNeedLocations, sorted.slice(0, 700));
  }

  if (viewport.zoom < 16) {
    return mergeVisibleLocations(highNeedLocations, sorted.slice(0, 320));
  }

  return sorted;
}

function getHighlightedRegions(
  regions: MapNeedRegion[],
  regionLocationCounts: Map<string, number>,
  zoom: number,
  foodInsecurityCutoff: number,
  minimumRegionSpots: number,
) {
  if (regions.length === 0) return [];

  const sorted = [...regions].sort(
    (a, b) =>
      (b.foodInsecurePercentage ?? -1) - (a.foodInsecurePercentage ?? -1) ||
      b.foodNeedScore - a.foodNeedScore,
  );
  const denseRegions = sorted.filter(
    (region) => (regionLocationCounts.get(region.regionCode) ?? 0) >= minimumRegionSpots,
  );
  const preferredRegions = denseRegions.filter(
    (region) => (region.foodInsecurePercentage ?? 0) >= foodInsecurityCutoff,
  );
  const fallbackRegions = denseRegions.filter(
    (region) => (region.foodInsecurePercentage ?? 0) < foodInsecurityCutoff,
  );
  const targetCount = zoom < 11 ? 8 : zoom < 12 ? 12 : 18;

  return [...preferredRegions, ...fallbackRegions].slice(0, targetCount);
}

function getLayeredLocations(
  locations: RankedLocation[],
  recommendedLocations: RankedLocation[],
  layers: LayerVisibility,
) {
  const merged = new Map<string, RankedLocation>();

  if (layers.recommended) {
    for (const location of recommendedLocations) {
      merged.set(location.id, location);
    }
  }

  if (layers.uncovered) {
    for (const location of locations) {
      if (!location.covered) {
        merged.set(location.id, location);
      }
    }
  }

  if (layers.covered) {
    for (const location of locations) {
      if (location.covered) {
        merged.set(location.id, location);
      }
    }
  }

  return Array.from(merged.values());
}

function mergeVisibleLocations(
  priorityLocations: RankedLocation[],
  sampledLocations: RankedLocation[],
) {
  const merged = new Map<string, RankedLocation>();

  for (const location of priorityLocations) {
    merged.set(location.id, location);
  }

  for (const location of sampledLocations) {
    if (!merged.has(location.id)) {
      merged.set(location.id, location);
    }
  }

  return Array.from(merged.values());
}

function isHighlightedRegionLocation(
  location: DistanceLocation | RankedLocation,
  highlightedRegionCodes: Set<string>,
) {
  return Boolean(location.regionCode && highlightedRegionCodes.has(location.regionCode));
}

function isRecommendedLocation(
  location: RankedLocation,
  highlightedRegionCodes: Set<string>,
) {
  return (
    !location.covered &&
    location.derivedPriority === "High" &&
    location.priorityScore >= 11.5 &&
    (
      isHighlightedRegionLocation(location, highlightedRegionCodes) ||
      location.suitabilityScore >= 3 ||
      location.distanceMiles <= 1.5
    )
  );
}

function getRegionLocationCounts(locations: DistanceLocation[]) {
  const counts = new Map<string, number>();

  for (const location of locations) {
    if (!location.regionCode) continue;
    counts.set(location.regionCode, (counts.get(location.regionCode) ?? 0) + 1);
  }

  return counts;
}

function rankLocations(
  locations: DistanceLocation[],
  highlightedRegionCodes: Set<string>,
  regionLocationCounts: Map<string, number>,
) {
  return locations
    .map((location) => {
      const needComponent = getNeedComponent(location, highlightedRegionCodes);
      const coverageComponent = location.covered ? -2.5 : 3.8;
      const suitabilityScore = getSuitabilityScore(location.category);
      const distanceComponent = getDistanceComponent(location.distanceMiles);
      const gapBonus = getOutreachGapBonus(location, highlightedRegionCodes, regionLocationCounts);
      const priorityScore = Number(
        (
          needComponent +
          coverageComponent +
          suitabilityScore +
          distanceComponent +
          gapBonus
        ).toFixed(2),
      );

      return {
        ...location,
        needComponent,
        coverageComponent,
        suitabilityScore,
        distanceComponent,
        gapBonus,
        priorityScore,
        derivedPriority: getDerivedPriority(priorityScore),
      } satisfies RankedLocation;
    })
    .sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore;
      return a.distanceMiles - b.distanceMiles;
    });
}

function getNeedComponent(
  location: DistanceLocation,
  highlightedRegionCodes: Set<string>,
) {
  const regionNeedScore = location.regionNeedScore ?? 0;

  if (isHighlightedRegionLocation(location, highlightedRegionCodes)) {
    return clamp(regionNeedScore * 0.8, 2.4, 7.8);
  }

  if (regionNeedScore > 0) {
    return clamp(regionNeedScore * 0.35, 0.8, 3.1);
  }

  return 1.1;
}

function getSuitabilityScore(category: string) {
  const suitabilityByCategory: Record<string, number> = {
    Library: 3.8,
    Bookstore: 3.5,
    "Copy Shop": 3.4,
    Laundry: 3.2,
    "Community Center": 3.1,
    "Coffee Shop": 2.9,
    Marketplace: 2.6,
    Pharmacy: 2.5,
    Restaurant: 2.2,
    Supermarket: 2.2,
    Bakery: 2.0,
    Greengrocer: 2.0,
    School: 1.9,
    College: 1.9,
    "Convenience Store": 1.8,
    "Fast Food": 1.6,
    "Post Office": 1.5,
    "Variety Store": 1.4,
    "Department Store": 1.4,
    "Place of Worship": 1.2,
  };

  return suitabilityByCategory[category] ?? 1.4;
}

function getDistanceComponent(distanceMiles: number) {
  if (distanceMiles <= 0.3) return 3.6;
  if (distanceMiles <= 0.75) return 3.0;
  if (distanceMiles <= 1.5) return 2.4;
  if (distanceMiles <= 3) return 1.5;
  if (distanceMiles <= 5) return 0.8;
  return 0.2;
}

function getOutreachGapBonus(
  location: DistanceLocation,
  highlightedRegionCodes: Set<string>,
  regionLocationCounts: Map<string, number>,
) {
  if (!isHighlightedRegionLocation(location, highlightedRegionCodes) || !location.regionCode) {
    return 0;
  }

  const spotCount = regionLocationCounts.get(location.regionCode) ?? 0;

  if (spotCount <= 4) return 3;
  if (spotCount <= 8) return 2.1;
  if (spotCount <= 14) return 1.1;
  return 0.25;
}

function getDerivedPriority(score: number): "High" | "Medium" | "Low" {
  if (score >= 11.5) return "High";
  if (score >= 7) return "Medium";
  return "Low";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isLocationInBounds(location: DistanceLocation, bounds: MapBounds) {
  return (
    location.lat <= bounds.north &&
    location.lat >= bounds.south &&
    location.lng <= bounds.east &&
    location.lng >= bounds.west
  );
}

function getDistanceMiles(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function getSearchZoom(query: string) {
  const normalized = query.trim().toLowerCase();

  if (/\d/.test(normalized)) return 16;
  if (normalized.includes("street") || normalized.includes("ave") || normalized.includes("avenue")) {
    return 16;
  }

  return 15;
}

function LegendItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
