import db from "../database/db";

const getDocumentById = async ({ documentId }: { documentId: string }) => {
  const document = await db("knowledgeDocument")
    .leftJoin("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeDocument.id", documentId)
    .select(
      "knowledgeDocument.*",
      "agent.name as agentName",
      "agent.niceName as agentNiceName",
      "agent.openAiApiKey",
      "agent.organisationId as organisationId",
    )
    .first();
  return document;
};

export default getDocumentById;
