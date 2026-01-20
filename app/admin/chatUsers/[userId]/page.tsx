import getUserById from "@/lib/getChatUserById";
import H1 from "@/components/adminui/H1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SessionsTable from "./sessionsTable";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { ChatUser } from "@/types/types";
import NewUserForm from "./newUserForm";
import { notFound } from "next/navigation";
import UserActions from "./UserActions";
import EditUserForm from "./editUserForm";
import H2 from "@/components/adminui/H2";
import getAgents from "@/lib/getAgents";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import SendTemplateTab from "./sendTemplateTab";

export default async function Page({ params }: { params: { userId: string } }) {
  const token = await verifyAccessToken();

  const userId = (await params).userId;

  let user: ChatUser | null = null;

  if (userId && userId != "new") user = await getUserById({ userId: userId });

  if (!user && userId !== "new") return notFound();

  //get all agents for the edit form
  const agents = await getAgents();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/chatUsers" },
          { label: user?.name || "New User" },
        ]}
      />
      <H1>{user?.name || "New User"}</H1>
      {user && (
        <>
          <Tabs defaultValue="sessions" className="space-y-2">
            <div className="flex items-center justify-between gap-4 mb-2">
              <TabsList>
                <TabsTrigger value="edit">Edit User</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="send-template">Send Template</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <UserActions user={user} />
            </div>

            <div className="border-b mb-6" />

            <TabsContent value="edit">
              <EditUserForm
                userId={userId}
                name={user.name}
                number={user.number}
                testingAgentId={user.testingAgentId}
                agentOptions={agents.map((agent) => ({
                  value: agent.id,
                  label: agent.niceName,
                }))}
              />
            </TabsContent>
            <TabsContent value="sessions">
              <H2>Sessions</H2>
              <SessionsTable userId={userId} superAdmin={!!token.superAdmin} />
            </TabsContent>
            <TabsContent value="send-template">
              <H2>Send Template</H2>
              <p className="text-muted-foreground mb-4">
                Send a WhatsApp template message to this user.
              </p>
              <SendTemplateTab userId={userId} />
            </TabsContent>
            <TabsContent value="data">
              <H2>User Data</H2>
              {user.data ? (
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(user.data, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">
                  No data stored for this user.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      {!user && (
        <NewUserForm
          agentOptions={agents.map((agent) => ({
            value: agent.id,
            label: agent.niceName,
          }))}
        />
      )}
    </Container>
  );
}
