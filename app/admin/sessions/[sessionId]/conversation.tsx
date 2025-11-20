import { Spinner } from "@/components/ui/spinner";
import {
  differenceInMilliseconds,
  differenceInSeconds,
  format,
  formatDistance,
  addSeconds,
} from "date-fns";
import SendMessageForm from "./sendMessageForm";

export default function Conversation({
  messages,
  sessionId,
}: {
  messages: any[];
  sessionId: string;
}) {
  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="flex flex-col gap-4">
        {messages.map((message: any) => {
          //split text on line breaks
          const textSplitOnLineBreaks = message.text.split("\n");

          return (
            <div
              className={`flex ${message.role != "user" ? "justify-end" : ""}`}
              key={message.id}
            >
              <div
                className={`p-3 border-b max-w-[80%] ${
                  message.role != "user"
                    ? "bg-gray-200 "
                    : "bg-primary text-white"
                } rounded-lg flex flex-col gap-2`}
              >
                <div className="text-xs">
                  {format(message.createdAt, "dd/MM/yyyy HH:mm")}
                  {message.role != "user" &&
                    message.role === "manual" &&
                    ` - ${message.userName}`}
                  {message.role != "user" &&
                    message.role === "assistant" &&
                    ` - AI (${message.model})`}
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
              </div>
            </div>
          );
        })}
      </div>
      {(lastMessage.responseStatus == "waiting" ||
        lastMessage.responseStatus == "processing") && (
        <div>
          Generating... <Spinner />
        </div>
      )}

      <div>
        <SendMessageForm sessionId={sessionId} />
      </div>
    </>
  );
}
