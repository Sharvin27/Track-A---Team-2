"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import { useAuth } from "@/context/AuthContext";
import { formatDistance } from "@/lib/distance";
import { formatDuration } from "@/lib/session";
import { uploadProfilePhoto } from "@/lib/auth-api";
import { getSessions } from "@/lib/session-api";
import type { VolunteerSession } from "@/types/tracker";

const badges = [
  { label: "First Flyer", earned: true, tone: "#f6e58d" },
  { label: "On a Streak", earned: true, tone: "#d9f99d" },
  { label: "Zone Explorer", earned: true, tone: "#fde68a" },
  { label: "100 Flyers", earned: true, tone: "#fef3c7" },
  { label: "Top 5", earned: false, tone: "#f1f5f9" },
  { label: "Community Star", earned: false, tone: "#f1f5f9" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatJoinedDate(value: string) {
  if (!value) return "Joined recently";
  return `Joined ${new Date(value).toLocaleString(undefined, { month: "long", year: "numeric" })}`;
}

function formatCompactHours(totalSeconds: number) {
  const hours = totalSeconds / 3600;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function buildActivityTitle(session: VolunteerSession) {
  const labeledStop = session.stops.find((stop) => stop.label?.trim());
  if (labeledStop?.label) {
    return labeledStop.label;
  }

  if (session.stops.length > 0) {
    return `${session.stops.length} outreach stop${session.stops.length === 1 ? "" : "s"}`;
  }

  return `Route Session #${session.id}`;
}

export default function ProfilePage() {
  const { user, token, loading, isGuest, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sessions, setSessions] = useState<VolunteerSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ title: string; imageUrl: string } | null>(null);
  const [routeZoom, setRouteZoom] = useState(1);
  const [photoState, setPhotoState] = useState<"idle" | "uploading" | "error">("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      if (!token || isGuest) {
        if (!cancelled) {
          setSessions([]);
          setSessionsLoading(false);
          setSessionsError(null);
        }
        return;
      }

      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const response = await getSessions(token);
        if (!cancelled) {
          setSessions(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionsError(error instanceof Error ? error.message : "Could not load activity.");
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [isGuest, token]);

  const stats = useMemo(() => {
    const totalDistanceMeters = sessions.reduce((total, session) => total + session.totalDistanceMeters, 0);
    const totalDurationSeconds = sessions.reduce((total, session) => total + session.durationSeconds, 0);
    const totalStops = sessions.reduce((total, session) => total + session.stops.length, 0);

    return [
      { label: "Route Sessions", value: sessions.length.toString(), icon: "RS", iconBg: "#fef3c7" },
      { label: "Stops Logged", value: totalStops.toString(), icon: "ST", iconBg: "#ecfccb" },
      { label: "Hours Volunteered", value: formatCompactHours(totalDurationSeconds), icon: "HR", iconBg: "#dcfce7" },
      { label: "Distance Walked", value: formatDistance(totalDistanceMeters), icon: "KM", iconBg: "#d9f99d" },
    ];
  }, [sessions]);

  const recentSessions = sessions.slice(0, 5);
  const displayName = user?.username || "Volunteer";
  const emailLabel = user?.email || "Email unavailable";
  const joinedLabel = user?.created_at ? formatJoinedDate(user.created_at) : "Joined recently";

  async function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoState("error");
      setPhotoError("Please choose an image file.");
      return;
    }

    const imageUrl = await readFileAsDataUrl(file);

    try {
      setPhotoState("uploading");
      setPhotoError(null);
      const response = await uploadProfilePhoto(token, imageUrl);
      setUser(response.user);
      setPhotoState("idle");
    } catch (error) {
      setPhotoState("error");
      setPhotoError(error instanceof Error ? error.message : "Could not upload photo.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <PageContainer style={{ padding: isMobile ? "16px 14px 28px" : "28px 32px 40px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(260px, 300px) minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <SectionCard>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 8, paddingBottom: 8 }}>
              <div
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 24,
                  marginBottom: 14,
                  background: "linear-gradient(145deg, #f4d84d 0%, #b9cf51 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#31401f",
                  boxShadow: "0 10px 24px rgba(185,207,81,0.3)",
                  overflow: "hidden",
                }}
              >
                {user?.profile_photo_url ? (
                  <Image
                    src={user.profile_photo_url}
                    alt={displayName}
                    width={82}
                    height={82}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1f2b12", letterSpacing: "-0.4px" }}>
                {displayName}
              </h2>
              <p style={{ fontSize: 13, color: "#78814f", marginTop: 3 }}>{emailLabel}</p>
              {!isGuest ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelection}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!token || photoState === "uploading"}
                    style={{
                      marginTop: 12,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(185,207,81,0.34)",
                      background: "rgba(244,216,77,0.14)",
                      color: "#4d5c1e",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    {photoState === "uploading" ? "Uploading..." : "Upload Photo"}
                  </button>
                  {photoError ? (
                    <p style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>{photoError}</p>
                  ) : null}
                </>
              ) : null}
              <div
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: user?.agreed_to_terms ? "#e7f7d6" : "#fff4d4",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: user?.agreed_to_terms ? "#4d7c0f" : "#9a6700",
                }}
              >
                {user?.agreed_to_terms ? "Verified Volunteer" : "Terms Pending"}
              </div>

              <div style={{ width: "100%", marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(190,155,70,0.18)", textAlign: "left" }}>
                {[
                  { key: "joined", accent: "#d9f99d", label: joinedLabel },
                  { key: "community", accent: "#fef3c7", label: "Community Volunteer" },
                  { key: "language", accent: "#ecfccb", label: "English, Spanish" },
                ].map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: item.accent, boxShadow: "inset 0 0 0 1px rgba(49,64,31,0.08)" }} />
                    <span style={{ fontSize: 13, color: "#5a5f2f" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Badges" subtitle="Static placeholders until achievements are modeled in the database.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 8px",
                    borderRadius: 14,
                    textAlign: "center",
                    background: badge.earned ? badge.tone : "#f8f7f0",
                    border: `1px solid ${badge.earned ? "rgba(185,207,81,0.35)" : "rgba(0,0,0,0.05)"}`,
                    opacity: badge.earned ? 1 : 0.58,
                  }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: badge.earned ? "rgba(49,64,31,0.08)" : "rgba(148,163,184,0.14)" }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#243112", lineHeight: 1.25 }}>{badge.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} iconBg={stat.iconBg} />
            ))}
          </div>

          <SectionCard title="Recent Activity" subtitle="Your last 5 saved route sessions">
            {loading || sessionsLoading ? (
              <p style={{ fontSize: 13, color: "#8a7a50" }}>Loading your profile activity...</p>
            ) : sessionsError ? (
              <p style={{ fontSize: 13, color: "#b91c1c" }}>{sessionsError}</p>
            ) : recentSessions.length === 0 ? (
              <p style={{ fontSize: 13, color: "#8a7a50" }}>No saved route sessions yet. Start a tracker session to build your activity history.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: session.routeImageUrl ? "84px minmax(0, 1fr) auto" : "minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "#fdf8ec",
                      border: "1px solid rgba(190,155,70,0.18)",
                    }}
                  >
                    {session.routeImageUrl ? (
                      <Image
                        src={session.routeImageUrl}
                        alt="Route snapshot"
                        width={84}
                        height={84}
                        unoptimized
                        style={{
                          width: 84,
                          height: 84,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid rgba(185,207,81,0.22)",
                        }}
                      />
                    ) : null}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1f2b12" }}>{buildActivityTitle(session)}</p>
                      <p style={{ fontSize: 12, color: "#7b7d43", marginTop: 3 }}>
                        {formatDistance(session.totalDistanceMeters)} walked | {formatDuration(session.durationSeconds)} | {session.stops.length} stop{session.stops.length === 1 ? "" : "s"}
                      </p>
                      {session.routeImageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRoute({
                              title: buildActivityTitle(session),
                              imageUrl: session.routeImageUrl!,
                            })
                          }
                          style={{
                            marginTop: 8,
                            padding: "7px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(185,207,81,0.34)",
                            background: "rgba(244,216,77,0.14)",
                            color: "#4d5c1e",
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        >
                          View Route
                        </button>
                      ) : null}
                    </div>
                    <span style={{ fontSize: 12, color: "#a3955e", flexShrink: 0 }}>
                      {new Date(session.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Progress to #3" subtitle="Leaderboard progress stays static until rankings are backed by real database data.">
            <div style={{ padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#7a6a40" }}>You | 340 flyers</span>
                <span style={{ fontSize: 12, color: "#7a6a40" }}>Sofia #3 | 640 flyers</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(340 / 640) * 100}%`, borderRadius: 99, background: "linear-gradient(90deg,#e0c13a,#b9cf51)", boxShadow: "0 0 8px rgba(185,207,81,0.5)" }} />
              </div>
              <p style={{ fontSize: 12, color: "#9a8a60", marginTop: 8 }}>
                <strong style={{ color: "#1a1600" }}>300 more flyers</strong> to reach rank #3
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      {selectedRoute ? (
        <div
          aria-hidden="true"
          onClick={() => {
            setSelectedRoute(null);
            setRouteZoom(1);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(22,30,10,0.72)",
            padding: isMobile ? 16 : 28,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(100%, 720px)",
              borderRadius: 24,
              overflow: "hidden",
              background: "#fffdf2",
              boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
              border: "1px solid rgba(185,207,81,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 16px",
                borderBottom: "1px solid rgba(190,155,70,0.16)",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8f51" }}>
                  Route Preview
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700, color: "#243112" }}>
                  {selectedRoute.title}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setRouteZoom((current) => Math.max(1, current - 0.25))}
                  style={zoomButtonStyle}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setRouteZoom(1)}
                  style={zoomButtonStyle}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setRouteZoom((current) => Math.min(3, current + 0.25))}
                  style={zoomButtonStyle}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoute(null);
                    setRouteZoom(1);
                  }}
                  style={zoomButtonStyle}
                >
                  X
                </button>
              </div>
            </div>
            <div
              style={{
                maxHeight: "70vh",
                overflow: "auto",
                background: "#f7f3df",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <Image
                src={selectedRoute.imageUrl}
                alt={selectedRoute.title}
                width={1280}
                height={900}
                unoptimized
                style={{
                  display: "block",
                  width: `${routeZoom * 100}%`,
                  height: "auto",
                  maxWidth: "none",
                  objectFit: "contain",
                  transition: "width 150ms ease",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read photo."));
    reader.readAsDataURL(file);
  });
}

const zoomButtonStyle: React.CSSProperties = {
  minWidth: 36,
  height: 36,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid rgba(190,155,70,0.18)",
  background: "#fffaf0",
  color: "#42531d",
  fontSize: 13,
  fontWeight: 700,
};
