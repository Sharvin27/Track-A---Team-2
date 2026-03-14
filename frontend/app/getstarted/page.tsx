"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";

/** Scalable volunteer steps: add more entries here as needed. */
const VOLUNTEER_STEPS: {
  title: string;
  action: "external" | "internal";
  url?: string;
  href?: string;
}[] = [
  {
    title: "Create and Download static flyers",
    action: "external",
    url: "https://www.foodhelpline.org/share",
  },
  {
    title: "Locate Nearby printers",
    action: "internal",
    href: "/printers",
  },
];

export default function GetStartedPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <div className="anim-fade-up d1" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#1a1000",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Get started volunteering now
        </h1>
        <p style={{ fontSize: 15, color: "#5a4a20", textAlign: "center", marginBottom: 32 }}>
          Follow these steps to make an impact in your community.
        </p>
      </div>
      <div className="anim-fade-up d2" style={{ maxWidth: 520, margin: "0 auto" }}>
        {VOLUNTEER_STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid rgba(190,155,70,0.18)",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              padding: "20px 24px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1600" }}>
              <span style={{ color: "#f5c842", marginRight: 8 }}>Step {i + 1}.</span>
              {s.title}
            </span>
            {s.action === "external" && s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
                  color: "#1a1000",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(245,200,66,0.35)",
                }}
              >
                Open link
              </a>
            )}
            {s.action === "internal" && s.href && (
              <button
                type="button"
                onClick={() => router.push(s.href!)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
                  color: "#1a1000",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(245,200,66,0.35)",
                }}
              >
                Go to page
              </button>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
