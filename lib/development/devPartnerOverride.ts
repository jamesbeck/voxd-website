import { cookies } from "next/headers";

export const DEV_PARTNER_OVERRIDE_COOKIE = "dev_partner_domain";

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
}

export function assertDevelopmentEnvironment() {
  if (!isDevelopmentEnvironment()) {
    throw new Error("Development only");
  }
}

export async function getDevelopmentPartnerOverride() {
  if (!isDevelopmentEnvironment()) {
    return null;
  }

  return (await cookies()).get(DEV_PARTNER_OVERRIDE_COOKIE)?.value || null;
}

export async function setDevelopmentPartnerOverride(domain: string) {
  assertDevelopmentEnvironment();

  (await cookies()).set(DEV_PARTNER_OVERRIDE_COOKIE, domain, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: false,
  });
}

export async function clearDevelopmentPartnerOverride() {
  if (!isDevelopmentEnvironment()) {
    return;
  }

  (await cookies()).set(DEV_PARTNER_OVERRIDE_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: false,
    expires: new Date(0),
  });
}
