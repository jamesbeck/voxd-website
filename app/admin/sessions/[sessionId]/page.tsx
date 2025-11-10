import getMessages from "@/lib/getMessagesBySession";
import getAgentById from "@/lib/getAgentById";
import getUserById from "@/lib/getUserById";
import { format } from "date-fns";
import getSessionById from "@/lib/getSessionById";
import DeleteSessionButton from "./deleteSessionButton";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const accessToken = await verifyAccessToken();

  const awaitedParams = await params;

  const sessionId = awaitedParams.sessionId;

  const session = await getSessionById({ sessionId: sessionId });
  const user = await getUserById({ userId: session.userId });
  const agent = await getAgentById({ agentId: session.agentId });

  const messages = await getMessages({ sessionId: sessionId });

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Agents", href: "/admin/agents" },
          { label: agent.niceName, href: `/admin/agents/${agent.id}` },
          { label: session.id },
        ]}
      />

      <H1 className="text-2xl font-semibold mb-4">
        {user.name} ({user.number}) & {agent.niceName}
      </H1>

      <div className="flex justify-end my-4 cursor-pointer">
        {!!accessToken?.admin && (
          <DeleteSessionButton sessionId={sessionId} agentId={agent.id} />
        )}
      </div>

      <div className="flex flex-col gap-4">
        {messages.map((message: any) => {
          //split text on line breaks
          const textSplitOnLineBreaks = message.text.split("\n");

          return (
            <div
              className={`flex ${
                message.role == "assistant" ? "justify-end" : ""
              }`}
              key={message.id}
            >
              <div
                className={`p-3 border-b max-w-[80%] ${
                  message.role == "assistant"
                    ? "bg-gray-200 "
                    : "bg-primary text-white"
                } rounded-lg flex flex-col gap-2`}
              >
                <div className="text-xs">
                  {format(message.createdAt, "dd/MM/yyyy HH:mm")}
                </div>

                {/* <div className="flex flex-col gap-2">{message.text}</div> */}

                <div className="flex flex-col gap-2 text-sm">
                  {textSplitOnLineBreaks.map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>

                {/* <code>{JSON.stringify(message?.outputUserData)}</code> */}

                {/* <div className="text-xs">ID: {message.id}</div> */}
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
