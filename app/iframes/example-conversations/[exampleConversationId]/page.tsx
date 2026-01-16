import saGetExampleConversationById from "@/actions/saGetExampleConversationById";
import WhatsAppSim from "@/components/whatsAppSim";
import { notFound } from "next/navigation";

export default async function ExampleConversationIframePage({
  params,
}: {
  params: { exampleConversationId: string };
}) {
  const { exampleConversationId } = await params;

  const response = await saGetExampleConversationById({
    conversationId: exampleConversationId,
  });

  if (!response.success || !response.data) {
    notFound();
  }

  const conversation = response.data;

  // Determine business name and logo info
  const businessName =
    conversation.businessName || conversation.organizationName || "Business";
  const exampleId = conversation.exampleId || undefined;
  const logoFileExtension = conversation.logoFileExtension || undefined;
  const organizationId = conversation.organizationId || undefined;
  const organizationLogoFileExtension =
    conversation.organizationLogoFileExtension || undefined;
  const organizationLogoDarkBackground =
    conversation.organizationLogoDarkBackground || false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <WhatsAppSim
        messages={conversation.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          time: m.time,
          annotation: m.annotation || "",
        }))}
        businessName={businessName}
        startTime={conversation.startTime}
        exampleId={exampleId}
        logoFileExtension={logoFileExtension}
        organizationId={organizationId}
        organizationLogoFileExtension={organizationLogoFileExtension}
        organizationLogoDarkBackground={organizationLogoDarkBackground}
      />
    </div>
  );
}
