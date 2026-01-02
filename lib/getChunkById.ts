import db from "../database/db";

const getChunkById = async ({ chunkId }: { chunkId: string }) => {
  const chunk = await db("knowledgeChunk")
    .leftJoin(
      "knowledgeDocument",
      "knowledgeChunk.documentId",
      "knowledgeDocument.id"
    )
    .leftJoin("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeChunk.id", chunkId)
    .select(
      "knowledgeChunk.id",
      "knowledgeChunk.documentId",
      "knowledgeChunk.content",
      "knowledgeChunk.title",
      "knowledgeChunk.chunkIndex",
      "knowledgeChunk.tokenCount",
      "knowledgeChunk.createdAt",
      db.raw(
        'CASE WHEN "knowledgeChunk"."embedding" IS NOT NULL THEN true ELSE false END as "hasEmbedding"'
      ),
      "knowledgeDocument.title as documentTitle",
      "knowledgeDocument.agentId",
      "agent.name as agentName",
      "agent.niceName as agentNiceName",
      "agent.openAiApiKey"
    )
    .first();
  return chunk;
};

export default getChunkById;
