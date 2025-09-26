import ExampleCard from "./exampleCard";
import db from "@/database/db";
import {
  getExamples,
  getExamplesByIndustryOrFunction,
} from "@/lib/getExamples";
import Container from "@/components/websiteui/container";
import ExampleFilters from "./exampleFilters";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import { Example } from "@/types/types";
import ExampleResults from "./results";
import { Suspense } from "react";

export default async function ExamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry: string; function: string }>;
}) {
  const params = await searchParams;

  const industries = await getIndustries();
  const functions = await getFunctions();

  return (
    <Container>
      <div className="flex flex-col gap-8">
        <ExampleFilters
          industries={industries}
          functions={functions}
          selectedIndustry={params.industry || ""}
          selectedFunction={params.function || ""}
        />

        <Suspense fallback={<div>Loading...</div>}>
          <ExampleResults
            industrySlug={params.industry}
            functionSlug={params.function}
          />
        </Suspense>
      </div>
    </Container>
  );
}
