import H1 from "@/components/adminui/H1";
import GenerateExampleChatForm from "./generateExampleChatForm";
import { getExampleById } from "@/lib/getExamples";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const accessToken = await verifyAccessToken();

  const example = await getExampleById(id);

  if (!example) return notFound();

  // Partners can only access their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (example.partnerId !== accessToken.partnerId) {
      return notFound();
    }
  }

  return (
    <div>
      <H1>Example Chat Generator - {example.title}</H1>
      <GenerateExampleChatForm exampleId={id} />
    </div>
  );
}
