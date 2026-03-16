"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";

type CoverageProofModalProps = {
  hotspot: {
    id: string;
    name: string;
    address: string;
    covered: boolean;
  } | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (photo: File, notes: string) => Promise<void>;
};

export default function CoverageProofModal({
  hotspot,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CoverageProofModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetFormState = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setNotes("");
    setErrorMessage(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return () => {
      resetFormState();
    };
  }, [isOpen, resetFormState]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!isOpen || !hotspot) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Add a proof photo before submitting.");
      return;
    }

    setErrorMessage(null);

    try {
      await onSubmit(selectedFile, notes);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit coverage proof.",
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const nextPreviewUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextPreviewUrl;
    setSelectedFile(nextFile);
    setPreviewUrl(nextPreviewUrl);
    setErrorMessage(null);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(12px, calc(env(safe-area-inset-top) + 8px)) 16px max(12px, calc(env(safe-area-inset-bottom) + 8px))",
        background: "rgba(8, 10, 8, 0.56)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: "min(100%, 540px)",
          maxHeight: "calc(100dvh - 24px)",
          borderRadius: 24,
          border: "1px solid rgba(74, 222, 128, 0.18)",
          background:
            "linear-gradient(180deg, rgba(20, 28, 21, 0.98) 0%, rgba(13, 19, 15, 0.98) 100%)",
          boxShadow: "0 28px 60px rgba(0, 0, 0, 0.36)",
          color: "#effff3",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 22px 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(134, 239, 172, 0.72)",
              }}
            >
              Verify hotspot coverage
            </p>
            <h3 style={{ margin: "8px 0 6px", fontSize: 24, lineHeight: 1.1 }}>
              {hotspot.name}
            </h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "rgba(239,255,243,0.72)" }}>
              Upload a quick photo of the flyer placement. On mobile, the camera option can open
              your rear camera directly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetFormState();
              onClose();
            }}
            disabled={isSubmitting}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#effff3",
              fontSize: 18,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.55 : 1,
            }}
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 22,
            display: "grid",
            gap: 16,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              padding: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "rgba(239,255,243,0.68)" }}>
              {hotspot.address}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 11.5, color: hotspot.covered ? "#86efac" : "#fcd34d" }}>
              {hotspot.covered ? "Already marked covered" : "Needs coverage proof"}
            </p>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isSubmitting}
                style={pickerButtonStyle}
              >
                Use camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                style={pickerButtonStyle}
              >
                Upload file
              </button>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px dashed rgba(134, 239, 172, 0.28)",
                background: "rgba(22, 163, 74, 0.05)",
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Coverage proof preview"
                  width={640}
                  height={360}
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#effff3" }}>
                    No proof photo selected yet
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 12,
                      color: "rgba(239,255,243,0.62)",
                      lineHeight: 1.5,
                    }}
                  >
                    Choose camera for an on-site capture or upload an existing image from your
                    gallery.
                  </p>
                </div>
              )}
            </div>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#effff3" }}>
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Anything useful about the placement, visibility, or condition?"
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#effff3",
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                outline: "none",
              }}
            />
          </label>

          {errorMessage ? (
            <div
              style={{
                borderRadius: 14,
                padding: "10px 12px",
                background: "rgba(127, 29, 29, 0.24)",
                border: "1px solid rgba(248, 113, 113, 0.22)",
                color: "#fecaca",
                fontSize: 12.5,
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                resetFormState();
                onClose();
              }}
              disabled={isSubmitting}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryButtonStyle,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Submitting proof..." : "Submit proof"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const pickerButtonStyle: CSSProperties = {
  borderRadius: 14,
  padding: "12px 14px",
  border: "1px solid rgba(74, 222, 128, 0.18)",
  background: "rgba(22, 163, 74, 0.08)",
  color: "#d1fae5",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: 14,
  padding: "11px 14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#effff3",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 14,
  padding: "11px 16px",
  border: "none",
  background: "linear-gradient(135deg, #4ade80 0%, #16a34a 100%)",
  color: "#052e16",
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(22, 163, 74, 0.24)",
};
