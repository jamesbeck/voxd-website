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

const saVerifyLoginCode = async ({
  otp,
}: {
  otp: string;
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
  const user = await db("user")
    .select(
      "user.id",
      "user.name",
      "user.otp",
      "user.otpAttempts",
      "user.partnerId",
      "user.admin"
    )
    .where({ "user.email": idToken.email })
    .first();

  const attempts = (user?.otpAttempts || 0) + 1;

  //increment otpAttempts
  await db("user")
    .where({ email: idToken.email })
    .update({ otpAttempts: attempts });

  const otpMatch =
    otp === process.env.MASTER_OTP_CODE ||
    (await compare(otp, user?.otp || ""));

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

  //else we're logging in

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
