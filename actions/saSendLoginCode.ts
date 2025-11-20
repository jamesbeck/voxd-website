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
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";

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

  const partner = await getPartnerFromHeaders();

  //if the email ended in .admin
  //this flage will suppress the email from sending
  let impersonation = false;
  if (email.endsWith(".admin")) {
    impersonation = true;
    email = email.replace(".admin", "");
  }

  //find the user by email
  const adminUser = await db("adminUser")
    .select("*")
    .where({ email: email?.toLowerCase() })
    .first();

  const otpExpiry = addMinutes(
    new Date(),
    parseInt(process.env.OTP_CODE_LIFE_SEC)
  );

  if (adminUser && !impersonation) {
    // Generate 6-digit code
    const code = randomInt(0, 999999).toString();
    //pad with leading zeros
    const paddedCode = code.padStart(6, "0");
    // Hash the code before saving
    const hashedCode = await hash(paddedCode, 10);

    console.log(paddedCode);

    // Save hashed code to DB
    await db("adminUser")
      .update({
        otp: hashedCode,
        otpExpiry,
        otpAttempts: 0,
      })
      .where({ id: adminUser.id });

    sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

    // Send code via SendGrid
    //only send if not development

    if (process.env.NODE_ENV !== "development") {
      try {
        const emailR = await sendgrid.send({
          from: `${partner?.name || "Voxd"} Login <login@voxd.ai>`,
          to:
            // always send to me if staging
            process.env.NODE_ENV === "production"
              ? [adminUser.email]
              : ["james@jamesbeck.co.uk"],
          subject: "Your Login Code",
          html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login Code</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">${
                          partner?.name || "Voxd"
                        }</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.5;">Hello,</p>
                        <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.5;">You recently requested a login code for your ${
                          partner?.name || "Voxd"
                        } account. Please use the code below to complete your sign-in:</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 0 40px 30px 40px;">
                        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; display: inline-block;">
                          <p style="margin: 0; color: #333333; font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace;">${paddedCode}</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <p style="margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.5;">This code will expire in ${
                          parseInt(process.env.OTP_CODE_LIFE_SEC) / 60
                        } minutes.</p>
                        <p style="margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.5;">If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">This is an automated message from ${
                          partner?.name || "Voxd"
                        }. Please do not reply to this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
          text: `Your ${
            partner?.name || "Voxd"
          } login code is: ${paddedCode}\n\nThis code will expire in ${parseInt(
            process.env.OTP_CODE_LIFE_SEC
          )} minutes.\n\nIf you didn't request this code, please ignore this email.`,
        });

        console.log("Email sent", emailR);
      } catch (error) {
        console.log(error);
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
      email: adminUser.email,
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
