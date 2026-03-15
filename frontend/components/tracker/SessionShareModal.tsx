"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { formatDistance } from "@/lib/distance";
import { formatDuration } from "@/lib/session";
import type { VolunteerSession } from "@/types/tracker";

interface SessionShareModalProps {
  isOpen: boolean;
  session: VolunteerSession | null;
  onClose: () => void;
}

type ShareState = "idle" | "sharing" | "shared" | "copied" | "downloaded" | "error";

export default function SessionShareModal({
  isOpen,
  session,
  onClose,
}: SessionShareModalProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string | null>(null);

  const shareText = useMemo(() => {
    if (!session) {
      return "";
    }

    return [
      "Volunteer route completed with Lemontree.",
      `${formatDistance(session.totalDistanceMeters)} walked`,
      `${formatDuration(session.durationSeconds)} active time`,
      `${session.stops.length} stops logged`,
    ].join(" | ");
  }, [session]);

  if (!isOpen || !session) {
    return null;
  }

  const activeSession = session;

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      setShareState("error");
      setShareError("Native share is not available on this device.");
      return;
    }

    setShareState("sharing");
    setShareError(null);

    try {
      const files = await getShareFiles(activeSession);
      if (files.length && navigator.canShare?.({ files })) {
        await navigator.share({
          title: "Volunteer route summary",
          text: shareText,
          files,
        });
      } else {
        await navigator.share({
          title: "Volunteer route summary",
          text: shareText,
        });
      }

      setShareState("shared");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setShareState("idle");
        return;
      }

      setShareState("error");
      setShareError("Could not open the share sheet on this device.");
    }
  }

  async function handleCopySummary() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setShareState("error");
      setShareError("Clipboard access is not available here.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareState("copied");
      setShareError(null);
    } catch {
      setShareState("error");
      setShareError("Could not copy the route summary.");
    }
  }

  function handleDownloadImage() {
    if (!activeSession.routeImageUrl || typeof document === "undefined") {
      setShareState("error");
      setShareError("No route image is available to download.");
      return;
    }

    const link = document.createElement("a");
    const timestamp = new Date(activeSession.endTime ?? activeSession.startTime).toISOString().slice(0, 10);
    link.href = activeSession.routeImageUrl;
    link.download = `lemontree-route-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareState("downloaded");
    setShareError(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share route summary"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(17, 12, 0, 0.52)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 24,
          overflow: "hidden",
          background: "linear-gradient(180deg, #fffef9 0%, #fff8e8 100%)",
          border: "1px solid rgba(190,155,70,0.16)",
          boxShadow: "0 18px 40px rgba(46,27,0,0.22)",
        }}
      >
        <div
          style={{
            padding: "14px 14px 10px",
            background: "linear-gradient(180deg, #201300 0%, #2b1800 100%)",
            color: "#fff8e8",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(245,200,66,0.72)",
                }}
              >
                Share Route
              </p>
              <h3
                style={{
                  margin: "4px 0 0",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 22,
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  color: "#f7e3ad",
                }}
              >
                Share your route
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(245,200,66,0.16)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff8e8",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              X
            </button>
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11.5,
              lineHeight: 1.45,
              color: "rgba(255,241,199,0.76)",
            }}
          >
            Quick actions for the share sheet, copy, and save.
          </p>
        </div>

        <div style={{ padding: 14, display: "grid", gap: 12 }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 18,
              background: "#fffdf5",
              border: "1px solid rgba(190,155,70,0.14)",
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatPill label={formatDistance(session.totalDistanceMeters)} />
              <StatPill label={formatDuration(session.durationSeconds)} />
              <StatPill label={`${session.stops.length} stops`} />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <IconAction label="Share" icon={<ShareGlyph />} onClick={handleNativeShare} />
            <IconAction label="Insta" icon={<InstagramGlyph />} onClick={handleNativeShare} />
            <IconAction label="Files" icon={<FilesGlyph />} onClick={handleNativeShare} />
            <IconAction label="Copy" icon={<CopyGlyph />} onClick={handleCopySummary} />
          </div>

          <button
            type="button"
            onClick={() => {
              void handleNativeShare();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "12px 14px",
              borderRadius: 16,
              cursor: "pointer",
              border: "1px solid rgba(245,200,66,0.34)",
              background: "linear-gradient(135deg, #f5c842 0%, #f0b21f 100%)",
              color: "#1a1000",
              boxShadow: "0 14px 28px rgba(245,200,66,0.22)",
            }}
          >
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>
                {shareState === "sharing" ? "Opening Share..." : "Open Share Sheet"}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 11.5,
                  color: "rgba(26,16,0,0.68)",
                }}
              >
                Instagram, Messages, Files, and more
              </span>
            </span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>+</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={!session.routeImageUrl}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "11px 14px",
              borderRadius: 16,
              cursor: !session.routeImageUrl ? "not-allowed" : "pointer",
              border: "1px solid rgba(190,155,70,0.16)",
              background: !session.routeImageUrl ? "rgba(245,239,219,0.7)" : "#fffdf5",
              color: !session.routeImageUrl ? "#b7aa7f" : "#1a1600",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <FilesGlyph />
              Save Route Image
            </span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>+</span>
          </button>

          <div
            style={{
              fontSize: 11.5,
              color: shareState === "error" ? "#b91c1c" : "#8a7a50",
              minHeight: 16,
            }}
          >
            {shareState === "shared" && "Share sheet completed."}
            {shareState === "copied" && "Route summary copied."}
            {shareState === "downloaded" && "Route image download started."}
            {shareState === "error" && (shareError ?? "Sharing failed.")}
            {(shareState === "idle" || shareState === "sharing") && !shareError
              ? "Small mobile share popup with quick actions."
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "7px 10px",
        borderRadius: 999,
        background: "#fff7dc",
        border: "1px solid rgba(245,200,66,0.18)",
        fontSize: 11.5,
        fontWeight: 700,
        color: "#6b4f0a",
      }}
    >
      {label}
    </span>
  );
}

function IconAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      style={{
        display: "grid",
        placeItems: "center",
        gap: 6,
        padding: "12px 8px 10px",
        borderRadius: 18,
        border: "1px solid rgba(190,155,70,0.16)",
        background: "#fffdf5",
        color: "#1a1600",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #fff5cf 0%, #fffdf5 100%)",
          border: "1px solid rgba(245,200,66,0.16)",
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>
    </button>
  );
}

function ShareGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a5a10"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4" />
      <path d="M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #f9ce34 0%, #ee2a7b 52%, #6228d7 100%)",
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="#ffffff" stroke="none" />
      </svg>
    </span>
  );
}

function FilesGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a5a10"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a5a10"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

async function getShareFiles(session: VolunteerSession) {
  if (!session.routeImageUrl || typeof File === "undefined") {
    return [];
  }

  try {
    const response = await fetch(session.routeImageUrl);
    const blob = await response.blob();
    return [new File([blob], "lemontree-route.png", { type: blob.type || "image/png" })];
  } catch {
    return [];
  }
}
