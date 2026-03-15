"use client";

import React, { useState } from "react";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";

interface Section {
  emoji: string;
  title: string;
  body: React.ReactNode;
  media: "image" | "video";
  mediaNote: string;
}

const sections: Section[] = [
  {
    emoji: "🍋",
    title: "The Mission",
    body: "1 in 8 Americans need help with food. Not because there isn't enough, but because they don't know where to find it. Lemontree connects families to free pantries, fridges, and food programs nearby, and you're about to help us reach more. One flyer. One family. That's the math.",
    media: "image",
    mediaNote: "Photo — volunteer handing a flyer to a neighbor on the street.",
  },
  {
    emoji: "📄",
    title: "Getting Your Flyers",
    body: <>Download your flyer either by clicking on the point in the map near where you want to distribute or enter your preferred location <a href="https://www.foodhelpline.org/share" target="_blank" rel="noreferrer" style={{ color: "#d97706", fontWeight: 600 }}>here</a>. Takes 30 seconds. Print 50–100 copies at a nearby copy shop, usually under $10 total. Not sure where to print? The Nearby Printers tab finds the closest and cheapest spot to you.</>,
    media: "video",
    mediaNote: "Video — walkthrough of downloading the flyer and printing at a copy shop.",
  },
  {
    emoji: "📍",
    title: "Where to Go",
    body: "Think: anywhere neighbors slow down. Laundromats, cafes, church lobbies, community boards. These are your spots. Always ask before leaving flyers inside a business. Most people are happy to help.",
    media: "image",
    mediaNote: "Photo — community bulletin board or laundromat with flyers pinned up.",
  },
  {
    emoji: "🤝",
    title: "Talking to People", 
    body: "The whole pitch is three words: free food nearby. Just say: \"Hi, I'm volunteering with Lemontree. Here's a flyer about free food in the neighborhood.\" You don't have to explain everything. The flyer does the heavy lifting.",
    media: "video",
    mediaNote: "Video — short roleplay of a volunteer approaching someone and handing them a flyer.",
  },
  {
    emoji: "⚖️",
    title: "Know the Rules",
    body: "Good news: flyering in public is protected by the First Amendment. One hard rule though: never put anything in a mailbox. Federal offense, no exceptions. On private property, just ask. Most people say yes.",
    media: "image",
    mediaNote: "Photo — public sidewalk on one side, private property / 'no trespassing' sign contrast on the other.",
  },
  {
    emoji: "🔒",
    title: "Staying Safe",
    body: "Stick to daylight hours and busy streets. Bring a friend if you can, it makes the route faster and more fun. If someone gets confrontational about the flyers, don't engage. Just move on. And dress for the weather. You'll be outside longer than you think.",
    media: "image",
    mediaNote: "Photo — two volunteers walking together on a well-lit street during the day.",
  },
];

export default function GuidePage() {
  const [active, setActive] = useState(0);
  const s = sections[active];

  return (
    <PageContainer>

      <div className="anim-fade-up d1" style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#d97706", marginBottom: 10 }}>
          Volunteer Guide
        </p>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 34, fontWeight: 700, color: "#1a1000", letterSpacing: "-0.8px", marginBottom: 12 }}>
          The Volunteer Guide
        </h1>
        <p style={{ fontSize: 14.5, color: "#7a6a40", maxWidth: 480, margin: "0 auto" }}>
          Everything you need to know before heading out to flyer your neighborhood.
        </p>
      </div>

      {/* Tab bar */}
      <div className="anim-fade-up d2" style={{
        display: "flex", gap: 6, marginBottom: 24, overflowX: "auto",
        paddingBottom: 4,
      }}>
        {sections.map((sec, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            style={{
              flexShrink: 0,
              padding: "8px 16px", borderRadius: 10,
              border: active === i ? "none" : "1px solid rgba(190,155,70,0.22)",
              background: active === i ? "#f5c842" : "#ffffff",
              color: active === i ? "#1a1000" : "#7a6a40",
              fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: active === i ? "0 2px 8px rgba(245,200,66,0.3)" : "none",
            }}
          >
            {sec.emoji} {sec.title.split(" ").slice(0, 3).join(" ")}{sec.title.split(" ").length > 3 ? "…" : ""}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="anim-fade-up d3" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
        background: "#ffffff", borderRadius: 20,
        border: "1px solid rgba(190,155,70,0.18)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        overflow: "hidden", height: 420,
      }}>

        {/* Media side */}
        <div style={{ position: "relative" }}>
          {s.media === "image" ? (
            <div style={{
              height: "100%",
              background: "rgba(245,200,66,0.08)",
              borderRight: "1px dashed rgba(190,155,70,0.25)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, color: "#b0a070", padding: "0 24px", textAlign: "center",
            }}>
              <span style={{ fontSize: 36 }}>📷</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Image placeholder</span>
              <span style={{ fontSize: 11.5, color: "#c8b888", lineHeight: 1.5 }}>{s.mediaNote}</span>
            </div>
          ) : (
            <div style={{
              height: "100%",
              background: "#1a1600",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "0 24px", textAlign: "center",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(245,200,66,0.15)", border: "2px solid rgba(245,200,66,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: "#f5c842", cursor: "pointer",
              }}>▶</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#9a8a60" }}>Video placeholder</span>
              <span style={{ fontSize: 11.5, color: "#5a4a30", lineHeight: 1.5 }}>{s.mediaNote}</span>
            </div>
          )}
        </div>

        {/* Text side */}
        <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "flex-start", overflow: "auto" }}>
          <span style={{ fontSize: 36, marginBottom: 16 }}>{s.emoji}</span>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1a1600", letterSpacing: "-0.4px", marginBottom: 14 }}>
            {s.title}
          </h2>
          <p style={{ fontSize: 14, color: "#5a4a20", lineHeight: 1.8 }}>
            {s.body}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <button
              type="button"
              onClick={() => setActive((i) => Math.max(i - 1, 0))}
              disabled={active === 0}
              style={{
                padding: "9px 18px", borderRadius: 10,
                background: "transparent", border: "1px solid rgba(190,155,70,0.3)",
                color: "#7a6a40", fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: active === 0 ? 0.4 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => Math.min(i + 1, sections.length - 1))}
              disabled={active === sections.length - 1}
              style={{
                padding: "9px 18px", borderRadius: 10,
                background: "#f5c842", border: "none",
                color: "#1a1000", fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: active === sections.length - 1 ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
          <p style={{ fontSize: 11.5, color: "#b0a070", marginTop: 14 }}>
            {active + 1} of {sections.length}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: "22px 32px", borderRadius: 18, marginTop: 24,
        background: "linear-gradient(120deg, #1a1200 55%, #2c1e00 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, color: "#f5c842", marginBottom: 4 }}>Ready to get started?</p>
          <p style={{ fontSize: 12.5, color: "rgba(237,218,170,0.5)" }}>Download your flyers and find a printer near you.</p>
        </div>
        <Link href="/getstarted" style={{ padding: "11px 24px", borderRadius: 12, background: "#f5c842", color: "#1a1000", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
          🚀 Let&rsquo;s Go
        </Link>
      </div>

    </PageContainer>
  );
}
