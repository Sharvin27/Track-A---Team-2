"use client";

import VerificationBadge from "@/components/map/VerificationBadge";
import type { PlacementTarget } from "@/types/placement";
import type { CSSProperties, ReactNode } from "react";

export function getPlacementActionLabel(status: PlacementTarget["status"]) {
  if (status === "verified") return "Upload updated proof";
  if (status === "pending_review") return "Add more proof";
  return "Mark hotspot as covered";
}

export default function PlacementTargetCard({
  target,
  distanceLabel,
  selected = false,
  onSelect,
  onVerify,
}: {
  target: PlacementTarget;
  distanceLabel?: string;
  selected?: boolean;
  onSelect?: () => void;
  onVerify?: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: selected ? "rgba(255,248,225,0.98)" : "rgba(255,255,255,0.98)",
        border: selected
          ? "1px solid rgba(245,158,11,0.24)"
          : "1px solid rgba(148,163,184,0.16)",
        boxShadow: selected
          ? "0 14px 28px rgba(245,158,11,0.10)"
          : "0 14px 28px rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {target.name}
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>
            {target.zoneName} · {target.type}
          </p>
        </div>
        <VerificationBadge status={target.status} />
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
        {target.address}
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 10,
          marginBottom: 12,
        }}
      >
        {distanceLabel ? <MetaPill>{distanceLabel}</MetaPill> : null}
        {typeof target.latestVerificationScore === "number" ? (
          <MetaPill>Verification {target.latestVerificationScore}</MetaPill>
        ) : null}
        {typeof target.verifiedCount === "number" ? (
          <MetaPill>{target.verifiedCount} verified uploads</MetaPill>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {onSelect ? (
          <button onClick={onSelect} style={secondaryButtonStyle}>
            View details
          </button>
        ) : (
          <div />
        )}
        {onVerify ? (
          <button onClick={onVerify} style={primaryButtonStyle}>
            {getPlacementActionLabel(target.status)}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: "5px 9px",
        borderRadius: 999,
        background: "#f8fafc",
        color: "#475569",
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

const primaryButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(245,158,11,0.20)",
  background: "linear-gradient(135deg, #f5c842 0%, #f59e0b 100%)",
  color: "#1a1000",
  fontSize: 12.5,
  fontWeight: 800,
  padding: "10px 12px",
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.20)",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 12.5,
  fontWeight: 800,
  padding: "10px 12px",
};
