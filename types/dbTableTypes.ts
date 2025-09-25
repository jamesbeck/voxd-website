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
  messages: {
    role: string;
    content: string;
    annotation: string;
    time: number;
  }[];
  prompt: string;
  description: string;
  startTime: string;
}
