import db from "../database/db";

const getKnowledgeBlockById = async ({ blockId }: { blockId: string }) => {
  const block = await db("knowledgeBlock")
    .leftJoin(
      "knowledgeDocument",
      "knowledgeBlock.documentId",
      "knowledgeDocument.id",
    )
    .leftJoin("agent", "knowledgeDocument.agentId", "agent.id")
    .leftJoin("providerApiKey", "agent.providerApiKeyId", "providerApiKey.id")
    .where("knowledgeBlock.id", blockId)
    .select(
      "knowledgeBlock.id",
      "knowledgeBlock.documentId",
      "knowledgeBlock.content",
      "knowledgeBlock.title",
      "knowledgeBlock.blockIndex",
      "knowledgeBlock.tokenCount",
      "knowledgeBlock.createdAt",
      db.raw(
        'CASE WHEN "knowledgeBlock"."embedding" IS NOT NULL THEN true ELSE false END as "hasEmbedding"',
      ),
      "knowledgeDocument.title as documentTitle",
      "knowledgeDocument.agentId",
      "agent.name as agentName",
      "agent.niceName as agentNiceName",
      db.raw('"providerApiKey"."key" as "providerApiKey"'),
    )
    .first();
  return block;
};

export default getKnowledgeBlockById;
