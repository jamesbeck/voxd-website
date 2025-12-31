"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { chunk } from "llm-chunk";

const saBulkCreateChunks = async ({
  documentId,
  text,
  chunkOptions,
}: {
  documentId: string;
  text: string;
  chunkOptions?: {
    minLength?: number;
    maxLength?: number;
    splitter?: "paragraph" | "sentence";
    overlap?: number;
  };
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  // Get the document and its associated agent's OpenAI API key
  const document = await db("knowledgeDocument")
    .join("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeDocument.id", documentId)
    .select("knowledgeDocument.*", "agent.openAiApiKey")
    .first();

  if (!document) {
    return {
      success: false,
      error: "Document not found",
    };
  }

  if (!document.openAiApiKey) {
    return {
      success: false,
      error: "Agent does not have an OpenAI API key configured",
    };
  }

  // Split text into chunks using llm-chunk
  const chunks = chunk(text, {
    minLength: chunkOptions?.minLength ?? 100,
    maxLength: chunkOptions?.maxLength ?? 1500,
    splitter: chunkOptions?.splitter ?? "paragraph",
    overlap: chunkOptions?.overlap ?? 50,
  });

  if (chunks.length === 0) {
    return {
      success: false,
      error: "No chunks were generated from the text",
    };
  }

  // Get the next chunk index
  const lastChunk = await db("knowledgeChunk")
    .where("documentId", documentId)
    .orderBy("chunkIndex", "desc")
    .first();

  const startIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;

  // Generate embeddings for all chunks
  let embeddings: number[][] = [];
  let tokenCounts: number[] = [];
  try {
    const openai = createOpenAI({ apiKey: document.openAiApiKey });
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
    });
    embeddings = result.embeddings;
    // Estimate token counts (usage is aggregate, so we estimate per chunk)
    tokenCounts = chunks.map((c) => Math.ceil(c.length / 4));
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return {
      success: false,
      error: `Failed to generate embeddings: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  // Insert all chunks
  const chunkRecords = chunks.map((content, index) => ({
    documentId,
    content,
    titlePath: null,
    chunkIndex: startIndex + index,
    tokenCount: tokenCounts[index],
    embedding: embeddings[index] ? `[${embeddings[index].join(",")}]` : null,
  }));

  const insertedChunks = await db("knowledgeChunk")
    .insert(chunkRecords)
    .returning(["id", "chunkIndex"]);

  return {
    success: true,
    data: {
      chunksCreated: insertedChunks.length,
      chunks: insertedChunks,
    },
  };
};

export { saBulkCreateChunks };
