import Link from "next/link";
import H1 from "@/components/adminui/h1";
import AgentsTable from "./agentsTable";
import getAgents from "@/lib/getAgents";

export default async function Page() {
  const agents = await getAgents();
  return (
    <div>
      <H1>Manage Agents</H1>

      <AgentsTable agents={agents} />
    </div>
  );
}
