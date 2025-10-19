import H1 from "@/components/adminui/H1";
import FunctionsTable from "./functionsTable";
import NewFunctionForm from "./newFunctionForm";
import Container from "@/components/adminui/Container";

export default async function Page() {
  return (
    <Container>
      <H1>Manage Functions</H1>

      <NewFunctionForm />

      <FunctionsTable />
    </Container>
  );
}
