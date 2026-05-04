import db from "../database/db";

export type PublicExampleConversation = {
  id: string;
  description: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    time: number;
    annotation: string | null;
  }[];
};

export type PublicExample = {
  id: string;
  title: string;
  businessName: string;
  short: string;
  body: string;
  logoFileExtension: string | null;
  heroImageFileExtension: string | null;
  createdAt: string;
  organisationId: string | null;
  organisationPrimaryColour: string | null;
  organisationLogoFileExtension: string | null;
  organisationShowLogoOnColour: string | null;
  partner: {
    name: string;
    domain: string | null;
  };
  exampleConversations: PublicExampleConversation[];
};

export const getExampleForPublic = async ({
  exampleId,
  slug,
}: {
  exampleId?: string;
  slug?: string;
}): Promise<PublicExample | null> => {
  let query = db("example")
    .leftJoin("organisation", "example.organisationId", "organisation.id");

  if (exampleId) {
    query = query.where("example.id", exampleId);
  } else if (slug) {
    query = query.where("example.slug", slug);
  } else {
    return null;
  }

  const example = await query
    .select(
      "example.id",
      "example.title",
      "example.businessName",
      "example.short",
      "example.body",
      "example.logoFileExtension",
      "example.heroImageFileExtension",
      "example.createdAt",
      "organisation.name as partnerName",
      "organisation.domain as partnerDomain",
      "organisation.id as organisationId",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
      db.raw('organisation."primaryColour" as "organisationPrimaryColour"'),
    )
    .first();

  if (!example) {
    return null;
  }

  // Get example conversations for this example
  const conversations = await db("exampleConversation")
    .where("exampleId", example.id)
    .select("id", "description", "startTime", "messages")
    .orderBy("id", "asc");

  // Parse the messages JSON for each conversation
  const parsedConversations = conversations.map((conv) => ({
    id: conv.id,
    description: conv.description,
    startTime: conv.startTime,
    messages: (typeof conv.messages === "string"
      ? JSON.parse(conv.messages)
      : conv.messages
    ).map(
      (m: {
        role: string;
        content: string;
        time: number;
        annotation?: string | null;
        imageUrl?: string;
        fileName?: string;
        fileSize?: string;
      }) => ({
        role: m.role,
        content: m.content,
        time: m.time,
        annotation: m.annotation || null,
        imageUrl: m.imageUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
      }),
    ),
  }));

  return {
    id: example.id,
    title: example.title,
    businessName: example.businessName,
    short: example.short,
    body: example.body,
    logoFileExtension: example.logoFileExtension,
    heroImageFileExtension: example.heroImageFileExtension,
    createdAt: example.createdAt,
    organisationId: example.organisationId ?? null,
    organisationPrimaryColour: example.organisationPrimaryColour ?? null,
    organisationLogoFileExtension:
      example.organisationLogoFileExtension ?? null,
    organisationShowLogoOnColour: example.organisationShowLogoOnColour ?? null,
    partner: {
      name: example.partnerName || "Voxd",
      domain: example.partnerDomain,
    },
    exampleConversations: parsedConversations,
  };
};

export default getExampleForPublic;
