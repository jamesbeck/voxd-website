import {
  IndustryTable,
  FunctionTable,
  ExampleConversationTable,
} from "./dbTableTypes";

export interface ServerActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Industry extends IndustryTable {
  exampleCount: number;
}

export interface Function extends FunctionTable {
  exampleCount: number;
}

export interface Example {
  id: string;
  title: string;
  slug: string;
  short: string;
  body: string;
  industries: IndustryTable[];
  functions: FunctionTable[];
  exampleConversations: ExampleConversationTable[];
}
