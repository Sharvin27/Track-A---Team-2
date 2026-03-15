"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Map",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    badge: "🏆",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/printers",
    label: "Nearby Printers",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
  },
  {
    href: "/onboarding",
    label: "Get Started",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 8 16 12 12 16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // TRUE glassmorphism
        background: "rgba(15, 12, 5, 0.80)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderRight: "1px solid rgba(245, 200, 66, 0.14)",
        boxShadow: "6px 0 40px rgba(0,0,0,0.22), inset -1px 0 0 rgba(245,200,66,0.07)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top ambient glow */}
      <div style={{
        position: "absolute",
        top: -60,
        left: "50%",
        transform: "translateX(-50%)",
        width: 200,
        height: 200,
        background: "radial-gradient(circle, rgba(245,200,66,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Bottom ambient glow */}
      <div style={{
        position: "absolute",
        bottom: -40,
        right: -40,
        width: 160,
        height: 160,
        background: "radial-gradient(circle, rgba(245,200,66,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Logo ── */}
      <div style={{ padding: "24px 20px 18px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
            boxShadow: "0 3px 14px rgba(245,200,66,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            flexShrink: 0,
          }}>
            🍋
          </div>
          <div>
            <div style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 600,
              fontSize: 15.5,
              color: "#ede5cc",
              lineHeight: 1.1,
              letterSpacing: "-0.3px",
            }}>
              Lemontree
            </div>
            <div style={{ fontSize: 11, color: "rgba(237,229,204,0.45)", marginTop: 2 }}>
              Volunteer Hub
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(245,200,66,0.12)", margin: "0 16px 16px" }} />

      {/* Section label */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(237,229,204,0.35)",
        padding: "0 20px 10px",
        position: "relative",
        zIndex: 1,
      }}>
        Navigation
      </div>

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: "0 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          const isHov = hovered === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 11,
                marginBottom: 2,
                position: "relative",
                textDecoration: "none",
                background: isActive
                  ? "rgba(245,200,66,0.16)"
                  : isHov
                  ? "rgba(245,200,66,0.08)"
                  : "transparent",
                transition: "background 0.18s ease",
                overflow: "hidden",
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: "55%",
                  borderRadius: "0 3px 3px 0",
                  background: "#f5c842",
                  boxShadow: "2px 0 10px rgba(245,200,66,0.7)",
                }} />
              )}

              {/* Icon */}
              <span style={{
                color: isActive ? "#f5c842" : isHov ? "rgba(237,229,204,0.9)" : "rgba(237,229,204,0.45)",
                transition: "color 0.15s",
                flexShrink: 0,
                display: "flex",
              }}>
                {item.icon}
              </span>

              {/* Label */}
              <span style={{
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#f5c842" : isHov ? "#ede5cc" : "rgba(237,229,204,0.7)",
                transition: "color 0.15s",
                flex: 1,
                letterSpacing: "-0.1px",
              }}>
                {item.label}
              </span>

              {/* Badges */}
              {item.badge && (
                <span style={{ fontSize: 13 }}>{item.badge}</span>
              )}
              {item.isNew && !isActive && (
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 6px",
                  borderRadius: 5,
                  background: "rgba(245,200,66,0.2)",
                  color: "#f5c842",
                }}>
                  NEW
                </span>
              )}
              {isActive && (
                <span
                  className="pulse-dot"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f5c842",
                    flexShrink: 0,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(245,200,66,0.12)", margin: "10px 16px 12px" }} />

      {/* ── User Footer ── */}
      <div style={{ padding: "0 10px 20px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 11,
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            transition: "background 0.18s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "linear-gradient(135deg,#f5c842,#e8a200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#1a1000",
            flexShrink: 0,
          }}>
            SG
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#ede5cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Sharvin Gavad
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(237,229,204,0.38)", marginTop: 1 }}>
              Hackathon 2025
            </div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(237,229,204,0.35)" strokeWidth="2">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </div>
      </div>
    </aside>
  );
}