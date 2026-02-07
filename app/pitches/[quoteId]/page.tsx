import { redirect } from "next/navigation";

// Legacy redirect: /pitches/[quoteId] -> /concepts/[quoteId]
export default async function PitchRedirectPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  redirect(`/concepts/${quoteId}`);
}
