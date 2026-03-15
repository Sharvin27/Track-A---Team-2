"use client";

import { useState } from "react";
import type { StopType } from "@/types/tracker";

interface TrackerControlsProps {
  isTracking: boolean;
  isBusy?: boolean;
  onStart: () => void;
  onStop: () => void;
  onAddStop: (type: StopType, label?: string) => void;
}

const STOP_OPTIONS: Array<{ value: StopType; label: string }> = [
  { value: "printer", label: "Printer" },
  { value: "cafe", label: "Cafe" },
  { value: "bulletin_board", label: "Bulletin board" },
  { value: "community_center", label: "Community center" },
  { value: "other", label: "Other" },
];

export default function TrackerControls({
  isTracking,
  isBusy = false,
  onStart,
  onStop,
  onAddStop,
}: TrackerControlsProps) {
  const [stopType, setStopType] = useState<StopType>("printer");
  const [label, setLabel] = useState("");
  const disabled = isBusy;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onStart}
          disabled={isTracking || disabled}
          style={primaryButton(isTracking || disabled)}
        >
          Start Session
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!isTracking || disabled}
          style={secondaryButton(!isTracking || disabled)}
        >
          Stop Session
        </button>
      </div>

      <div
        style={{
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(190,155,70,0.18)",
          background: isTracking ? "#fffdf5" : "rgba(255,255,255,0.55)",
          display: "grid",
          gap: 12,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1600" }}>Add Stop</p>
          <p style={{ fontSize: 12, color: "#8a7a50", marginTop: 2 }}>
            Mark outreach stops while the session is running.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <select
            value={stopType}
            onChange={(event) => setStopType(event.target.value as StopType)}
            disabled={!isTracking || disabled}
            style={fieldStyle}
          >
            {STOP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={!isTracking || disabled}
            placeholder="Optional label"
            style={fieldStyle}
          />
          <button
            type="button"
            disabled={!isTracking || disabled}
            onClick={() => {
              onAddStop(stopType, label);
              setLabel("");
            }}
            style={tertiaryButton(!isTracking || disabled)}
          >
            Add Stop
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(190,155,70,0.22)",
  background: "#ffffff",
  fontSize: 13,
  color: "#1a1600",
};

function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: "12px 18px",
    borderRadius: 12,
    background: disabled ? "rgba(245,200,66,0.35)" : "#f5c842",
    color: "#1a1000",
    fontWeight: 700,
    fontSize: 13,
    opacity: disabled ? 0.75 : 1,
  };
}

function secondaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: "12px 18px",
    borderRadius: 12,
    background: disabled ? "rgba(26,18,0,0.1)" : "#1a1200",
    color: disabled ? "#7a6a40" : "#f8e4a6",
    fontWeight: 700,
    fontSize: 13,
    opacity: disabled ? 0.6 : 1,
  };
}

function tertiaryButton(disabled: boolean): React.CSSProperties {
  return {
    padding: "11px 16px",
    borderRadius: 12,
    background: disabled ? "rgba(21,128,61,0.18)" : "#15803d",
    color: disabled ? "#4b5563" : "#f0fdf4",
    fontWeight: 700,
    fontSize: 13,
    opacity: disabled ? 0.65 : 1,
  };
}
