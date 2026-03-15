"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { getThread, getThreadMessages, sendThreadMessage } from "@/lib/messages-api";
import { formatDateTime, formatDisplayName } from "@/lib/social-format";
import type { DMMessage, DMThread } from "@/lib/social-types";
import UserIdentity from "../community/UserIdentity";
import { primaryButtonStyle } from "../community/CreatePostForm";

export default function DMChatWindow({
  threadId,
  token,
  currentUserId,
}: {
  threadId?: number;
  token?: string | null;
  currentUserId?: number | null;
}) {
  const [thread, setThread] = useState<DMThread | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadThread = useEffectEvent(async () => {
    if (!token || !threadId) {
      setThread(null);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      const [threadResponse, messagesResponse] = await Promise.all([
        getThread(token, threadId),
        getThreadMessages(token, threadId),
      ]);

      setThread(threadResponse.data);
      setMessages(messagesResponse.data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load messages.");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    setIsLoading(true);
    void loadThread();
  }, [threadId, token]);

  useEffect(() => {
    if (!token || !threadId) return;

    const intervalId = window.setInterval(() => {
      void loadThread();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [threadId, token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!token || !threadId || !messageText.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await sendThreadMessage(token, threadId, messageText);
      setMessages((current) => [...current, response.data]);
      setMessageText("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send message.");
    } finally {
      setIsSending(false);
    }
  }

  if (!threadId) {
    return (
      <div style={placeholderStyle}>
        Choose a DM thread to start chatting.
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 22,
        border: "1px solid rgba(190,155,70,0.18)",
        background: "#fffef9",
        overflow: "hidden",
        minHeight: 560,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid rgba(190,155,70,0.16)",
          background: "#ffffff",
        }}
      >
        {thread ? (
          <UserIdentity
            user={thread.otherUser}
            subtitle={`Chatting with ${formatDisplayName(thread.otherUser)}`}
          />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#8a7a50" }}>
            Loading thread...
          </p>
        )}
      </div>

      <div
        style={{
          padding: 16,
          overflowY: "auto",
          display: "grid",
          gap: 10,
          background:
            "linear-gradient(180deg, rgba(255,254,249,1) 0%, rgba(246,250,240,1) 100%)",
        }}
      >
        {isLoading ? (
          <p style={{ margin: 0, fontSize: 12.5, color: "#8a7a50" }}>Loading messages...</p>
        ) : messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.senderUserId === currentUserId;
            return (
              <div
                key={message.id}
                style={{
                  justifySelf: isMine ? "end" : "start",
                  maxWidth: "76%",
                  borderRadius: 18,
                  padding: "11px 13px",
                  background: isMine ? "rgba(217,249,157,0.92)" : "#ffffff",
                  border: "1px solid rgba(190,155,70,0.16)",
                  boxShadow: "0 8px 16px rgba(31,43,18,0.05)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#4b5563", marginBottom: 4 }}>
                  {formatDisplayName(message.sender)}
                </div>
                <div style={{ fontSize: 13, color: "#1f2b12", lineHeight: 1.5 }}>
                  {message.messageText}
                </div>
                <div style={{ fontSize: 10.5, color: "#7c8a67", marginTop: 6 }}>
                  {formatDateTime(message.createdAt)}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ margin: 0, fontSize: 12.5, color: "#8a7a50" }}>
            No messages yet. Say hello.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(190,155,70,0.16)",
          padding: 14,
          display: "grid",
          gap: 10,
          background: "#ffffff",
        }}
      >
        <textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          rows={3}
          placeholder="Send a direct message"
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid rgba(190,155,70,0.22)",
            background: "#ffffff",
            padding: "12px 14px",
            fontSize: 13,
            resize: "vertical",
            outline: "none",
          }}
        />
        {error ? (
          <p style={{ margin: 0, fontSize: 12, color: "#b91c1c" }}>{error}</p>
        ) : null}
        <div>
          <button
            type="button"
            disabled={isSending}
            onClick={() => void handleSend()}
            style={{ ...primaryButtonStyle, opacity: isSending ? 0.72 : 1 }}
          >
            {isSending ? "Sending..." : "Send DM"}
          </button>
        </div>
      </div>
    </div>
  );
}

const placeholderStyle: React.CSSProperties = {
  minHeight: 560,
  borderRadius: 22,
  border: "1px dashed rgba(190,155,70,0.26)",
  background: "rgba(255,255,255,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  textAlign: "center",
  color: "#8a7a50",
};
