import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { generateExampleConversation } from "@/lib/generateExampleConversation";

export async function POST(request: NextRequest) {
  const accessToken = await verifyAccessToken(false);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!accessToken.superAdmin && !accessToken.partner) {
    return NextResponse.json(
      { error: "Only partners and super admins can generate conversations" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  // Use after() to keep the serverless function alive after the response is sent.
  // Without this, Vercel kills the function as soon as the response returns,
  // terminating the generation mid-flight.
  after(
    generateExampleConversation({
      conversationId,
      adminUserId: accessToken.adminUserId,
    }).catch((error) => {
      console.error("Background conversation generation error:", error);
    }),
  );

  return NextResponse.json({ success: true });
}
