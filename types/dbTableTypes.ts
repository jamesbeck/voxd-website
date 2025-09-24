export interface IndustryTable {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface FunctionTable {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ExampleConversationTable {
  id: string;
  exampleId: string;
  messages: { role: string; content: string }[];
  prompt: string;
  description: string;
}
