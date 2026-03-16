"use client";

import { getPlacementActionLabel } from "@/components/map/PlacementTargetCard";
import VerificationBadge from "@/components/map/VerificationBadge";
import type { PlacementTarget } from "@/types/placement";
import type { CSSProperties, ReactNode } from "react";

type DrawerLocation = {
  id: string;
  name: string;
  address: string;
  regionName: string | null;
  regionNeedScore: number | null;
  derivedPriority: "High" | "Medium" | "Low";
  distanceMiles: number;
  priorityScore: number;
  notes: string;
  latestVerificationScore?: number | null;
  latestReviewReason?: string | null;
  verifiedCount?: number;
};

export default function TargetDetailsDrawer({
  open,
  location,
  target,
  onClose,
  onOpenDirections,
  onOpenVerification,
}: {
  open: boolean;
  location: DrawerLocation | null;
  target: PlacementTarget | null;
  onClose: () => void;
  onOpenDirections: () => void;
  onOpenVerification: () => void;
}) {
  if (!open || !location || !target) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 18,
        top: "50%",
        transform: "translateY(-50%)",
        width: 332,
        maxWidth: "calc(100vw - 36px)",
        zIndex: 500,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          borderRadius: 24,
          padding: "16px 16px 14px",
          background: "rgba(26,22,11,0.92)",
          color: "#fff7de",
          backdropFilter: "blur(18px)",
          boxShadow: "0 22px 40px rgba(17,14,6,0.24)",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(245,200,66,0.56)",
              }}
            >
              Selected Hotspot
            </p>
            <h3
              style={{
                margin: "6px 0 0",
                fontSize: 23,
                lineHeight: 1.08,
                letterSpacing: "-0.5px",
              }}
            >
              {location.name}
            </h3>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12.5,
            color: "rgba(255,247,222,0.72)",
            lineHeight: 1.5,
          }}
        >
          {location.address}
        </p>

        {location.regionName ? (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              color: "rgba(245,200,66,0.82)",
            }}
          >
            {location.regionName}
            {typeof location.regionNeedScore === "number"
              ? ` · need score ${location.regionNeedScore.toFixed(2)}`
              : ""}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 8,
            marginBottom: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <VerificationBadge status={target.status} />
          <Pill>{location.derivedPriority} priority</Pill>
          {typeof target.verifiedCount === "number" && target.verifiedCount > 0 ? (
            <Pill style={{ marginLeft: "auto" }}>
              {target.verifiedCount} verified uploads
            </Pill>
          ) : null}
        </div>

        {target.latestReviewReason ? (
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              color: "rgba(255,247,222,0.86)",
              lineHeight: 1.5,
            }}
          >
            Latest review: {target.latestReviewReason}
          </p>
        ) : null}

        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            color: "rgba(255,247,222,0.76)",
            lineHeight: 1.55,
          }}
        >
          {location.notes}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={onOpenDirections} style={ghostButtonStyle}>
            Get directions
          </button>
          <button onClick={onOpenVerification} style={primaryButtonStyle}>
            {getPlacementActionLabel(target.status)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.07)",
        color: "rgba(255,247,222,0.82)",
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

const closeButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  color: "#fff7de",
  fontSize: 16,
  lineHeight: 1,
};

const ghostButtonStyle: CSSProperties = {
  width: "100%",
  borderRadius: 15,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff7de",
  fontSize: 12.5,
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  borderRadius: 15,
  padding: "12px 14px",
  background: "linear-gradient(135deg, #f5c842 0%, #f59e0b 100%)",
  color: "#1a1000",
  fontSize: 12.5,
  fontWeight: 800,
  boxShadow: "0 10px 22px rgba(245,200,66,0.22)",
};
