import { AppEvent } from "./eventTypes";

type ClientConnection = {
  userId: string;
  eventTypes: string[];
  controller: ReadableStreamDefaultController;
};

// In-memory store for connected clients
// For multi-instance deployments, replace with Redis pub/sub
const connectedClients = new Map<string, ClientConnection>();

export function addClient(
  clientId: string,
  userId: string,
  eventTypes: string[],
  controller: ReadableStreamDefaultController,
) {
  connectedClients.set(clientId, { userId, eventTypes, controller });
}

export function removeClient(clientId: string) {
  connectedClients.delete(clientId);
}

export function emitEvent(userId: string, event: AppEvent) {
  const encoder = new TextEncoder();
  const eventData = `data: ${JSON.stringify(event)}\n\n`;

  for (const [clientId, client] of connectedClients) {
    // Only send to clients matching the userId and subscribed event type
    if (client.userId === userId && client.eventTypes.includes(event.type)) {
      try {
        client.controller.enqueue(encoder.encode(eventData));
      } catch {
        // Client disconnected, clean up
        connectedClients.delete(clientId);
      }
    }
  }
}

export function getClientCount() {
  return connectedClients.size;
}
