import H1 from "@/components/adminui/h1";
import FunctionsTable from "./functionsTable";
import getFunctions from "@/lib/getFunctions";
import NewFunctionForm from "./newFunctionForm";

export default async function Page() {
  const functions = await getFunctions();

  return (
    <div>
      <H1>Manage Functions</H1>

      <NewFunctionForm />

      <FunctionsTable functions={functions} />
    </div>
  );
}
