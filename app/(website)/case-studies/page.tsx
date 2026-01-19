import { getExamples } from "@/lib/getExamples";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import CaseStudiesClient from "./CaseStudiesClient";

export default async function CaseStudiesPage() {
  const examples = await getExamples();
  const industries = await getIndustries();
  const functions = await getFunctions();

  return (
    <CaseStudiesClient
      examples={examples}
      industries={industries}
      functions={functions}
    />
  );
}
