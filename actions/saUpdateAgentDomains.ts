"use server";

import { addLog } from "@/lib/addLog";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+(?:[a-z]{2,63})$/;
const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function isValidDomainEntry(value: string) {
  if (value === "localhost") {
    return true;
  }

  return HOSTNAME_PATTERN.test(value) || IPV4_PATTERN.test(value);
}

function normalizeDomainList(
  values: string[] | undefined,
  fieldName: "domains" | "developmentDomains",
):
  | { success: true; data: string[] }
  | { success: false; fieldErrors: Record<string, string> } {
  const normalized = Array.from(
    new Set(
      (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean),
    ),
  );

  const invalidValue = normalized.find((value) => {
    if (
      value.includes("://") ||
      value.includes("/") ||
      value.includes("?") ||
      value.includes("#") ||
      value.includes(":")
    ) {
      return true;
    }

    return !isValidDomainEntry(value);
  });

  if (invalidValue) {
    return {
      success: false,
      fieldErrors: {
        [fieldName]: `Invalid domain: ${invalidValue}. Use bare hostnames only, without protocol, port, or path.`,
      },
    };
  }

  return {
    success: true,
    data: normalized,
  };
}

const saUpdateAgentDomains = async ({
  agentId,
  domains,
  developmentDomains,
}: {
  agentId: string;
  domains?: string[];
  developmentDomains?: string[];
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!agentId) {
    return {
      success: false,
      error: "Agent ID is required",
    };
  }

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to update agent domains.",
    };
  }

  const existingAgent = await db("agent")
    .select("*")
    .where({ id: agentId })
    .first();

  if (!existingAgent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  const normalizedDomains = normalizeDomainList(domains, "domains");

  if (!normalizedDomains.success) {
    return {
      success: false,
      error: "Validation failed. Please check your inputs.",
      fieldErrors: normalizedDomains.fieldErrors,
    };
  }

  const normalizedDevelopmentDomains = normalizeDomainList(
    developmentDomains,
    "developmentDomains",
  );

  if (!normalizedDevelopmentDomains.success) {
    return {
      success: false,
      error: "Validation failed. Please check your inputs.",
      fieldErrors: normalizedDevelopmentDomains.fieldErrors,
    };
  }

  await db("agent").where({ id: agentId }).update({
    domains: normalizedDomains.data,
    developmentDomains: normalizedDevelopmentDomains.data,
  });

  await addLog({
    event: "Agent Embed Domains Updated",
    description: `Updated embed domain allowlists for agent ${existingAgent.niceName}`,
    adminUserId: accessToken.adminUserId,
    agentId,
    data: {
      before: {
        domains: existingAgent.domains ?? [],
        developmentDomains: existingAgent.developmentDomains ?? [],
      },
      after: {
        domains: normalizedDomains.data,
        developmentDomains: normalizedDevelopmentDomains.data,
      },
    },
  });

  return { success: true };
};

export default saUpdateAgentDomains;
