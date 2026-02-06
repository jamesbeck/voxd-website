export type ServerActionResponse =
  | {
      success: true;
      data?: any;
    }
  | { success: false; error?: string; fieldErrors?: Record<string, string> };

export type ServerActionReadResponse =
  | {
      success: true;
      data: Record<string, any>[];
      totalAvailable: number;
      page: number;
      pageSize: number;
    }
  | {
      success: false;
      error?: string;
    };

export type ServerActionReadParams<TExtra = object> = {
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
} & TExtra;

// Table Filter Types
export type TableFilterOption = {
  label: string;
  value: string;
};

export type TableFilterType = "select" | "switch";

export type TableFilterConfig = {
  /** Unique identifier for the filter, used as the key in filter values */
  name: string;
  /** Display label for the filter */
  label: string;
  /** Type of filter UI to render */
  type: TableFilterType;
  /** Default value for the filter */
  defaultValue: string | boolean;
  /** Static options for select filters */
  options?: TableFilterOption[];
  /** Async function to load options (for select filters with dynamic data) */
  loadOptions?: () => Promise<TableFilterOption[]>;
  /** Placeholder text for select filters */
  placeholder?: string;
};

export type TableFilterValues = Record<string, string | boolean>;

export type Roles = "admin" | "organisation" | "partner";

// Admin users - users who log into the admin dashboard
export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  partnerId?: string;
  superAdmin?: boolean;
  organisationId?: string;
  createdAt?: Date;
}

// Chat users - WhatsApp users who interact with agents
export interface ChatUser {
  id: string;
  name?: string;
  number: string;
  agentId: string;
  testingAgentId?: string;
  data?: Record<string, unknown>;
}

// Legacy User type - kept for backwards compatibility during migration
// @deprecated Use AdminUser or ChatUser instead
export interface User {
  id: string;
  name: string;
  number?: string;
  email?: string;
  role: Roles;
  createdAt: Date;
  partnerId?: string;
  testingAgentId?: string;
  organisationId?: string;
  agentId?: string;
  data?: Record<string, unknown>;
}

export interface Partner {
  id: string;
  name: string;
  colour: string;
  domain: string;
  openAiApiKey?: string;
  logoFileExtension?: string | null;
}

export interface Example {
  id: string;
  partnerId: string;
  title: string;
  slug: string;
  short: string;
  body: string;
  businessName: string;
  prompt: string;
  chatScenarioPrompts: string[];
  imageGenerationPrompt: string;
  logoFileExtension: string | null;
  heroImageFileExtension: string | null;
  industries: { id: string; name: string; slug: string }[];
  functions: { id: string; name: string; slug: string }[];
  exampleConversations: {
    messages: {
      role: string;
      content: string;
      time: number;
      annotation: string;
    }[];
    description: string;
    startTime: string;
  }[];
}
