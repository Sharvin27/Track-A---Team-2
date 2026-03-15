"use client";

import VerificationBadge from "@/components/map/VerificationBadge";
import type { PlacementSubmissionResult } from "@/types/placement";

export default function SubmissionResultCard({
  result,
}: {
  result: PlacementSubmissionResult;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Verification result
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Score {result.verificationScore}
          </p>
        </div>
        <VerificationBadge status={result.status} />
      </div>

      <p style={{ margin: "0 0 12px", color: "#334155", lineHeight: 1.5 }}>
        {result.reviewReason}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <InfoRow
          label="Distance"
          value={
            result.distanceMeters === null
              ? "No GPS"
              : `${Math.round(result.distanceMeters)} m`
          }
        />
        <InfoRow
          label="QR"
          value={result.qrDetected ? "Detected" : "Not found"}
        />
        <InfoRow
          label="OCR matches"
          value={result.ocrMatches.length ? result.ocrMatches.join(", ") : "None"}
        />
        <InfoRow
          label="Breakdown"
          value={`G ${result.verificationBreakdown.gpsScore} · O ${result.verificationBreakdown.ocrScore} · Q ${result.verificationBreakdown.qrScore}`}
        />
      </div>

      {result.imageUrl ? (
        <img
          src={result.imageUrl}
          alt="Submitted flyer proof"
          style={{
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.20)",
          }}
        />
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "10px 12px",
        background: "#f8fafc",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{label}</p>
      <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "#0f172a", fontWeight: 700 }}>
        {value}
      </p>
    </div>
  );
}
