import db from "../database/db";

const getDocumentById = async ({ documentId }: { documentId: string }) => {
  const document = await db("knowledgeDocument")
    .leftJoin("agent", "knowledgeDocument.agentId", "agent.id")
    .leftJoin("providerApiKey", "agent.providerApiKeyId", "providerApiKey.id")
    .where("knowledgeDocument.id", documentId)
    .select(
      "knowledgeDocument.*",
      "agent.name as agentName",
      "agent.niceName as agentNiceName",
      db.raw('"providerApiKey"."key" as "providerApiKey"'),
      "agent.organisationId as organisationId",
    )
    .first();
  return document;
};

export default getDocumentById;
