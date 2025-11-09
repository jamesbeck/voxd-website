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

export type Roles = "admin" | "customer" | "partner";

export interface User {
  id: string;
  name: string;
  number?: string;
  email?: string;
  role: Roles;
  createdAt: Date;
  partnerId?: string;
  testingAgentId?: string;
  customerIds?: string[];
}

export interface Partner {
  id: string;
  name: string;
  colour: string;
  domain: string;
}

export interface Example {
  id: string;
  title: string;
  slug: string;
  short: string;
  body: string;
  businessName: string;
  prompt: string;
  chatScenarioPrompts: string[];
  imageGenerationPrompt: string;
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
