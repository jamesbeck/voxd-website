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
  partner: {
    name: string;
    colour: string | null;
    domain: string | null;
    logoFileExtension: string | null;
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
  let query = db("example").leftJoin(
    "partner",
    "example.partnerId",
    "partner.id"
  );

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
      "partner.name as partnerName",
      "partner.colour as partnerColour",
      "partner.domain as partnerDomain",
      "partner.logoFileExtension as partnerLogoFileExtension"
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
      }) => ({
        role: m.role,
        content: m.content,
        time: m.time,
        annotation: m.annotation || null,
      })
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
    partner: {
      name: example.partnerName || "Voxd",
      colour: example.partnerColour,
      domain: example.partnerDomain,
      logoFileExtension: example.partnerLogoFileExtension,
    },
    exampleConversations: parsedConversations,
  };
};

export default getExampleForPublic;
