import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "@/types/tokenTypes";
import { addClient, removeClient } from "@/lib/events/eventEmitter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Authenticate the request
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get("access_token");

  if (!accessTokenCookie) {
    return new Response("Unauthorized", { status: 401 });
  }

  let token: AccessTokenPayload;
  try {
    token = jwt.verify(
      accessTokenCookie.value,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as AccessTokenPayload;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get event types from query params
  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get("types");

  if (!typesParam) {
    return new Response("Missing types parameter", { status: 400 });
  }

  const eventTypes = typesParam.split(",").filter(Boolean);

  if (eventTypes.length === 0) {
    return new Response("No valid event types provided", { status: 400 });
  }

  // Create a unique client ID
  const clientId = `${token.adminUserId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Create the SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Register this client
      addClient(clientId, token.adminUserId, eventTypes, controller);

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`),
      );

      // Send keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        removeClient(clientId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
