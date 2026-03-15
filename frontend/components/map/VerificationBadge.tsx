"use client";

import type { PlacementTargetStatus } from "@/types/placement";

type VerificationTone = {
  label: string;
  background: string;
  color: string;
  border: string;
};

const toneByStatus: Record<PlacementTargetStatus, VerificationTone> = {
  not_started: {
    label: "Needs coverage",
    background: "rgba(245,158,11,0.14)",
    color: "#92400e",
    border: "rgba(245,158,11,0.26)",
  },
  verified: {
    label: "Covered",
    background: "rgba(34,197,94,0.14)",
    color: "#166534",
    border: "rgba(34,197,94,0.28)",
  },
  pending_review: {
    label: "Pending review",
    background: "rgba(251,191,36,0.16)",
    color: "#92400e",
    border: "rgba(251,191,36,0.34)",
  },
  rejected: {
    label: "Retake needed",
    background: "rgba(239,68,68,0.12)",
    color: "#b91c1c",
    border: "rgba(239,68,68,0.24)",
  },
};

export function getVerificationBadgeTone(status: PlacementTargetStatus) {
  return toneByStatus[status];
}

export default function VerificationBadge({
  status,
}: {
  status: PlacementTargetStatus;
}) {
  const tone = getVerificationBadgeTone(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        border: `1px solid ${tone.border}`,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {tone.label}
    </span>
  );
}
