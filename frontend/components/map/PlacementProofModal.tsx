"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import SubmissionResultCard from "@/components/map/SubmissionResultCard";
import { useAuth } from "@/context/AuthContext";
import { createPlacementSubmission } from "@/lib/placement-api";
import {
  getCurrentPositionPromise,
  getGeolocationErrorMessage,
} from "@/lib/geolocation";
import type {
  PlacementSubmissionResult,
  PlacementTarget,
} from "@/types/placement";

type ModalState = "idle" | "locating" | "ready" | "uploading" | "result" | "error";
type GeolocationState = "locating" | "captured" | "denied" | "unavailable";

type CapturedPosition = {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: string;
};

export default function PlacementProofModal({
  open,
  target,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  target: PlacementTarget | null;
  onClose: () => void;
  onSubmitted: (result: PlacementSubmissionResult) => void;
}) {
  const { user } = useAuth();
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [geoState, setGeoState] = useState<GeolocationState>("locating");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [capturedPosition, setCapturedPosition] = useState<CapturedPosition | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementSubmissionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const heading = useMemo(() => {
    if (!target) return "Upload placement proof";
    return `Verify ${target.name}`;
  }, [target]);

  useEffect(() => {
    if (!open || !target) {
      resetModalState();
      return;
    }

    setModalState("locating");
    void requestLocation();
  }, [open, target?.id]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  async function requestLocation() {
    try {
      const position = await getCurrentPositionPromise();
      setCapturedPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        capturedAt: new Date(position.timestamp).toISOString(),
      });
      setGeoState("captured");
      setGeoMessage("Location captured and ready to send with your proof.");
    } catch (error) {
      if (isPositionError(error)) {
        const denied = error.code === error.PERMISSION_DENIED;
        setGeoState(denied ? "denied" : "unavailable");
        setGeoMessage(getGeolocationErrorMessage(error));
      } else {
        setGeoState("unavailable");
        setGeoMessage("Geolocation is unavailable right now.");
      }
    } finally {
      setModalState("ready");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!target || !selectedFile) {
      setErrorMessage("Select a photo before submitting proof.");
      return;
    }

    setErrorMessage(null);
    setModalState("uploading");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("targetId", target.id);
      if (target.hotspotId) {
        formData.append("hotspotId", String(target.hotspotId));
      }
      formData.append("userId", user?.isGuest ? "guest" : String(user?.id ?? "guest"));
      if (target.campaignRef) {
        formData.append("campaignRef", target.campaignRef);
      }
      if (capturedPosition) {
        formData.append("gpsLat", String(capturedPosition.lat));
        formData.append("gpsLng", String(capturedPosition.lng));
        if (capturedPosition.accuracy !== null) {
          formData.append("gpsAccuracy", String(capturedPosition.accuracy));
        }
        formData.append("capturedAt", capturedPosition.capturedAt);
      } else {
        formData.append("capturedAt", new Date().toISOString());
      }
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const submissionResult = await createPlacementSubmission(formData);
      setResult(submissionResult);
      setModalState("result");
      onSubmitted(submissionResult);
    } catch (error) {
      setModalState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit placement proof.",
      );
    }
  }

  function resetModalState() {
    setModalState("idle");
    setGeoState("locating");
    setGeoMessage(null);
    setCapturedPosition(null);
    setSelectedFile(null);
    setNotes("");
    setErrorMessage(null);
    setResult(null);
    setPreviewUrl(null);
  }

  if (!open || !target) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 36px)",
          overflowY: "auto",
          borderRadius: 24,
          padding: 20,
          background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
          boxShadow: "0 28px 60px rgba(15,23,42,0.22)",
          border: "1px solid rgba(245,158,11,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              Placement verification
            </p>
            <h3 style={{ margin: "6px 0 0", fontSize: 24, color: "#0f172a" }}>
              {heading}
            </h3>
            <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>
              Upload flyer evidence for <strong>{target.name}</strong>. This does not
              mark the hotspot as covered until the backend verifies the proof.
            </p>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 14,
            marginBottom: 14,
            background: "#fff7ed",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#9a3412" }}>
            Geolocation status: {formatGeoState(geoState)}
          </p>
          <p style={{ margin: "6px 0 0", color: "#7c2d12", lineHeight: 1.5 }}>
            {geoMessage ||
              "Requesting your location now to strengthen verification confidence."}
          </p>
        </div>

        {result ? (
          <div style={{ display: "grid", gap: 14 }}>
            <SubmissionResultCard result={result} />
            <button onClick={onClose} style={submitButtonStyle}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={fieldLabelStyle}>Flyer photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  setErrorMessage(null);
                }}
                style={fileInputStyle}
              />
            </label>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Proof preview"
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,0.20)",
                }}
              />
            ) : (
              <div style={emptyPreviewStyle}>
                Capture or upload a flyer photo to continue.
              </div>
            )}

            <label style={{ display: "grid", gap: 8 }}>
              <span style={fieldLabelStyle}>Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything a reviewer should know about this placement?"
                rows={4}
                style={textAreaStyle}
              />
            </label>

            {errorMessage ? (
              <div style={errorCardStyle}>{errorMessage}</div>
            ) : null}

            {geoState !== "captured" ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                You can still submit without location, but missing GPS may lower the
                verification score.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!selectedFile || modalState === "uploading"}
              style={{
                ...submitButtonStyle,
                opacity: !selectedFile || modalState === "uploading" ? 0.65 : 1,
              }}
            >
              {modalState === "uploading"
                ? "Uploading proof..."
                : modalState === "locating"
                  ? "Preparing verification..."
                  : "Submit proof for verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function formatGeoState(state: GeolocationState) {
  if (state === "captured") return "Captured";
  if (state === "denied") return "Denied";
  if (state === "unavailable") return "Unavailable";
  return "Locating";
}

function isPositionError(error: unknown): error is GeolocationPositionError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error,
  );
}

const closeButtonStyle: CSSProperties = {
  borderRadius: 999,
  padding: "10px 14px",
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(148,163,184,0.18)",
  fontSize: 12,
  fontWeight: 800,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

const fileInputStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.20)",
  background: "#ffffff",
  padding: "12px 14px",
};

const emptyPreviewStyle: CSSProperties = {
  borderRadius: 18,
  border: "1px dashed rgba(148,163,184,0.32)",
  background: "#f8fafc",
  minHeight: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  padding: 24,
  textAlign: "center",
  lineHeight: 1.5,
};

const textAreaStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.20)",
  background: "#ffffff",
  padding: "12px 14px",
  color: "#0f172a",
  resize: "vertical",
};

const errorCardStyle: CSSProperties = {
  borderRadius: 14,
  padding: "12px 14px",
  background: "rgba(254,226,226,0.72)",
  border: "1px solid rgba(239,68,68,0.18)",
  color: "#b91c1c",
  fontSize: 12.5,
  lineHeight: 1.5,
};

const submitButtonStyle: CSSProperties = {
  width: "100%",
  borderRadius: 15,
  padding: "14px 16px",
  background: "linear-gradient(135deg, #f5c842 0%, #f59e0b 100%)",
  color: "#1a1000",
  fontSize: 13,
  fontWeight: 800,
  boxShadow: "0 14px 28px rgba(245,200,66,0.18)",
};
