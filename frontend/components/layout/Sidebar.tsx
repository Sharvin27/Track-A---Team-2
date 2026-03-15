"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
};

const NAV: NavItem[] = [
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
    href: "/community",
    label: "Community",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/tracker",
    label: "Route Tracker",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h6l2 12h10" />
        <circle cx="7" cy="6" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M9 9l3 3 4-5" />
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
    badge: "T",
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
    href: "/getstarted",
    label: "Get Started",
    isNew: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 8 16 12 12 16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

function getInitial(name: string): string {
  if (!name?.trim()) return "?";
  return name.trim()[0].toUpperCase();
}

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.full_name?.trim() || user?.username;

  return (
    <aside
      style={{
        width: isMobile ? 280 : 236,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "8px 0 32px rgba(0,0,0,0.22)",
        position: isMobile ? "fixed" : "relative",
        top: 0,
        left: 0,
        zIndex: 50,
        overflow: "hidden",
        transform: isMobile ? `translateX(${isOpen ? "0" : "-100%"})` : "translateX(0)",
        transition: "transform 0.25s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(74,222,128,0.12) 0%, transparent 28%), radial-gradient(circle at bottom right, rgba(74,222,128,0.08) 0%, transparent 22%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "20px 20px 18px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--gradient-btn-primary)",
                boxShadow: "0 8px 20px rgba(34,197,94,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "#effff3",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              L
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--sidebar-text)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                Lemontree
              </div>
              <div style={{ fontSize: 11, color: "rgba(229,229,229,0.54)", marginTop: 3 }}>
                Volunteer Hub
              </div>
            </div>
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--sidebar-text)",
              }}
            >
              X
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 14px" }} />

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(229,229,229,0.36)",
          padding: "0 20px 10px",
          position: "relative",
          zIndex: 1,
        }}
      >
        Navigation
      </div>

      <nav style={{ flex: 1, padding: "0 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) onClose();
              }}
              className={`nav-item${isActive ? " active" : ""}`}
              style={{
                textDecoration: "none",
                marginBottom: 4,
                position: "relative",
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span style={{ fontSize: 12 }}>{item.badge}</span> : null}
              {item.isNew && !isActive ? (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "rgba(74,222,128,0.14)",
                    color: "var(--accent-green)",
                  }}
                >
                  NEW
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 16px 12px" }} />

      <div style={{ padding: "0 10px 20px", position: "relative", zIndex: 1 }}>
        <Link
          href={user?.isGuest ? "/" : "/profile"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 11,
            background: "rgba(255,255,255,0.04)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "var(--gradient-btn-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#effff3",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user?.profile_photo_url ? (
              <Image
                src={user.profile_photo_url}
                alt={displayName ?? user.username}
                width={30}
                height={30}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : user ? (
              getInitial(displayName ?? user.username)
            ) : (
              "?"
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--sidebar-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user ? (displayName ?? user.username) : "Guest"}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(229,229,229,0.42)", marginTop: 1 }}>
              {user?.isGuest ? "Guest" : user ? "Volunteer" : "Log in to get started"}
            </div>
          </div>
        </Link>

        {user?.isGuest ? (
          <button
            type="button"
            onClick={() => logout()}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(74,222,128,0.16)",
              background: "rgba(74,222,128,0.08)",
              color: "var(--accent-green)",
              fontSize: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Login or Sign up
          </button>
        ) : null}
      </div>
    </aside>
  );
}
