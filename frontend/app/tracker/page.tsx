"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import PageContainer from "@/components/layout/PageContainer";
import SessionSummary from "@/components/tracker/SessionSummary";
import TrackerControls from "@/components/tracker/TrackerControls";
import TrackerMap from "@/components/tracker/TrackerMap";
import { calculateRouteDistanceMeters, formatDistance } from "@/lib/distance";
import {
  createRoutePoint,
  getGeolocationErrorMessage,
  shouldAppendRoutePoint,
  startLocationWatch,
  stopLocationWatch,
} from "@/lib/geolocation";
import {
  completeSession,
  createSession,
  createSessionStop,
  formatDuration,
} from "@/lib/session";
import type {
  RoutePoint,
  SessionApiResponse,
  StopType,
  VolunteerSession,
} from "@/types/tracker";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5001";

export default function TrackerPage() {
  const watchIdRef = useRef<number | null>(null);
  const [activeSession, setActiveSession] = useState<VolunteerSession | null>(null);
  const [lastCompletedSession, setLastCompletedSession] = useState<VolunteerSession | null>(null);
  const [currentPoint, setCurrentPoint] = useState<RoutePoint | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready to start a volunteer route.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const isTracking = activeSession?.status === "tracking";
  const summarySession = activeSession ?? lastCompletedSession;
  const displayedRoutePoints = activeSession?.routePoints ?? lastCompletedSession?.routePoints ?? [];
  const displayedStops = activeSession?.stops ?? lastCompletedSession?.stops ?? [];

  useEffect(() => {
    return () => {
      stopLocationWatch(watchIdRef.current);
    };
  }, []);

  const liveStats = useMemo(() => {
    if (!activeSession) {
      return {
        points: 0,
        stops: 0,
        duration: "0s",
        distance: "0 m",
      };
    }

    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(activeSession.startTime).getTime()) / 1000),
    );

    return {
      points: activeSession.routePoints.length,
      stops: activeSession.stops.length,
      duration: formatDuration(durationSeconds),
      distance: formatDistance(activeSession.totalDistanceMeters),
    };
  }, [activeSession]);

  function handlePosition(position: GeolocationPosition) {
    const nextPoint = createRoutePoint(position);
    setCurrentPoint(nextPoint);
    setErrorMessage(null);
    setStatusMessage("Tracking live route.");

    setActiveSession((current) => {
      if (!current) {
        return current;
      }

      const nextRoutePoints = shouldAppendRoutePoint(current.routePoints, nextPoint)
        ? [...current.routePoints, nextPoint]
        : current.routePoints;

      return {
        ...current,
        routePoints: nextRoutePoints,
        totalDistanceMeters: calculateRouteDistanceMeters(nextRoutePoints),
      };
    });
  }

  function handlePositionError(error: GeolocationPositionError) {
    stopLocationWatch(watchIdRef.current);
    watchIdRef.current = null;
    setActiveSession(null);
    setCurrentPoint(null);
    setErrorMessage(getGeolocationErrorMessage(error));
    setStatusMessage("Tracking did not start.");
  }

  function handleStartSession() {
    if (isTracking) {
      return;
    }

    setErrorMessage(null);
    setSaveState("idle");
    setSaveError(null);
    setStatusMessage("Requesting location permission...");
    setLastCompletedSession(null);
    setCurrentPoint(null);
    setActiveSession(createSession());

    try {
      watchIdRef.current = startLocationWatch(handlePosition, handlePositionError);
    } catch (error) {
      setActiveSession(null);
      setCurrentPoint(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not start geolocation tracking.",
      );
      setStatusMessage("Tracking did not start.");
    }
  }

  async function handleStopSession() {
    if (!activeSession || !isTracking) {
      setErrorMessage("No active session to stop.");
      return;
    }

    stopLocationWatch(watchIdRef.current);
    watchIdRef.current = null;

    const completed = completeSession(activeSession);
    setActiveSession(null);
    setLastCompletedSession(completed);
    setStatusMessage("Session stopped. Summary ready.");

    try {
      setSaveState("saving");
      setSaveError(null);

      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completed),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as SessionApiResponse;
      setLastCompletedSession(payload.data);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setSaveError("The session was completed locally, but saving to the backend failed.");
    }
  }

  function handleAddStop(type: StopType, label?: string) {
    if (!activeSession || !isTracking || !currentPoint) {
      setErrorMessage("Start a session before adding a stop.");
      return;
    }

    const stop = createSessionStop(currentPoint, type, label);

    setActiveSession((current) =>
      current
        ? {
            ...current,
            stops: [...current.stops, stop],
          }
        : current,
    );
    setErrorMessage(null);
    setStatusMessage(`Added ${type.replaceAll("_", " ")} stop.`);
  }

  return (
    <PageContainer style={{ paddingBottom: 36 }}>
      <div style={{ display: "grid", gap: 20 }}>
        <SectionCard
          dark
          title="Volunteer Session Route Tracker"
          subtitle="Use your browser location to record outreach walks, route paths, and stop markers in real time."
          action={
            <div
              style={{
                fontSize: 12,
                color: "rgba(245,200,66,0.72)",
                maxWidth: 240,
                textAlign: "right",
              }}
            >
              Browser geolocation + Mapbox GL + Express session storage
            </div>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <StatCard label="Status" value={isTracking ? "Tracking" : "Idle"} icon="P" iconBg="#fef3c7" />
            <StatCard label="Route Points" value={liveStats.points} icon="R" iconBg="#dbeafe" />
            <StatCard label="Distance" value={liveStats.distance} icon="D" iconBg="#dcfce7" />
            <StatCard label="Stops" value={liveStats.stops} icon="S" iconBg="#fee2e2" />
          </div>
        </SectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          <SectionCard
            title="Live Route Map"
            subtitle="Current location, route polyline, and stop markers update while a session is running."
            noPadding
          >
            <div style={{ padding: "0 24px 24px" }}>
              <TrackerMap
                routePoints={displayedRoutePoints}
                currentPoint={currentPoint}
                stops={displayedStops}
              />
            </div>
          </SectionCard>

          <div style={{ display: "grid", gap: 20 }}>
            <SectionCard title="Controls" subtitle={statusMessage}>
              <TrackerControls
                isTracking={Boolean(isTracking)}
                onStart={handleStartSession}
                onStop={handleStopSession}
                onAddStop={handleAddStop}
                isBusy={saveState === "saving"}
              />
              {errorMessage ? (
                <p style={{ marginTop: 14, fontSize: 12.5, color: "#b91c1c", lineHeight: 1.5 }}>
                  {errorMessage}
                </p>
              ) : null}
            </SectionCard>

            <SessionSummary
              session={summarySession}
              saveState={saveState}
              saveError={saveError}
            />
          </div>
        </div>

        <SectionCard title="Tracking Notes" subtitle="MVP guardrails and behavior">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <InfoTile
              title="Location filtering"
              body="Duplicate points, poor accuracy fixes, and negligible movement are ignored before updating the route."
            />
            <InfoTile
              title="Stop markers"
              body="Printer, cafe, bulletin board, community center, and custom stops are pinned using the latest valid position."
            />
            <InfoTile
              title="Persistence"
              body="Completed sessions are stored locally first, then posted to the backend session API for retrieval later."
            />
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

function InfoTile({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        background: "#fffdf5",
        border: "1px solid rgba(190,155,70,0.14)",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1600", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 12.5, color: "#8a7a50", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}
