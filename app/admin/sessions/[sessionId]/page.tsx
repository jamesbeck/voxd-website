import getMessages from "@/lib/getMessagesBySession";
import Link from "next/link";
import getAgentById from "@/lib/getAgentById";
import getUserById from "@/lib/getUserById";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import getSessionById from "@/lib/getSessionById";
import DeleteSessionButton from "./deleteSessionButton";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const awaitedParams = await params;

  const sessionId = awaitedParams.sessionId;

  const session = await getSessionById({ sessionId: sessionId });
  const user = await getUserById({ userId: session.userId });
  const agent = await getAgentById({ agentId: session.agentId });

  const messages = await getMessages({ sessionId: sessionId });

  //get most recent assistant message
  const mostRecentAssistantMessage = messages.find(
    (message: any) => message.role == "assistant"
  );

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/agents">Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/agents/${agent.id}`}>
              {agent.niceName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold mb-4">
        {user.name} <span className="text-xs">({user.number})</span> talking to{" "}
        {agent.niceName}
      </h1>

      <div className="flex justify-end my-4 cursor-pointer">
        <DeleteSessionButton sessionId={sessionId} agentId={agent.id} />
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
                className={`p-4 border-b max-w-[80%] ${
                  message.role == "assistant"
                    ? "bg-gray-200 "
                    : "bg-primary text-white"
                } rounded-lg flex flex-col gap-4`}
              >
                <div className="text-xs">
                  {format(message.createdAt, "dd/MM/yyyy HH:mm")}
                </div>

                {/* <div className="flex flex-col gap-2">{message.text}</div> */}

                <div className="flex flex-col gap-2">
                  {textSplitOnLineBreaks.map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>

                <code>{JSON.stringify(message?.outputUserData)}</code>

                <div className="text-xs">
                  ID: {message.id} ({message.responseStatus})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
