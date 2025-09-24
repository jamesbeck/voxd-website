import Link from "next/link";
import H1 from "@/components/adminui/h1";
import GenerateExampleForm from "./generateExampleForm";

export default async function Page() {
  return (
    <div>
      <H1>Example Generator</H1>
      <GenerateExampleForm />
    </div>
  );
}
