"use server";

import { ServerActionResponse } from "@/types/types";
import getAll from "@/lib/meta/getAll";
import { Waba } from "@/types/metaTypes";
import db from "@/database/db";
import { syncPhoneNumberFromMeta } from "./saSyncPhoneNumberWithMeta";

const GRAPH_URL = process.env.META_GRAPH_URL!;

const wabaFields = [
  "id",
  "name",
  "status",
  "ownership_type",
  "business_verification_status",
  "account_review_status",
  "message_template_namespace",
  // "is_shared_with_partners",
  "marketing_messages_lite_api_status",
  "marketing_messages_onboarding_status",
  "health_status",
  "timezone_id",
  "is_enabled_for_insights",
  // // "eligible_for_sending_notifications",
  // // "ineligible_for_sending_notifications_reason",
  "on_behalf_of_business_info",
  // "primary_funding_id",
  // "purchase_order_number",
  // "analytics",
  // "link",
  "subscribed_apps",
  "phone_numbers",
].join(",");

async function syncSingleWaba(waba: Waba, accessToken: string): Promise<void> {
  let dbBusinessId = null;
  let dbWabaId = null;

  //do we already have this metaBusiness
  const existingMetaBusiness = await db("metaBusiness")
    .where({ metaId: waba.on_behalf_of_business_info?.id })
    .first();

  if (existingMetaBusiness) {
    dbBusinessId = existingMetaBusiness.id;

    //update the business
    await db("metaBusiness")
      .update({
        name: waba.on_behalf_of_business_info?.name,
        status: waba.on_behalf_of_business_info?.status,
        type: waba.on_behalf_of_business_info?.type,
      })
      .where({ id: dbBusinessId });
  }

  //create the business if we don't have it yet and we have info
  if (!existingMetaBusiness && waba.on_behalf_of_business_info) {
    //create
    await db("metaBusiness").insert({
      metaId: waba.on_behalf_of_business_info.id,
      name: waba.on_behalf_of_business_info.name,
      status: waba.on_behalf_of_business_info.status,
      type: waba.on_behalf_of_business_info.type,
    });
  }

  //do we already have this waba?
  const existingWaba = await db("waba").where({ metaId: waba.id }).first();
  if (existingWaba) {
    dbWabaId = existingWaba.id;
    //update
    await db("waba")
      .where({ metaId: waba.id })
      .update({
        metaBusinessId: dbBusinessId,
        name: waba.name,
        status: waba.status,
        ownershipType: waba.ownership_type,
        businessVerificationStatus: waba.business_verification_status,
        accountReviewStatus: waba.account_review_status,
        messageTemplateNamespace: waba.message_template_namespace,
        marketingMessagesLiteApiStatus: waba.marketing_messages_lite_api_status,
        marketingMessagesOnboardingStatus:
          waba.marketing_messages_onboarding_status,
        healthStatus: JSON.stringify(waba.health_status || null),
        timezoneId: waba.timezone_id,
        isEnabledForInsights: waba.is_enabled_for_insights,
        subscribedApps: JSON.stringify(waba.subscribed_apps || null),
      });
  } else {
    //create
    const newWaba = await db("waba")
      .insert({
        metaId: waba.id,
        metaBusinessId: dbBusinessId,
        name: waba.name,
        status: waba.status,
        ownershipType: waba.ownership_type,
        businessVerificationStatus: waba.business_verification_status,
        accountReviewStatus: waba.account_review_status,
        messageTemplateNamespace: waba.message_template_namespace,
        marketingMessagesLiteApiStatus: waba.marketing_messages_lite_api_status,
        marketingMessagesOnboardingStatus:
          waba.marketing_messages_onboarding_status,
        healthStatus: JSON.stringify(waba.health_status || null),
        timezoneId: waba.timezone_id,
        isEnabledForInsights: waba.is_enabled_for_insights,
        subscribedApps: JSON.stringify(waba.subscribed_apps || null),
      })
      .returning("id");

    dbWabaId = newWaba[0].id;
  }

  // Sync phone numbers using the shared function
  for (const phoneNumber of waba.phone_numbers?.data || []) {
    await syncPhoneNumberFromMeta({
      metaId: phoneNumber.id,
      wabaId: dbWabaId,
      accessToken,
    });
  }

  // Sync message templates for this WABA
  const templates = await getAll<{
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    components?: unknown[];
    parameter_format?: string;
    sub_category?: string;
  }>(
    `${GRAPH_URL}/${waba.id}/message_templates`,
    {
      limit: 100,
      fields:
        "id,name,status,category,language,components,parameter_format,sub_category",
    },
    accessToken,
  );

  for (const template of templates) {
    const templateData = {
      language: template.language,
      components: template.components,
      parameter_format: template.parameter_format,
      sub_category: template.sub_category,
    };

    // Do we already have this template?
    const existingTemplate = await db("waTemplate")
      .where({ wabaId: dbWabaId, metaId: template.id })
      .first();

    if (existingTemplate) {
      // Update
      await db("waTemplate")
        .where({ wabaId: dbWabaId, metaId: template.id })
        .update({
          name: template.name,
          status: template.status,
          category: template.category,
          data: JSON.stringify(templateData),
          updatedAt: db.fn.now(),
        });
    } else {
      // Create
      await db("waTemplate").insert({
        wabaId: dbWabaId,
        metaId: template.id,
        name: template.name,
        status: template.status,
        category: template.category,
        data: JSON.stringify(templateData),
      });
    }
  }

  // Remove templates that no longer exist in Meta
  const templateMetaIds = templates.map((t) => t.id);
  if (templateMetaIds.length > 0) {
    await db("waTemplate")
      .where({ wabaId: dbWabaId })
      .whereNotIn("metaId", templateMetaIds)
      .delete();
  } else {
    // If no templates returned, delete all for this WABA
    await db("waTemplate").where({ wabaId: dbWabaId }).delete();
  }
}

/**
 * Get the access token for a WABA by looking up its linked app
 */
async function getAccessTokenForWaba(wabaDbId: string): Promise<string | null> {
  // Get the WABA and its linked app
  const waba = await db("waba").where({ id: wabaDbId }).first();

  if (waba?.appId) {
    const app = await db("app").where({ id: waba.appId }).first();
    if (app?.accessToken) {
      return app.accessToken;
    }
  }

  return null;
}

export default async function saSyncWabaWithMeta({
  wabaId,
}: {
  wabaId?: string;
} = {}): Promise<ServerActionResponse> {
  try {
    if (wabaId) {
      // Sync a specific WABA by its database ID
      const dbWaba = await db("waba").where({ id: wabaId }).first();
      if (!dbWaba) {
        return { success: false, error: "WABA not found" };
      }

      // Get the access token for this WABA
      const accessToken = await getAccessTokenForWaba(wabaId);
      if (!accessToken) {
        return {
          success: false,
          error:
            "No access token available for this WABA. Please ensure it has phone numbers linked to an app.",
        };
      }

      // Fetch the WABA from Meta using its metaId
      const qs = new URLSearchParams({
        fields: wabaFields,
        access_token: accessToken,
      }).toString();

      const url = `${GRAPH_URL}/${dbWaba.metaId}/?${qs}`;
      const res = await fetch(url, { cache: "no-store" });
      const waba = (await res.json()) as Waba & {
        error?: { message?: string };
      };

      if (waba.error) {
        return {
          success: false,
          error: waba.error.message || "Error fetching WABA from Meta",
        };
      }

      await syncSingleWaba(waba, accessToken);
    } else {
      // Sync all WABAs by iterating through all unique metaBusinessIds in the app table
      const apps = await db("app").select("*");

      if (apps.length === 0) {
        return {
          success: false,
          error: "No apps found in the database. Please add an app first.",
        };
      }

      // Get unique metaBusinessIds
      const uniqueBusinessIds = [
        ...new Set(
          apps.map((app: { metaBusinessId: string }) => app.metaBusinessId),
        ),
      ];

      for (const metaBusinessId of uniqueBusinessIds) {
        // Find an app with this business ID to get its access token
        const app = apps.find(
          (a: { metaBusinessId: string }) =>
            a.metaBusinessId === metaBusinessId,
        );
        if (!app) continue;

        const accessToken = app.accessToken;

        // Fetch owned and client WABAs for this business
        const [owned, client] = await Promise.all([
          getAll<Waba>(
            `${GRAPH_URL}/${metaBusinessId}/owned_whatsapp_business_accounts`,
            { limit: 100, fields: wabaFields },
            accessToken,
          ),
          getAll<Waba>(
            `${GRAPH_URL}/${metaBusinessId}/client_whatsapp_business_accounts`,
            { limit: 100, fields: wabaFields },
            accessToken,
          ),
        ]);

        const wabas = [...owned, ...client];

        for (const waba of wabas) {
          await syncSingleWaba(waba, accessToken);
        }
      }
    }
  } catch (error) {
    console.error("Error syncing with Meta:", error);
    return { success: false, error: "Error syncing with Meta" };
  }

  return { success: true };
}
