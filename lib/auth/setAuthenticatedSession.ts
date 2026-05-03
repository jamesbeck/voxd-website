import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { addSeconds } from "date-fns";
import { AccessTokenPayload, IdTokenPayload } from "@/types/tokenTypes";

type AuthenticatedSessionInput = {
  adminUserId: string;
  email: string;
  name?: string | null;
  superAdmin: boolean;
  partnerId?: string | null;
  organisationId?: string | null;
  organisationName?: string | null;
};

export default async function setAuthenticatedSession({
  adminUserId,
  email,
  name,
  superAdmin,
  partnerId,
  organisationId,
  organisationName,
}: AuthenticatedSessionInput) {
  const cookieStore = await cookies();
  const safeName = name || email;

  const idToken = jwt.sign(
    {
      email,
    } as IdTokenPayload,
    process.env.ID_TOKEN_SECRET,
  );

  cookieStore.set("id_token", idToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    sameSite: "lax",
  });

  const accessToken = jwt.sign(
    {
      adminUserId,
      email,
      name: safeName,
      superAdmin,
      partner: !!partnerId,
      partnerId: partnerId || undefined,
      organisationId: organisationId || undefined,
      organisationName: organisationName || undefined,
    } as AccessTokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: parseInt(process.env.ACCESS_TOKEN_LIFE_SEC) },
  );

  cookieStore.set("access_token", accessToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    sameSite: "lax",
    expires: addSeconds(
      Date.now(),
      parseInt(process.env.ACCESS_TOKEN_LIFE_SEC),
    ),
  });
}
