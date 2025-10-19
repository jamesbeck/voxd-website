import getUserById from "@/lib/getUserById";
import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SessionsTable from "./sessionsTable";
import Container from "@/components/adminui/container";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import { User } from "@/types/types";
import NewUserForm from "./newUserForm";
import { notFound } from "next/navigation";
import UserActions from "./UserActions";
import EditUserForm from "./editUserForm";
import H2 from "@/components/adminui/H2";
import getAgents from "@/lib/getAgents";

export default async function Page({ params }: { params: { userId: string } }) {
  const userId = (await params).userId;

  let user: User | null = null;

  if (userId && userId != "new") user = await getUserById({ userId: userId });

  if (!user && userId !== "new") return notFound();

  //get all agents for the edit form
  const agents = await getAgents();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user?.name || "New User" },
        ]}
      />
      <H1>{user?.name || "New User"}</H1>
      {user && (
        <>
          <UserActions user={user} />
          <Tabs defaultValue="sessions" className="space-y-2">
            <TabsList>
              <TabsTrigger value="edit">Edit User</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <EditUserForm
                userId={userId}
                name={user.name}
                email={user.email}
                number={user.number}
                testingAgentId={user.testingAgentId}
                customerIds={user.customerIds}
                agentOptions={agents.map((agent) => ({
                  value: agent.id,
                  label: agent.niceName,
                }))}
              />
            </TabsContent>
            <TabsContent value="sessions">
              <H2>Sessions</H2>
              <SessionsTable userId={userId} />
            </TabsContent>
          </Tabs>
        </>
      )}
      {!user && <NewUserForm />}
    </Container>
  );
}
