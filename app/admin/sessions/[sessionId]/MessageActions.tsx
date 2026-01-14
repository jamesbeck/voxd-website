"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReportMessageDialog from "./ReportMessageDialog";

type MessageActionsProps = {
  messageId: string;
  messageType: "user" | "assistant" | "manual";
  agentId: string;
  variant?: "ghost" | "secondary" | "outline";
  className?: string;
};

export default function MessageActions({
  messageId,
  messageType,
  agentId,
  variant = "outline",
  className = "",
}: MessageActionsProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Only user and assistant messages can be reported
  const canReport = messageType === "user" || messageType === "assistant";

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          asChild
          size="sm"
          variant={variant}
          className="h-6 text-[11px] px-2"
        >
          <Link href={`/admin/messages/${messageId}?type=${messageType}`}>
            View
          </Link>
        </Button>

        {canReport && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={variant}
                  className="h-6 text-[11px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <Flag className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Report Issue</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {canReport && (
        <ReportMessageDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          agentId={agentId}
          messageId={messageId}
          messageType={messageType as "user" | "assistant"}
        />
      )}
    </>
  );
}
