import H1 from "@/components/adminui/h1";
import ExamplesTable from "./examplesTable";
import { getExamples } from "@/lib/getExamples";

export default async function Page() {
  const examples = await getExamples();
  return (
    <div>
      <H1>Manage Examples</H1>

      <ExamplesTable examples={examples} />
    </div>
  );
}
