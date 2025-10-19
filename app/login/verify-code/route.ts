import { NextRequest, NextResponse } from "next/server";
import db from "@/database/db";
import { compare } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json(
      { success: false, error: "Missing email or code." },
      { status: 400 }
    );
  }

  // Get the latest code for this email
  const record = await db("login_codes")
    .where({ email })
    .orderBy("created_at", "desc")
    .first();

  if (!record) {
    return NextResponse.json(
      { success: false, error: "No code found for this email." },
      { status: 400 }
    );
  }

  const valid = await compare(code, record.code);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Invalid code." },
      { status: 401 }
    );
  }

  // TODO: Set session/cookie here

  return NextResponse.json({ success: true });
}
