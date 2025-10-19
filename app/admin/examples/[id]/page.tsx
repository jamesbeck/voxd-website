import EditExampleForm from "./editExampleForm";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import { getExampleById } from "@/lib/getExamples";

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const example = await getExampleById(id);

  const industries = await getIndustries();
  const functions = await getFunctions();

  return (
    <div>
      <EditExampleForm
        id={example.id}
        title={example.title}
        short={example.short}
        body={example.body}
        industries={example.industries.map((industry) => industry.id)}
        industriesOptions={industries.map((industry) => ({
          label: industry.name,
          value: industry.id,
        }))}
        functions={example.functions.map((func) => func.id)}
        functionsOptions={functions.map((func) => ({
          label: func.name,
          value: func.id,
        }))}
      />
    </div>
  );
}
