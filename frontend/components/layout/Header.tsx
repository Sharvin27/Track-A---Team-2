"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const META: Record<string, { title: string; sub: string }> = {
  "/":            { title: "Welcome back 👋",   sub: "Here's what's happening in your community today." },
  "/map":         { title: "Resource Map 🗺️",   sub: "Explore flyering zones and food access locations." },
  "/profile":     { title: "Your Profile ✨",    sub: "Track your volunteer contributions and impact." },
  "/leaderboard": { title: "Leaderboard 🏆",     sub: "Top volunteers making a difference this month." },
  "/printers":    { title: "Nearby Printers 🖨️", sub: "Find a printer close to you for your flyers." },
  "/getstarted":  { title: "Get Started 🚀",     sub: "Everything you need to begin volunteering." },
  "/onboarding":  { title: "Log in",            sub: "Sign in or create an account to continue." },
};

function getInitial(name: string): string {
  if (!name?.trim()) return "?";
  return name.trim()[0].toUpperCase();
}

export default function Header() {
  const pathname = usePathname();
  const baseMeta = META[pathname] ?? META["/"];
  const { user } = useAuth();
  const title =
    pathname === "/" && user
      ? `Welcome back, ${user.username} 👋`
      : baseMeta.title;
  const meta = { ...baseMeta, title };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: 64,
        flexShrink: 0,
        background: "rgba(253,248,232,0.80)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(190,155,70,0.16)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Title */}
      <div>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 19,
            fontWeight: 600,
            color: "#1a1600",
            lineHeight: 1.2,
            letterSpacing: "-0.4px",
          }}
        >
          {meta.title}
        </h1>
        <p style={{ fontSize: 12, color: "#9a8a60", marginTop: 1 }}>{meta.sub}</p>
      </div>

      {/* Right: Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.045)",
            border: "1px solid rgba(0,0,0,0.07)",
            color: "#9a8a60",
            fontSize: 12.5,
            cursor: "text",
            width: 170,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search…
        </div>

        {/* Bell */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(190,155,70,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,200,66,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a5a30" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#ef4444",
            border: "1.5px solid #fdf8e8",
          }} />
        </button>

        {/* Avatar */}
        <Link
          href="/profile"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #f5c842 0%, #e8a200 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#1a1000",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(245,200,66,0.35)",
            textDecoration: "none",
          }}
        >
          {user ? getInitial(user.username) : "?"}
        </Link>
      </div>
    </header>
  );
}