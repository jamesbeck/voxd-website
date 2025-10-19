import H1 from "@/components/adminui/H1";
import ExamplesTable from "./examplesTable";
import Container from "@/components/adminui/container";

export default async function Page() {
  return (
    <Container>
      <H1>Manage Examples</H1>

      <ExamplesTable />
    </Container>
  );
}
