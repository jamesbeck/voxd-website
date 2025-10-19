import H1 from "@/components/adminui/H1";
import IndustriesTable from "./industriesTable";
import NewIndustryForm from "./newIndustryForm";
import Container from "@/components/adminui/container";

export default async function Page() {
  return (
    <Container>
      <H1>Manage Industries</H1>

      <NewIndustryForm />

      <IndustriesTable />
    </Container>
  );
}
