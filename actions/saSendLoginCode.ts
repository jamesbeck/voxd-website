"use server";

import { ServerActionResponse } from "@/types/types";
import z from "zod";
import { randomInt } from "crypto";
import { hash } from "bcryptjs";
import sendgrid from "@sendgrid/mail";
import db from "../database/db";
import { addMinutes } from "date-fns";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { IdTokenPayload } from "@/types/tokenTypes";

const saSendLoginCode = async ({
  email,
}: {
  email: string;
}): Promise<ServerActionResponse> => {
  //use zod to cehck if email is valid
  const emailSchema = z.email();
  const parseResult = emailSchema.safeParse(email);
  if (!parseResult.success) {
    return {
      success: false,
      fieldErrors: { email: "Invalid email address." },
    };
  }

  //if the email ended in .admin
  let impersonation = false;
  if (email.endsWith(".admin")) {
    impersonation = true;
    email = email.replace(".admin", "");
  }

  //find the user by email
  const user = await db("user").select("*").where({ email }).first();

  const otpExpiry = addMinutes(
    new Date(),
    parseInt(process.env.OTP_CODE_LIFE_SEC)
  );

  if (user && !impersonation) {
    // Generate 6-digit code
    const code = randomInt(0, 999999).toString();
    //pad with leading zeros
    const paddedCode = code.padStart(6, "0");
    // Hash the code before saving
    const hashedCode = await hash(paddedCode, 10);

    console.log(paddedCode);

    // Save hashed code to DB
    await db("user")
      .update({
        email,
        otp: hashedCode,
        otpExpiry,
        otpAttempts: 0,
      })
      .where({ id: user.id });

    sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

    // Send code via SendGrid
    //only send if not development
    if (process.env.NODE_ENV !== "development") {
      try {
        await sendgrid.send({
          from: "Voxd Login <sw@jamesbeck.co.uk>",
          to:
            // always send to me if staging
            process.env.NODE_ENV === "production"
              ? [user.email]
              : ["james@jamesbeck.co.uk"],
          subject: "Your Login Code",
          text: `Your login code is: ${paddedCode}`,
          html: `<p>Your login code is: <strong>${paddedCode}</strong></p>`,
        });
      } catch (error) {
        return {
          success: false,
          fieldErrors: { root: "Failed to send email." },
        };
      }
    }
  }

  //send a cookie regardless so we dont't reveal if the email exists

  //set a cookie that includes the email address they tried to login with
  const idToken = jwt.sign(
    {
      email: email,
      otpExpiry,
      failedAttempts: 0,
    } as IdTokenPayload,
    process.env.ID_TOKEN_SECRET
    // { expiresIn: process.env.ID_TOKEN_LIFE_SEC }
  );

  (await cookies()).set("id_token", idToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    sameSite: "lax",
    // expires: 0,
  });

  redirect("/login/verify");
};

export default saSendLoginCode;
