"use client";

import PlacementProofModal from "@/components/map/PlacementProofModal";
import PlacementTargetCard from "@/components/map/PlacementTargetCard";
import TargetDetailsDrawer from "@/components/map/TargetDetailsDrawer";
import type {
  PlacementSubmissionResult,
  PlacementTarget,
  PlacementTargetStatus,
} from "@/types/placement";
import dynamic from "next/dynamic";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useEffectEvent, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

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
  placementTargetId: string;
  placementStatus: PlacementTargetStatus;
  latestSubmissionAt: string | null;
  latestVerificationScore: number | null;
  latestSubmissionId: string | null;
  latestReviewReason: string | null;
  verifiedCount: number;
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

const HOTSPOT_REVEAL_ZOOM = 15;

export default function OutreachMapDashboard() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [needRegions, setNeedRegions] = useState<MapNeedRegion[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [activeVerificationTarget, setActiveVerificationTarget] =
    useState<PlacementTarget | null>(null);
  const [submissionResult, setSubmissionResult] =
    useState<PlacementSubmissionResult | null>(null);
  const [activeHubId, setActiveHubId] = useState(hubs[0].id);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [layers, setLayers] = useState<LayerVisibility>({
    recommended: true,
    uncovered: true,
    covered: false,
    regions: true,
  });
  const [foodInsecurityCutoff, setFoodInsecurityCutoff] = useState(0.2);
  const [minimumRegionSpots, setMinimumRegionSpots] = useState(10);
  const [viewport, setViewport] = useState<MapViewportState>({ zoom: 12, bounds: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
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

  const activeHub = hubs.find((hub) => hub.id === activeHubId) ?? hubs[0];

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
    foodInsecurityCutoff,
    minimumRegionSpots,
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

  const suggestedLocations = [...rankedLocations]
    .filter((location) => location.distanceMiles <= radiusMiles)
    .slice(0, 4);
  const suggestedCardLocations = recommendedLocations.slice(0, 3);
  const selectedPlacementTarget = selectedLocation
    ? mapLocationToPlacementTarget(selectedLocation)
    : null;

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

      return nextLocations;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load OSM hotspots",
      );
      setLocations([]);
      return [];
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

  async function syncHotspots(silent = false) {
    setIsImporting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/import/osm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: activeHub.lat,
          lng: activeHub.lng,
          radiusMiles,
        }),
      });

      const payload = (await response.json()) as ImportResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to import hotspots from OSM");
      }

      await loadStoredHotspots();

      if (!silent) {
        setSyncMessage(
          `Imported ${payload.data.importedCount} hotspots around ${activeHub.name}.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import hotspots from OSM",
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function syncNycHotspots(silent = false) {
    setIsImporting(true);
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
    } finally {
      setIsImporting(false);
    }
  }

  function mapLocationToPlacementTarget(location: MapLocation): PlacementTarget {
    return {
      id: location.placementTargetId || `hotspot:${location.id}`,
      hotspotId: location.id,
      name: location.name,
      zoneName:
        location.regionName || location.neighborhood || "Selected Zone",
      type: location.category || "other",
      address: location.address || "Address unavailable",
      lat: location.lat,
      lng: location.lng,
      allowedFlyering: true,
      busyLevel:
        location.priority === "High"
          ? "high"
          : location.priority === "Medium"
            ? "medium"
            : "low",
      status: getLocationPlacementStatus(location),
      latestSubmissionAt: location.latestSubmissionAt || null,
      latestVerificationScore: location.latestVerificationScore || null,
      latestSubmissionId: location.latestSubmissionId || null,
      latestReviewReason: location.latestReviewReason || null,
      verifiedCount: location.verifiedCount || 0,
      expectedFlyerKeywords: [
        "lemontree",
        "foodhelpline.org",
        location.name,
        location.regionName,
        location.neighborhood,
      ].filter((value): value is string => Boolean(value)),
      campaignRef: location.sourceKey || null,
    };
  }

  function handleOpenVerificationForLocation(location: MapLocation) {
    setSelectedLocationId(location.id);
    setActiveVerificationTarget(mapLocationToPlacementTarget(location));
    setSubmissionResult(null);
    setIsProofModalOpen(true);
  }

  function handleOpenVerificationForSelectedLocation() {
    if (!selectedLocation) {
      return;
    }

    handleOpenVerificationForLocation(selectedLocation);
  }

  async function refreshLocationsAndReselect(locationId: string | null) {
    const nextLocations = await loadStoredHotspots(false);

    if (!locationId) {
      setSelectedLocationId(null);
      return;
    }

    const nextLocation =
      nextLocations.find((location) => location.id === locationId) || null;
    setSelectedLocationId(nextLocation ? nextLocation.id : null);

    if (nextLocation) {
      setActiveVerificationTarget(mapLocationToPlacementTarget(nextLocation));
    }
  }

  function handleVerificationSubmitted(result: PlacementSubmissionResult) {
    setSubmissionResult(result);
    setSyncMessage(
      result.status === "verified"
        ? "Placement proof verified and hotspot coverage has been refreshed."
        : result.status === "pending_review"
          ? "Placement proof submitted for review. Hotspot status has been refreshed."
          : "Placement proof was rejected. Retake guidance is now reflected on the hotspot.",
    );
    void refreshLocationsAndReselect(
      result.hotspotId || selectedLocationId || activeVerificationTarget?.hotspotId || null,
    );
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
          <button
            onClick={() => void syncNycHotspots()}
            disabled={isImporting}
            style={{
              ...toolButtonStyle,
              background: "linear-gradient(135deg, #f5c842 0%, #f59e0b 100%)",
              color: "#1a1000",
              border: "1px solid rgba(245,200,66,0.36)",
              opacity: isImporting ? 0.72 : 1,
            }}
          >
            {isImporting ? "Syncing NYC..." : "Sync NYC"}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
              <select
                value={activeHubId}
                onChange={(event) => {
                  const nextHubId = event.target.value;
                  setActiveHubId(nextHubId);

                  const nextHub = hubs.find((hub) => hub.id === nextHubId);
                  if (nextHub) {
                    setFocusRequest({
                      key: Date.now(),
                      lat: nextHub.lat,
                      lng: nextHub.lng,
                      zoom: 13,
                    });
                    setPriorityOrigin({
                      lat: nextHub.lat,
                      lng: nextHub.lng,
                      label: nextHub.name,
                    });
                  }
                }}
                style={fieldStyle}
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
              <div style={{ minWidth: 76, borderRadius: 14, background: "#fff6d6", border: "1px solid rgba(245,200,66,0.35)", padding: "12px 12px", fontSize: 13, fontWeight: 700, color: "#8a5a00", textAlign: "center" }}>
                {radiusMiles.toFixed(1)} mi
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <input
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={radiusMiles}
                onChange={(event) => setRadiusMiles(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <p style={{ fontSize: 11.5, color: "#8a7a50", marginTop: 6 }}>
                Radius used for suggested stops and current-hub OSM imports.
              </p>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: "#8a7a50", fontWeight: 700 }}>
                  Food insecurity cutoff
                </span>
                <span style={{ fontSize: 11.5, color: "#8a5a00", fontWeight: 800 }}>
                  {formatPercent(foodInsecurityCutoff)}
                </span>
              </div>
              <input
                type="range"
                min={0.08}
                max={0.32}
                step={0.01}
                value={foodInsecurityCutoff}
                onChange={(event) => setFoodInsecurityCutoff(Number(event.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: "#8a7a50", fontWeight: 700 }}>
                  Min spots per highlighted area
                </span>
                <span style={{ fontSize: 11.5, color: "#8a5a00", fontWeight: 800 }}>
                  {minimumRegionSpots}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={20}
                step={1}
                value={minimumRegionSpots}
                onChange={(event) => setMinimumRegionSpots(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <p style={{ fontSize: 11.5, color: "#8a7a50", marginTop: 6 }}>
                Sparse regions are skipped and replaced by the next highest-need region with enough spots.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <button
                onClick={() => void syncHotspots()}
                disabled={isImporting}
                style={{
                  padding: "7px 11px",
                  borderRadius: 999,
                  border: "1px solid rgba(245,200,66,0.28)",
                  background: "#fff6d6",
                  color: "#8a5a00",
                  fontSize: 11.5,
                  fontWeight: 700,
                  opacity: isImporting ? 0.72 : 1,
                }}
              >
                Sync Current Hub
              </button>
            </div>

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
                Default view shows top recommended spots and high-need regions first.
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
                  label="Needs coverage"
                  icon={
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: "#64748b",
                        border: "3px solid #ffffff",
                        boxShadow: "0 6px 14px rgba(100,116,139,0.18)",
                        display: "inline-block",
                      }}
                    />
                  }
                />
                <LegendItem
                  label="Pending review"
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
                  label="Retake needed"
                  icon={
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: "#ef4444",
                        border: "3px solid #ffffff",
                        boxShadow: "0 6px 14px rgba(239,68,68,0.18)",
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

      {suggestedCardLocations.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 18,
            width: 360,
            maxWidth: "calc(100vw - 36px)",
            zIndex: 500,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              borderRadius: 22,
              padding: "14px 14px 12px",
              background: "rgba(255,252,244,0.95)",
              border: "1px solid rgba(190,155,70,0.16)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 18px 40px rgba(32,24,8,0.12)",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8a7a50",
              }}
            >
              Recommended hotspots
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestedCardLocations.map((location) => (
                <PlacementTargetCard
                  key={location.id}
                  target={mapLocationToPlacementTarget(location)}
                  selected={location.id === selectedLocationId}
                  distanceLabel={`${location.distanceMiles.toFixed(1)} mi away`}
                  onSelect={() => setSelectedLocationId(location.id)}
                  onVerify={() => handleOpenVerificationForLocation(location)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <TargetDetailsDrawer
        open={Boolean(selectedLocation && selectedPlacementTarget)}
        location={
          selectedLocation
            ? {
                id: selectedLocation.id,
                name: selectedLocation.name,
                address: selectedLocation.address,
                regionName: selectedLocation.regionName,
                regionNeedScore: selectedLocation.regionNeedScore,
                derivedPriority: selectedLocation.derivedPriority,
                distanceMiles: selectedLocation.distanceMiles,
                priorityScore: selectedLocation.priorityScore,
                notes: selectedLocation.notes,
                latestVerificationScore: selectedLocation.latestVerificationScore,
                latestReviewReason: selectedLocation.latestReviewReason,
                verifiedCount: selectedLocation.verifiedCount,
              }
            : null
        }
        target={selectedPlacementTarget}
        suggestions={suggestedLocations.map((location) => ({
          id: location.id,
          target: mapLocationToPlacementTarget(location),
          distanceLabel: `${location.distanceMiles.toFixed(1)} mi away`,
          selected: location.id === selectedLocationId,
        }))}
        onClose={() => setSelectedLocationId(null)}
        onOpenDirections={() => {
          if (selectedLocation) {
            openGoogleMapsLocation(selectedLocation);
          }
        }}
        onOpenVerification={handleOpenVerificationForSelectedLocation}
        onOpenVerificationForSuggestion={(locationId) => {
          const nextLocation =
            rankedLocations.find((location) => location.id === locationId) || null;
          if (nextLocation) {
            handleOpenVerificationForLocation(nextLocation);
          }
        }}
        onSelectSuggestion={setSelectedLocationId}
      />

      <PlacementProofModal
        open={isProofModalOpen}
        target={activeVerificationTarget}
        onClose={() => setIsProofModalOpen(false)}
        onSubmitted={handleVerificationSubmitted}
      />

      {submissionResult && !isProofModalOpen && (
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: suggestedCardLocations.length > 0 ? 304 : 18,
            zIndex: 500,
            pointerEvents: "none",
          }}
        >
          <div style={statusChipStyle}>
            Last proof: {submissionResult.status.replace("_", " ")} · score{" "}
            {submissionResult.verificationScore}
          </div>
        </div>
      )}

      {(isLoading || errorMessage) && (
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: suggestedCardLocations.length > 0 ? 340 : 18,
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

const toolButtonStyle: CSSProperties = {
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

const fieldStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(190,155,70,0.18)",
  background: "#ffffff",
  padding: "12px 14px",
  fontSize: 13,
  color: "#1a1600",
  outline: "none",
};

const statusChipStyle: CSSProperties = {
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
      if (!isLocationVisuallyCovered(location)) {
        merged.set(location.id, location);
      }
    }
  }

  if (layers.covered) {
    for (const location of locations) {
      if (isLocationVisuallyCovered(location)) {
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
    !isLocationVisuallyCovered(location) &&
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
      const coverageComponent = isLocationVisuallyCovered(location) ? -2.5 : 3.8;
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

function getLocationPlacementStatus(
  location: Pick<MapLocation, "placementStatus" | "covered">,
): PlacementTargetStatus {
  if (location.placementStatus) {
    return location.placementStatus;
  }

  return location.covered ? "verified" : "not_started";
}

function isLocationVisuallyCovered(
  location: Pick<MapLocation, "placementStatus" | "covered">,
) {
  return getLocationPlacementStatus(location) === "verified";
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

function formatPercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "--";
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function LegendItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
