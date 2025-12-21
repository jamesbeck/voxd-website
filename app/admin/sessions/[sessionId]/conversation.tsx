import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  differenceInMilliseconds,
  differenceInSeconds,
  format,
  formatDistance,
  addSeconds,
} from "date-fns";
import SendMessageForm from "./sendMessageForm";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bot, Clock, Coins, Wrench } from "lucide-react";

export default function Conversation({
  messages,
  sessionId,
}: {
  messages: any[];
  sessionId: string;
}) {
  const lastMessageFromUser = messages
    .slice()
    .reverse()
    .find((message) => message.role === "user");

  const lastMessageFromUserSecondsAgo = lastMessageFromUser
    ? differenceInSeconds(new Date(), lastMessageFromUser.createdAt)
    : null;

  return (
    <>
      <div className="h-[600px] rounded-xl border bg-muted/30 shadow-sm overflow-y-auto p-4 space-y-3">
        {messages.map((message: any, index: number) => {
          //split text on line breaks
          const textSplitOnLineBreaks = message.text.split("\n");

          // Calculate time since previous message
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const timeSincePreviousMessage = previousMessage
            ? differenceInMilliseconds(
                message.createdAt,
                previousMessage.createdAt
              )
            : null;

          return (
            <div
              className={`flex ${message.role != "user" ? "justify-end" : ""}`}
              key={message.id}
            >
              <div
                className={`max-w-[80%] ${
                  message.role != "user"
                    ? "bg-white dark:bg-zinc-800 rounded-2xl rounded-tr-sm"
                    : "bg-primary text-primary-foreground rounded-2xl rounded-tl-sm"
                } shadow-sm`}
              >
                <div className="px-4 py-2">
                  <div className="text-[11px] opacity-60 mb-1">
                    {format(message.createdAt, "dd/MM/yyyy HH:mm")}
                    {message.role != "user" &&
                      message.role === "manual" &&
                      ` • ${message.userName}`}
                  </div>

                  <div className="text-sm whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>

                {message.role === "assistant" && (
                  <div className="px-4 py-2 border-t border-border/30 flex items-center gap-3">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">Model</p>
                          <p className="text-xs text-muted-foreground">
                            {message.model}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                            <Coins className="h-3.5 w-3.5" />
                            <span className="text-[11px]">
                              {message?.promptTokens +
                                message?.completionTokens}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">Token Usage</p>
                          <p className="text-xs text-muted-foreground">
                            Input: {message?.promptTokens} tokens
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Output: {message?.completionTokens} tokens
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-[11px]">
                              {(
                                differenceInMilliseconds(
                                  message.responseReceivedAt,
                                  message.responseRequestedAt
                                ) / 1000
                              ).toFixed(2)}
                              s
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">Response Time</p>
                          <p className="text-xs text-muted-foreground">
                            Total time to generate response
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {message.toolCalls.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                              <Wrench className="h-3.5 w-3.5" />
                              <span className="text-[11px]">
                                {message.toolCalls.length}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="font-medium">Tools Used</p>
                            {message.toolCalls.map(
                              (toolCall: any, idx: number) => (
                                <p
                                  key={idx}
                                  className="text-xs text-muted-foreground"
                                >
                                  {toolCall.toolName} (
                                  {(
                                    differenceInMilliseconds(
                                      toolCall.finishedAt,
                                      toolCall.startedAt
                                    ) / 1000
                                  ).toFixed(2)}
                                  s)
                                </p>
                              )
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>

                    <div className="ml-auto">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2"
                      >
                        <Link
                          href={`/admin/messages/${message.id}?type=${message.role}`}
                        >
                          View Info
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {message.role === "user" && (
                  <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3">
                    <TooltipProvider delayDuration={0}>
                      {timeSincePreviousMessage !== null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-default">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-[11px]">
                                {timeSincePreviousMessage < 60000
                                  ? `${(
                                      timeSincePreviousMessage / 1000
                                    ).toFixed(0)}s`
                                  : timeSincePreviousMessage < 3600000
                                  ? `${Math.floor(
                                      timeSincePreviousMessage / 60000
                                    )}m`
                                  : `${Math.floor(
                                      timeSincePreviousMessage / 3600000
                                    )}h`}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="font-medium">Response Time</p>
                            <p className="text-xs text-muted-foreground">
                              Time since previous message
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>

                    <div className="ml-auto">
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="h-6 text-[11px] px-2"
                      >
                        <Link
                          href={`/admin/messages/${message.id}?type=${message.role}`}
                        >
                          View Info
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(lastMessageFromUser?.responseStatus == "waiting" ||
          lastMessageFromUser?.responseStatus == "processing") && (
          <div className="flex justify-end">
            <div className="bg-card border shadow-sm rounded-xl p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Generating response...
            </div>
          </div>
        )}
      </div>

      <SendMessageForm
        sessionId={sessionId}
        lastMessageFromUserSecondsAgo={lastMessageFromUserSecondsAgo}
      />
    </>
  );
}
