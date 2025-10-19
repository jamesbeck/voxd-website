"use server";

import { ServerActionResponse } from "@/types/types";
import getAll from "@/lib/meta/getAll";
import { Waba } from "@/types/metaTypes";
import db from "@/database/db";

const BUSINESS_ID = process.env.META_IO_SHIELD_BUSINESS_ID!;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;
const GRAPH_URL = process.env.META_GRAPH_URL!;

export default async function saSyncWithMeta(): Promise<ServerActionResponse> {
  //wabas
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

  //phoen number fields
  const phoneNumberFields = [
    "account_mode",
    "status",
    "display_phone_number",
    "health_status",
    "messaging_limit_tier",
    "name_status",
    "quality_score",
    "verified_name",
    "platform_type",
    "code_verification_status",
    "is_official_business_account",
    "is_on_biz_app",
    "is_pin_enabled",
    "is_preverified_number",
    "last_onboarded_time",
    "new_certificate",
    "new_display_name",
    "new_name_status",
    "official_business_account",
    "search_visibility",
    "whatsapp_business_manager_messaging_limit",
  ].join(",");

  // 1) Enumerate WABAs you can access (owned + client)
  const [owned, client] = await Promise.all([
    getAll<Waba>(
      `${GRAPH_URL}/${BUSINESS_ID}/owned_whatsapp_business_accounts`,
      { limit: 100, fields: wabaFields }
    ),
    getAll<Waba>(
      `${GRAPH_URL}/${BUSINESS_ID}/client_whatsapp_business_accounts`,
      { limit: 100, fields: wabaFields }
    ),
  ]);

  const wabas = [...owned, ...client];

  try {
    //save wabas to db
    for (const waba of wabas) {
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
            marketingMessagesLiteApiStatus:
              waba.marketing_messages_lite_api_status,
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
            marketingMessagesLiteApiStatus:
              waba.marketing_messages_lite_api_status,
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

      for (const phoneNumber of waba.phone_numbers?.data || []) {
        //fetch each phone number details
        const qs = new URLSearchParams({
          fields: phoneNumberFields,
          access_token: ACCESS_TOKEN,
        }).toString();

        const url = `${GRAPH_URL}/${phoneNumber.id}/?${qs}`;

        const res = await fetch(url, { cache: "no-store" });

        const phoneNumberResponse = await res.json();

        //do we already have this phone numnber?
        const existingPhoneNumber = await db("phoneNumber")
          .where({ metaId: phoneNumber.id })
          .first();

        if (existingPhoneNumber) {
          //update
          await db("phoneNumber")
            .where({ metaId: phoneNumber.id })
            .update({
              wabaId: dbWabaId,
              accountMode: phoneNumberResponse.account_mode,
              status: phoneNumberResponse.status,
              displayPhoneNumber: phoneNumberResponse.display_phone_number,
              healthStatus: JSON.stringify(phoneNumberResponse.health_status),
              messagingLimitTier: phoneNumberResponse.messaging_limit_tier,
              nameStatus: phoneNumberResponse.name_status,
              qualityScore: JSON.stringify(phoneNumberResponse.quality_score),
              verifiedName: phoneNumberResponse.verified_name,
              platformType: phoneNumberResponse.platform_type,
            });
        } else {
          //create
          await db("phoneNumber").insert({
            metaId: phoneNumber.id,
            wabaId: dbWabaId,
            accountMode: phoneNumberResponse.account_mode,
            status: phoneNumberResponse.status,
            displayPhoneNumber: phoneNumberResponse.display_phone_number,
            healthStatus: JSON.stringify(phoneNumberResponse.health_status),
            messagingLimitTier: phoneNumberResponse.messaging_limit_tier,
            nameStatus: phoneNumberResponse.name_status,
            qualityScore: JSON.stringify(phoneNumberResponse.quality_score),
            verifiedName: phoneNumberResponse.verified_name,
            platformType: phoneNumberResponse.platform_type,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error syncing with Meta:", error);
    return { success: false, error: "Error syncing with Meta" };
  }

  //show entire object deep as possible
  //   console.dir(wabas, { depth: null });

  return { success: true };

  //save to database
}
