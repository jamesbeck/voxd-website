import { NextRequest, NextResponse } from "next/server";
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

  // Fire off generation in the background — don't await it
  // This allows the API response to return immediately
  generateExampleConversation({
    conversationId,
    adminUserId: accessToken.adminUserId,
  }).catch((error) => {
    console.error("Background conversation generation error:", error);
  });

  return NextResponse.json({ success: true });
}
