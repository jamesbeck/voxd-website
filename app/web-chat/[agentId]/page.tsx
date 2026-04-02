import { notFound } from "next/navigation";
import type { Metadata } from "next";
import saGetAgentDemoData from "@/actions/saGetAgentDemoData";
import DemoWebsite from "@/components/DemoWebsite";
import ChatEmbed from "@/components/ChatEmbed";

export async function generateMetadata({
  params,
}: {
  params: { agentId: string };
}): Promise<Metadata> {
  const agentId = (await params).agentId;
  const data = await saGetAgentDemoData({ agentId });

  if (!data) return { title: "Agent Not Found" };

  return {
    title: `${data.agentNiceName} – Web Chat Testing`,
    description: `Web chat testing for ${data.agentNiceName}.`,
  };
}

export default async function WebChatPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = (await params).agentId;
  const data = await saGetAgentDemoData({ agentId });

  if (!data) return notFound();

  const coreDomain = data.coreDomain?.trim() || "core.voxd.ai";
  const coreBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `https://${coreDomain}`;

  const primaryColour = data.primaryColour || "#6366f1";
  const logoBgColour = data.showLogoOnColour || "#ffffff";
  const orgName = data.organisationName;

  const logoUrl = data.logoFileExtension
    ? `https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${data.organisationId}.${data.logoFileExtension}`
    : null;

  return (
    <DemoWebsite
      orgName={orgName}
      logoUrl={logoUrl}
      logoBgColour={logoBgColour}
      primaryColour={primaryColour}
    >
      <ChatEmbed
        agentId={data.agentId}
        coreBaseUrl={coreBaseUrl}
        primaryColour={primaryColour}
      />
    </DemoWebsite>
  );
}
