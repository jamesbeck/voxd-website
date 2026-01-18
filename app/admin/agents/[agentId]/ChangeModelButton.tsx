"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import saUpdateAgentModel from "@/actions/saUpdateAgentModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ChangeModelButtonProps {
  agentId: string;
  modelId: string;
  modelName: string;
}

export default function ChangeModelButton({
  agentId,
  modelId,
  modelName,
}: ChangeModelButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await saUpdateAgentModel({ agentId, modelId });

      if (result.success) {
        toast.success("Model updated successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update model");
      }
    } catch (error) {
      toast.error("An error occurred while updating the model");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        Use Model
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Change Agent Model
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2">
                <div>
                  You are about to change this agent's model to{" "}
                  <span className="font-semibold">{modelName}</span>.
                </div>
                <div className="text-sm">
                  <strong>Please note:</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>This will impact the agent's operational costs</li>
                  <li>The agent's behavior and responses may change</li>
                  <li>
                    Different models have different capabilities and limitations
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Updating..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
