// Shared constants for Meta phone number API

export const phoneNumberFields = [
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
  "webhook_configuration",
].join(",");

export type PhoneNumberMetaResponse = {
  id: string;
  account_mode: string;
  status: string;
  display_phone_number: string;
  health_status: unknown;
  messaging_limit_tier: string | null;
  name_status: string;
  quality_score: unknown | null;
  verified_name: string | null;
  platform_type: string;
  webhook_configuration: unknown | null;
  error?: { message?: string };
};
