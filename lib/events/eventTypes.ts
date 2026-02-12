// Event type definitions for the SSE event system

export type EventType = "conversation.generated" | "conversation.error";

export type ConversationGeneratedEvent = {
  type: "conversation.generated";
  conversationId: string;
};

export type ConversationErrorEvent = {
  type: "conversation.error";
  conversationId: string;
  error: string;
};

export type AppEvent = ConversationGeneratedEvent | ConversationErrorEvent;
