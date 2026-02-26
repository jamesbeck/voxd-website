"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteSession from "@/actions/saDeleteSession";
import saPauseSession from "@/actions/saPauseSession";
import saResumeSession from "@/actions/saResumeSession";
import saEndSession from "@/actions/saEndSession";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CopyIcon,
  FlagIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { format } from "date-fns";
import ReportSessionDialog from "./ReportSessionDialog";
import SessionTicketBadge from "./SessionTicketBadge";

type Ticket = {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  createdByName: string | null;
  createdAt: Date;
};

export default function SessionActions({
  sessionId,
  agentId,
  name,
  paused,
  closed,
  tickets = [],
  messages = [],
}: {
  sessionId: string;
  agentId: string;
  name: string;
  paused: boolean;
  closed: boolean;
  tickets?: Ticket[];
  messages?: any[];
}) {
  const [isDeletingSession, setIsDeleteingSession] = useState(false);
  const [isPausingSession, setIsPausingSession] = useState(false);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const router = useRouter();

  const deleteSession = async () => {
    setIsDeleteingSession(true);
    const saResponse = await saDeleteSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Session: ${
          saResponse.error || "There was an error deleting the session"
        }`,
      );
      setIsDeleteingSession(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    setIsDeleteingSession(false);
    router.push(`/admin/agents/${agentId}?tab=sessions`);
  };

  const pauseSession = async () => {
    setIsPausingSession(true);
    const saResponse = await saPauseSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Pausing Session: ${
          saResponse.error || "There was an error pausing the session"
        }`,
      );
      setIsPausingSession(false);
      return;
    }
    // If successful
    toast.success(`Successfully paused ${name}`);
    setIsPausingSession(false);
    router.refresh();
  };

  const resumeSession = async () => {
    setIsPausingSession(true);
    const saResponse = await saResumeSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Resuming Session: ${
          saResponse.error || "There was an error resuming the session"
        }`,
      );
      setIsPausingSession(false);
      return;
    }
    // If successful
    toast.success(`Successfully resumed ${name}`);
    setIsPausingSession(false);
    router.refresh();
  };

  const copyConversation = async () => {
    const lines = messages.map((message: any) => {
      let label = "User";
      if (message.role === "assistant") label = "Assistant";
      if (message.role === "manual") {
        label = message.apiKeyName
          ? `Manual (API: ${message.apiKeyName})`
          : message.userName
            ? `Manual (${message.userName})`
            : "Manual";
      }

      const time = format(message.createdAt, "dd/MM/yyyy HH:mm");
      return `${label} (${time}):\n${message.text || ""}`;
    });

    await navigator.clipboard.writeText(lines.join("\n\n"));
    toast.success("Conversation copied to clipboard");
  };

  const endSession = async () => {
    setIsEndingSession(true);
    const saResponse = await saEndSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Ending Session: ${
          saResponse.error || "There was an error ending the session"
        }`,
      );
      setIsEndingSession(false);
      return;
    }
    // If successful
    toast.success(`Successfully ended ${name}`);
    setIsEndingSession(false);
    router.refresh();
  };

  return (
    <>
      <ReportSessionDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        agentId={agentId}
        sessionId={sessionId}
      />

      <div className="flex items-center gap-2">
        <ButtonGroup>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <FlagIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Report issue for this session</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {tickets.length > 0 && (
            <SessionTicketBadge tickets={tickets} variant="button" />
          )}
        </ButtonGroup>

        <ButtonGroup>
          {!paused && !closed && (
            <Alert
              destructive
              title={`Pause ${name}`}
              description="Are you sure you want to pause this chat session? Whilst paused the AI agent will not reply to the user."
              actionText="Pause"
              onAction={pauseSession}
            >
              <Button className="cursor-pointer" variant="outline" size="sm">
                {isPausingSession ? (
                  <Spinner />
                ) : (
                  <PauseIcon className="h-4 w-4" />
                )}
                Pause
              </Button>
            </Alert>
          )}

          {paused && !closed && (
            <Alert
              destructive
              title={`Resume ${name}`}
              description="Are you sure you want to resume this chat session? The AI agent will start replying to the user again."
              actionText="Resume"
              onAction={resumeSession}
            >
              <Button className="cursor-pointer" variant="outline" size="sm">
                {isResumingSession ? (
                  <Spinner />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                Resume
              </Button>
            </Alert>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More Options"
                className="h-8 w-8"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={copyConversation}>
                        <CopyIcon className="h-4 w-4" />
                        Copy Conversation
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Copy entire conversation to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {!closed && (
                  <Alert
                    destructive
                    title={`End ${name}`}
                    description="Are you sure you want to end this session? The session will be marked as closed and any further messages from the user will start a brand new session."
                    actionText="End Session"
                    onAction={endSession}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {isEndingSession ? (
                        <Spinner />
                      ) : (
                        <XCircleIcon className="h-4 w-4" />
                      )}
                      End Session
                    </DropdownMenuItem>
                  </Alert>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Alert
                  destructive
                  title={`Delete ${name}`}
                  description="This action cannot be undone. All messages and data associated with this session will be permanently deleted."
                  actionText="Delete"
                  onAction={deleteSession}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    {isDeletingSession ? (
                      <Spinner />
                    ) : (
                      <Trash2Icon className="h-4 w-4" />
                    )}
                    Delete Session
                  </DropdownMenuItem>
                </Alert>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>
    </>
  );
}
