import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IdTokenPayload, AccessTokenPayload } from "@/types/tokenTypes";
import { headers } from "next/headers";

// Overloads ensure callers get a non-null token when redirectOnError is true or omitted.
export function verifyAccessToken(): Promise<AccessTokenPayload>;
export function verifyAccessToken(
  redirectOnError: true
): Promise<AccessTokenPayload>;
export function verifyAccessToken(
  redirectOnError: false
): Promise<AccessTokenPayload | null>;
export function verifyAccessToken(
  redirectOnError?: boolean
): Promise<AccessTokenPayload | null>;

export async function verifyAccessToken(redirectOnError: boolean = true) {
  const accessTokenCookie = (await cookies()).get("access_token");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  if (!accessTokenCookie) {
    if (redirectOnError) {
      // Will throw a redirect (typed as never), satisfying non-null overload.
      return redirect(
        pathname
          ? `/login?redirectTo=${encodeURIComponent(pathname)}`
          : "/login"
      );
    }
    return null;
  }

  try {
    const token = jwt.verify(
      accessTokenCookie.value,
      process.env.ACCESS_TOKEN_SECRET
    ) as AccessTokenPayload;
    return token;
  } catch {
    if (redirectOnError) {
      return redirect(
        pathname
          ? `/login?redirectTo=${encodeURIComponent(pathname)}`
          : "/login"
      );
    }
    return null;
  }
}

export function verifyIdToken(): Promise<IdTokenPayload>;
export function verifyIdToken(redirectOnError: true): Promise<IdTokenPayload>;
export function verifyIdToken(
  redirectOnError: false
): Promise<IdTokenPayload | null>;
export function verifyIdToken(
  redirectOnError?: boolean
): Promise<IdTokenPayload | null>;
export async function verifyIdToken(redirectOnError: boolean = true) {
  const idTokenCookie = (await cookies()).get("id_token");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname");

  if (!idTokenCookie) {
    if (redirectOnError) {
      return redirect(
        pathname
          ? `/login?redirectTo=${encodeURIComponent(pathname)}`
          : "/login"
      );
    }
    return null;
  }

  try {
    const token = jwt.verify(
      idTokenCookie.value,
      process.env.ID_TOKEN_SECRET
    ) as IdTokenPayload;
    return token;
  } catch {
    if (redirectOnError) {
      return redirect(
        pathname
          ? `/login?redirectTo=${encodeURIComponent(pathname)}`
          : "/login"
      );
    }
    return null;
  }
}
