import { notFound } from "next/navigation";
import saGetAgentDemoData from "@/actions/saGetAgentDemoData";
import DemoWebsite from "@/components/DemoWebsite";
import ChatEmbed from "@/components/ChatEmbed";

export default async function WebChatPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = (await params).agentId;
  const data = await saGetAgentDemoData({ agentId });

  if (!data) return notFound();

  const coreDomain = data.coreDomain?.trim() || "core.voxd.ai";
  const coreBaseUrl = `https://${coreDomain}`;

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
