"use client";

import { useEffect, useRef, useCallback } from "react";
import { AppEvent } from "@/lib/events/eventTypes";

type UseEventStreamOptions = {
  eventTypes: string[];
  onEvent: (event: AppEvent) => void;
  enabled?: boolean;
};

/**
 * Hook to subscribe to Server-Sent Events from the /api/events endpoint.
 *
 * @example
 * ```tsx
 * useEventStream({
 *   eventTypes: ["conversation.generated"],
 *   onEvent: (event) => {
 *     if (event.type === "conversation.generated") {
 *       // Handle the event
 *     }
 *   },
 *   enabled: generatingIds.length > 0,
 * });
 * ```
 */
export function useEventStream({
  eventTypes,
  onEvent,
  enabled = true,
}: UseEventStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep the callback ref up to date
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled || eventTypes.length === 0) return;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/events?types=${eventTypes.join(",")}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AppEvent | { type: "connected" };

        // Ignore connection confirmation
        if (data.type === "connected") return;

        onEventRef.current(data as AppEvent);
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;

      // Reconnect after 3 seconds
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [enabled, eventTypes]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  // Return a function to manually reconnect if needed
  return {
    reconnect: connect,
  };
}
