"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDisplayName, formatRelativeTime } from "@/lib/social-format";
import type { DMThread } from "@/lib/social-types";
import UserIdentity from "../community/UserIdentity";

export default function DMThreadList({
  threads,
}: {
  threads: DMThread[];
}) {
  const pathname = usePathname();

  if (threads.length === 0) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px dashed rgba(190,155,70,0.24)",
          background: "rgba(255,255,255,0.72)",
          padding: "24px 18px",
          color: "#8a7a50",
          textAlign: "center",
        }}
      >
        No DMs yet. Start one from a post author or meetup organizer.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {threads.map((thread) => {
        const isActive = pathname === `/messages/${thread.id}`;

        return (
          <Link
            key={thread.id}
            href={`/messages/${thread.id}`}
            style={{
              display: "block",
              borderRadius: 18,
              border: isActive
                ? "1px solid rgba(34,197,94,0.22)"
                : "1px solid rgba(190,155,70,0.16)",
              background: isActive ? "rgba(236,253,245,0.82)" : "#ffffff",
              boxShadow: "0 10px 20px rgba(31,43,18,0.05)",
              padding: 14,
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <UserIdentity
                user={thread.otherUser}
                subtitle={`@${thread.otherUser.username}`}
                size={36}
              />
              {thread.unreadCount > 0 ? (
                <div
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "#166534",
                    color: "#ecfdf5",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 7px",
                  }}
                >
                  {thread.unreadCount}
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 10, fontSize: 12.5, color: "#4b5563", lineHeight: 1.5 }}>
              {thread.lastMessageText || `Start a conversation with ${formatDisplayName(thread.otherUser)}.`}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#8a7a50" }}>
              {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : "New thread"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
