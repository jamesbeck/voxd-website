import ExampleCard from "./exampleCard";
import {
  getExamples,
  getExamplesByIndustryOrFunction,
} from "@/lib/getExamples";
import { Example } from "@/types/types";

export default async function ExampleResults({
  industrySlug,
  functionSlug,
}: {
  industrySlug: string;
  functionSlug: string;
}) {
  let examples: Example[] = [];

  if (industrySlug || functionSlug) {
    examples = await getExamplesByIndustryOrFunction({
      industrySlug,
      functionSlug,
    });
  } else {
    examples = await getExamples();
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
      {examples.map((example) => (
        <ExampleCard
          key={example.id}
          id={example.id}
          title={example.title}
          industries={example.industries}
          functions={example.functions}
          short={example.short}
          slug={example.slug}
        />
      ))}
    </div>
  );
}
