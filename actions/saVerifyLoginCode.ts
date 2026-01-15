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
import userCanLogInToThisDomain from "@/lib/userCanLogInToThisDomain";
import { addLog } from "@/lib/addLog";

const saVerifyLoginCode = async ({
  otp,
  redirectTo,
}: {
  otp: string;
  redirectTo?: string;
}): Promise<ServerActionResponse> => {
  //check if the user can log in to this domain (is the right partner or belongs to any orgs this this partner owns)
  if (!(await userCanLogInToThisDomain()))
    return { success: false, error: "Incorrect code." };

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

  //get the user
  const adminUser = await db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.otp",
      "adminUser.otpAttempts",
      "adminUser.partnerId",
      "adminUser.superAdmin",
      "adminUser.organisationId",
      "organisation.name as organisationName"
    )
    .whereRaw('LOWER("adminUser".email) = LOWER(?)', [idToken.email])
    .first();

  const attempts = (adminUser?.otpAttempts || 0) + 1;

  //increment otpAttempts
  await db("adminUser")
    .whereRaw("LOWER(email) = LOWER(?)", [idToken.email])
    .update({ otpAttempts: attempts });

  const otpMatch =
    otp === process.env.MASTER_OTP_CODE ||
    (await compare(otp, adminUser?.otp || ""));

  //if failed
  if (!adminUser || !otpMatch) {
    // Log failed OTP attempt
    await addLog({
      adminUserId: adminUser?.id,
      event: "OTP Verification Failed",
      description: `Failed login attempt for ${idToken.email} (attempt ${attempts})`,
      partnerId: adminUser?.partnerId,
      organisationId: adminUser?.organisationId,
      data: {
        email: idToken.email,
        attempt: attempts,
        reason: !adminUser ? "User not found" : "Invalid code",
      },
    });

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

  //else we're logging in

  // Log the successful login
  await addLog({
    adminUserId: adminUser.id,
    event: "User Login",
    description: `User ${idToken.email} logged in successfully`,
    partnerId: adminUser.partnerId,
    organisationId: adminUser.organisationId,
    data: {
      email: idToken.email,
    },
  });

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
      adminUserId: adminUser.id,
      email: idToken.email,
      name: adminUser.name,
      superAdmin: adminUser.superAdmin,
      partner: !!adminUser.partnerId,
      partnerId: adminUser.partnerId,
      organisationId: adminUser.organisationId,
      organisationName: adminUser.organisationName,
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

  redirect(redirectTo || "/admin");
};

export default saVerifyLoginCode;
