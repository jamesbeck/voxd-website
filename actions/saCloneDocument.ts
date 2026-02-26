"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { addLog } from "@/lib/addLog";

const cloneDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  targetAgentId: z.string().min(1, "Target agent is required"),
});

const saCloneDocument = async (input: {
  documentId: string;
  targetAgentId: string;
}): Promise<ServerActionResponse> => {
  const parsed = cloneDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please check your inputs.",
    };
  }

  const { documentId, targetAgentId } = parsed.data;

  const accessToken = await verifyAccessToken();

  try {
    // Fetch source document
    const sourceDocument = await db("knowledgeDocument")
      .where("id", documentId)
      .first();

    if (!sourceDocument) {
      return { success: false, error: "Document not found" };
    }

    // Verify user can view the source agent
    if (!(await userCanViewAgent({ agentId: sourceDocument.agentId }))) {
      return { success: false, error: "Unauthorized to access source agent" };
    }

    // Verify user can view the target agent
    if (!(await userCanViewAgent({ agentId: targetAgentId }))) {
      return { success: false, error: "Unauthorized to access target agent" };
    }

    // Prevent cloning to the same agent
    if (sourceDocument.agentId === targetAgentId) {
      return {
        success: false,
        error: "Cannot clone a document to the same agent",
      };
    }

    // Clone document and blocks in a transaction
    const newDocId = await db.transaction(async (trx) => {
      // 1. Clone the document
      const [newDoc] = await trx("knowledgeDocument")
        .insert({
          agentId: targetAgentId,
          title: sourceDocument.title,
          description: sourceDocument.description,
          sourceUrl: sourceDocument.sourceUrl,
          sourceType: sourceDocument.sourceType,
          metadata: sourceDocument.metadata
            ? JSON.stringify(sourceDocument.metadata)
            : null,
          enabled: sourceDocument.enabled,
        })
        .returning("*");

      // 2. Clone all knowledge blocks
      const blocks = await trx("knowledgeBlock")
        .where("documentId", documentId)
        .select("*");

      if (blocks.length > 0) {
        await trx("knowledgeBlock").insert(
          blocks.map((block: any) => ({
            documentId: newDoc.id,
            content: block.content,
            title: block.title,
            blockIndex: block.blockIndex,
            metadata: block.metadata ? JSON.stringify(block.metadata) : null,
            tokenCount: block.tokenCount,
            embedding: block.embedding,
          })),
        );
      }

      return newDoc.id;
    });

    // Log the clone action
    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Document Cloned",
      description: `Knowledge document "${sourceDocument.title}" cloned to agent ${targetAgentId}`,
      agentId: targetAgentId,
      data: {
        sourceDocumentId: documentId,
        newDocumentId: newDocId,
        sourceAgentId: sourceDocument.agentId,
        targetAgentId,
        title: sourceDocument.title,
      },
    });

    return {
      success: true,
      data: { id: newDocId, agentId: targetAgentId },
    };
  } catch (error) {
    console.error("Error cloning document:", error);
    return { success: false, error: "Error cloning document" };
  }
};

export default saCloneDocument;
