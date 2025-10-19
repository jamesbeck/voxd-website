import H1 from "@/components/adminui/H1";
import GenerateExampleChatForm from "./generateExampleChatForm";
import { getExampleById } from "@/lib/getExamples";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const example = await getExampleById(id);

  return (
    <div>
      <H1>Example Chat Generator - {example.title}</H1>
      <GenerateExampleChatForm exampleId={id} />
    </div>
  );
}
