import getMessages from "@/lib/getMessagesBySession";
import getAgentById from "@/lib/getAgentById";
import getUserById from "@/lib/getUserById";
import { differenceInMilliseconds, format } from "date-fns";
import getSessionById from "@/lib/getSessionById";
import DeleteSessionButton from "./deleteSessionButton";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { sessionId: string };
}) {
  const accessToken = await verifyAccessToken();

  const awaitedParams = await params;

  const sessionId = awaitedParams.sessionId;

  const session = await getSessionById({ sessionId: sessionId });

  if (!session) notFound();

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

      <Card>
        <CardContent>
          <table>
            <tbody>
              <tr>
                <td className="font-bold pr-4">Conversation Start Date:</td>
                <td>{format(session.createdAt, "dd/MM/yyyy HH:mm:ss")}</td>
              </tr>
              <tr>
                <td className="font-bold pr-4">Last Message Date:</td>
                <td>
                  {session.lastUserMessageDate
                    ? format(session.lastUserMessageDate, "dd/MM/yyyy HH:mm:ss")
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td className="font-bold pr-4">Approx. Prompt Cost:</td>
                <td>
                  ${session.totalPromptCost.toFixed(4)} (
                  {session.totalPromptTokens} tokens)
                </td>
              </tr>
              <tr>
                <td className="font-bold pr-4">Approx. Response Cost:</td>
                <td>
                  ${session.totalCompletionCost.toFixed(4)} (
                  {session.totalCompletionTokens} tokens)
                </td>
              </tr>
              <tr>
                <td className="font-bold pr-4">Approx. Total Cost</td>
                <td>
                  $
                  {(
                    session.totalPromptCost + session.totalCompletionCost
                  ).toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

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

                {message.role === "assistant" && (
                  <code className="text-xs">
                    <b>Tokens</b>: In {message?.promptTokens} + Out{" "}
                    {message?.completionTokens} ={" "}
                    {message?.promptTokens + message?.completionTokens}
                    <br />
                    <b>Total Response Time:</b>{" "}
                    {(
                      differenceInMilliseconds(
                        message.responseReceivedAt,
                        message.responseRequestedAt
                      ) / 1000
                    ).toFixed(2)}
                    s
                    <br />
                    <b>Tools:</b>{" "}
                    {message.toolCalls.length > 0
                      ? message.toolCalls
                          .map(
                            (toolCall: any) =>
                              `${toolCall.toolName} (${(
                                differenceInMilliseconds(
                                  toolCall.finishedAt,
                                  toolCall.startedAt
                                ) / 1000
                              ).toFixed(2)}s)`
                          )
                          .join(", ")
                      : "None"}
                  </code>
                )}

                {/* <div className="text-xs">ID: {message.id}</div> */}
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
