"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function useSessionSSE(
  sessionId: string,
  coreBaseUrl: string,
  initialMessages: any[],
) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const streamBuffer = useRef<Map<string, string>>(new Map());
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep messages in sync when initialMessages change (e.g. after router.refresh())
  useEffect(() => {
    setMessages((prev) => {
      // Merge: keep any streaming placeholders, replace everything else with server data
      const streamingMessages = prev.filter(
        (m) => typeof m.id === "string" && m.id.startsWith("streaming-"),
      );
      if (streamingMessages.length === 0) return initialMessages;

      // Append streaming placeholders after server messages
      const serverIds = new Set(initialMessages.map((m) => m.id));
      const uniqueStreaming = streamingMessages.filter(
        (m) => !serverIds.has(m.id),
      );
      return [...initialMessages, ...uniqueStreaming];
    });
  }, [initialMessages]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      // Trigger a soft page refresh to pick up full message metadata
      window.dispatchEvent(new CustomEvent("sse-refresh-needed"));
    }, 2000);
  }, []);

  useEffect(() => {
    const url = `${coreBaseUrl}/web-client/api/sse/${sessionId}`;
    const es = new EventSource(url);

    // Complete message (manual send, file-only)
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            role: "assistant",
            text: data.text,
            createdAt: new Date(data.createdAt),
            files: data.files ?? [],
            _streaming: false,
          },
        ];
      });
      scheduleRefresh();
    };

    // User message (from chat widget/webhook)
    es.addEventListener("user-message", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            role: "user",
            text: data.text,
            createdAt: new Date(data.createdAt),
            files: data.files ?? [],
            _streaming: false,
          },
        ];
      });
      scheduleRefresh();
    });

    // AI starts generating — insert placeholder
    es.addEventListener("stream-start", (event) => {
      const { streamId } = JSON.parse((event as MessageEvent).data);
      streamBuffer.current.set(streamId, "");
      setMessages((prev) => [
        ...prev,
        {
          id: `streaming-${streamId}`,
          role: "assistant",
          text: "",
          createdAt: new Date(),
          files: [],
          _streaming: true,
        },
      ]);
    });

    // Incremental text chunk
    es.addEventListener("stream-delta", (event) => {
      const { streamId, delta } = JSON.parse((event as MessageEvent).data);
      const updated = (streamBuffer.current.get(streamId) ?? "") + delta;
      streamBuffer.current.set(streamId, updated);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === `streaming-${streamId}` ? { ...m, text: updated } : m,
        ),
      );
    });

    // AI response complete — replace placeholder with final message
    es.addEventListener("stream-end", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      streamBuffer.current.delete(data.streamId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === `streaming-${data.streamId}`
            ? {
                id: data.messageId,
                role: "assistant",
                text: data.text,
                createdAt: new Date(data.createdAt),
                files: data.files ?? [],
                _streaming: false,
              }
            : m,
        ),
      );
      scheduleRefresh();
    });

    return () => {
      es.close();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [sessionId, coreBaseUrl, scheduleRefresh]);

  return messages;
}
