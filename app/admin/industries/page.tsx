import Link from "next/link";
import H1 from "@/components/adminui/h1";
import IndustriesTable from "./industriesTable";
import getIndustries from "@/lib/getIndustries";
import NewIndustryForm from "./newIndustryForm";

export default async function Page() {
  const industries = await getIndustries();

  return (
    <div>
      <H1>Manage Industries</H1>

      <NewIndustryForm />

      <IndustriesTable industries={industries} />
    </div>
  );
}
