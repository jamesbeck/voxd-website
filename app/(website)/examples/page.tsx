import ExampleCard from "./exampleCard";
import db from "@/database/db";
import { getExamples } from "@/lib/getExamples";
import Container from "@/components/websiteui/container";

export default async function ExamplesPage() {
  const examples = await getExamples();

  return (
    <Container>
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
    </Container>
  );
}
