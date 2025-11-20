"use client";

// import saDeleteAgent from "@/actions/saDeleteAgent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteSession from "@/actions/saDeleteSession";
import saPauseSession from "@/actions/saPauseSession";
import saResumeSession from "@/actions/saResumeSession";

export default function SessionActions({
  sessionId,
  agentId,
  name,
  paused,
}: {
  sessionId: string;
  agentId: string;
  name: string;
  paused: boolean;
}) {
  const [isDeletingSession, setIsDeleteingSession] = useState(false);
  const [isPausingSession, setIsPausingSession] = useState(false);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const router = useRouter();

  const deleteSession = async () => {
    setIsDeleteingSession(true);
    const saResponse = await saDeleteSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Session: ${
          saResponse.error || "There was an error deleting the session"
        }`
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
        }`
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
        }`
      );
      setIsPausingSession(false);
      return;
    }
    // If successful
    toast.success(`Successfully resumed ${name}`);
    setIsPausingSession(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Alert
        destructive
        title={`Delete ${name}`}
        description="This action cannot be undone."
        actionText="Delete"
        onAction={deleteSession}
      >
        <Button className="cursor-pointer" variant="destructive" size="sm">
          {isDeletingSession ? <Spinner /> : null}
          Delete Session
        </Button>
      </Alert>

      {!paused && (
        <Alert
          destructive
          title={`Pause ${name}`}
          description="Are you sure you want to pause this chat session? Whilst paused the AI agent will not reply to the user."
          actionText="Pause"
          onAction={pauseSession}
        >
          <Button className="cursor-pointer" size="sm">
            {isDeletingSession ? <Spinner /> : null}
            Pause Session
          </Button>
        </Alert>
      )}

      {paused && (
        <Alert
          destructive
          title={`Resume ${name}`}
          description="Are you sure you want to resume this chat session? The AI agent will start replying to the user again."
          actionText="Resume"
          onAction={resumeSession}
        >
          <Button className="cursor-pointer" size="sm">
            {isDeletingSession ? <Spinner /> : null}
            Resume Session
          </Button>
        </Alert>
      )}
    </div>
  );
}
