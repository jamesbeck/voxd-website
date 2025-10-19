export type Page<T> = {
  data: T[];
  paging?: { 
    cursors?: { before?: string; after?: string };
    next?: string;
    previous?: string;
  };
};

export type Waba = {
  id: string;
  name?: string;
  status?: string; // e.g. ACTIVE
  ownership_type?: string;
  business_verification_status?: string;
  account_review_status?: "PENDING" | "APPROVED" | "REJECTED";
  message_template_namespace?: string;
  marketing_messages_lite_api_status?: string;
  marketing_messages_onboarding_status?: string;
  country?: string;
  health_status?: {
    can_send_message: string;
    entities: {
      entity_type: string;
      id: string;
      can_send_message: string;
      errors?: {
        error_code: number;
        error_description: string;
        possible_solution: string;
      }[];
    }[];
  };
  currency?: string;
  is_enabled_for_insights?: boolean;
  timezone_id?: string;
  on_behalf_of_business_info?: {
    name: string;
    id: string;
    status: string;
    type: string;
  };
  phone_numbers?: Page<{
    verified_name: string;
    id: string;
    code_verification_status: string;
    display_phone_number: string;
    quality_rating: string;
    platform_type: string;
    throughput: { level: string };
    webhook_configuration: {
      application: string;
      waba: string;
      phone_number: string;
    };
  }>;
  subscribed_apps?: Page<{
    whatsapp_business_api_data: {
      name: string;
      id: string;
      category: string;
      link: string;
    };
  }>;
};

export type PhoneNumber = {
  account_mode: string;
  status: string;
  display_phone_number: string;
  health_status?: {
    can_send_message: string;
    entities: {
      entity_type: string;
      id: string;
      can_send_message: string;
      errors?: {
        error_code: number;
        error_description: string;
        possible_solution: string;
      }[];
    }[];
  };
  name_status: string;
  verified_name: string;
  platform_type: string;
  id: string;
};
