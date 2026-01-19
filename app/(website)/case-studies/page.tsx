import { getExamples } from "@/lib/getExamples";
import getIndustries from "@/lib/getIndustries";
import getFunctions from "@/lib/getFunctions";
import CaseStudiesClient from "./CaseStudiesClient";

export default async function CaseStudiesPage() {
  const partnerId = "019a6ec7-43b1-7da4-a2d8-8c84acb387b4";
  const allExamples = await getExamples();
  const examples = allExamples.filter((ex) => ex.partnerId === partnerId);
  const industries = await getIndustries(partnerId);
  const functions = await getFunctions(partnerId);

  return (
    <CaseStudiesClient
      examples={examples}
      industries={industries}
      functions={functions}
    />
  );
}
