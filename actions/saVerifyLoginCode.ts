"use server";
import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import { compare } from "bcryptjs";
import { verifyIdToken } from "@/lib/auth/verifyToken";
import { AccessTokenPayload, IdTokenPayload } from "@/types/tokenTypes";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addSeconds } from "date-fns";
import { headers } from "next/headers";

const saVerifyLoginCode = async ({
  otp,
}: {
  otp: string;
}): Promise<ServerActionResponse> => {
  const idToken = await verifyIdToken();

  if (!idToken || !otp) {
    return { success: false, error: "Missing email or code." };
  }

  if (idToken.otpExpiry && new Date(idToken.otpExpiry) < new Date()) {
    return {
      success: false,
      error: "Code has expired. Please request a new one.",
    };
  }

  //if too many attempts
  if ((idToken.failedAttempts || 0) >= 3) {
    return {
      success: false,
      error: "Too many failed attempts. Please start again.",
    };
  }

  const user = await db("user")
    .select("*")
    .where({ email: idToken.email })
    .first();

  const attempts = (user?.otpAttempts || 0) + 1;

  //increment otpAttempts
  await db("user")
    .where({ email: idToken.email })
    .update({ otpAttempts: attempts });

  const otpMatch = await compare(otp, user?.otp || "");

  //if failed
  if (!user || !otpMatch) {
    const newIdToken = jwt.sign(
      {
        email: idToken.email,
        otpExpiry: idToken.otpExpiry,
        failedAttempts: attempts,
      } as IdTokenPayload,
      process.env.ID_TOKEN_SECRET
      // { expiresIn: process.env.ID_TOKEN_LIFE_SEC }
    );

    (await cookies()).set("id_token", newIdToken, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      sameSite: "lax",
      // expires: 0,
    });

    return { success: false, error: "Incorrect code." };
  }

  //get users organisations
  const organisations = await db("organisationUser")
    .leftJoin(
      "organisation",
      "organisationUser.organisationId",
      "organisation.id"
    )
    .select("organisationId", "partnerId")
    .where({ userId: user.id });

  const awaitedHeaders = await headers();
  const hostname = awaitedHeaders.get("host") || "";
  const domain = hostname.split(":")[0].replace(".local", ""); // Remove port and local if present

  //if we're a partner, make sure they're logging in to the right domain
  if (user.partnerId) {
    const partner = await db("partner")
      .select("domain")
      .where({ id: user.partnerId })
      .first();

    //if domain doesn't match
    if (partner?.domain && domain !== partner.domain) {
      return {
        success: false,
        error: "Incorrect code.",
      };
    }
  }

  //if we're a organisation make sure we're logging in at the right partner (if there is one)
  if (organisations.length && !user.partnerId) {
    const partnerIds = Array.from(
      new Set(
        organisations
          .map((c) => c.partnerId)
          .filter((pid): pid is string => !!pid)
      )
    );

    if (partnerIds.length > 0) {
      const partners = await db("partner")
        .select("domain")
        .whereIn("id", partnerIds);

      const partnerDomains = partners.map((p) => p.domain).filter(Boolean);

      //if none of the domains match
      if (partnerDomains.length > 0 && !partnerDomains.includes(domain)) {
        return {
          success: false,
          error: "Incorrect code.",
        };
      }
    }
  }

  // TODO: Set session/cookie here
  const cookiesStore = await cookies();

  //new id token without otp info
  const newIdToken = jwt.sign(
    {
      email: idToken.email,
    } as IdTokenPayload,
    process.env.ID_TOKEN_SECRET
  );

  cookiesStore.set("id_token", newIdToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    sameSite: "lax",
  });

  //new access token
  const newAccessToken = jwt.sign(
    {
      userId: user.id,
      email: idToken.email,
      name: user.name,
      admin: user.admin,
      organisation: !!organisations.length,
      partner: !!user.partnerId,
      partnerId: user.partnerId,
    } as AccessTokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: parseInt(process.env.ACCESS_TOKEN_LIFE_SEC) }
  );

  cookiesStore.set("access_token", newAccessToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    sameSite: "lax",
    expires: addSeconds(
      Date.now(),
      parseInt(process.env.ACCESS_TOKEN_LIFE_SEC)
    ),
  });

  redirect("/admin");
};

export default saVerifyLoginCode;
