"use server";

import { addLog } from "@/lib/addLog";
import setAuthenticatedSession from "@/lib/auth/setAuthenticatedSession";
import { getAdminUserDevContextById } from "@/lib/adminUsers/getAdminUserDevContext";
import {
  clearDevelopmentPartnerOverride,
  isDevelopmentEnvironment,
  setDevelopmentPartnerOverride,
} from "@/lib/development/devPartnerOverride";
import { ServerActionResponse } from "@/types/types";

const saLogInAsAdminUserForDevelopment = async ({
  adminUserId,
}: {
  adminUserId: string;
}): Promise<ServerActionResponse> => {
  if (!isDevelopmentEnvironment()) {
    return { success: false, error: "Development only." };
  }

  if (!adminUserId) {
    return { success: false, error: "User is required." };
  }

  const adminUser = await getAdminUserDevContextById(adminUserId);

  if (!adminUser?.email) {
    return { success: false, error: "User not found." };
  }

  if (adminUser.effectivePartnerDomain) {
    await setDevelopmentPartnerOverride(adminUser.effectivePartnerDomain);
  } else {
    await clearDevelopmentPartnerOverride();
  }

  await addLog({
    adminUserId: adminUser.id,
    event: "User Login",
    description: `User ${adminUser.email} logged in via development overlay`,
    partnerId: adminUser.effectivePartnerId || undefined,
    organisationId: adminUser.organisationId || undefined,
    data: {
      email: adminUser.email,
      developmentImpersonation: true,
    },
  });

  await setAuthenticatedSession({
    adminUserId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    superAdmin: adminUser.superAdmin,
    isPartner: adminUser.organisationIsPartner,
    partnerId: adminUser.organisationIsPartner ? adminUser.organisationId : null,
    organisationId: adminUser.organisationId,
    organisationName: adminUser.organisationName,
    organisationIsPartner: adminUser.organisationIsPartner,
    organisationPartnerId: adminUser.organisationIsPartner
      ? null
      : adminUser.effectivePartnerId,
  });

  return {
    success: true,
    data: {
      effectivePartnerDomain: adminUser.effectivePartnerDomain,
    },
  };
};

export default saLogInAsAdminUserForDevelopment;
