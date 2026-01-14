"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import saUpdateSupportTicketStatus from "@/actions/saUpdateSupportTicketStatus";

const STATUSES = [
  { value: "Open", label: "Open", color: "bg-red-500" },
  { value: "In Progress", label: "In Progress", color: "bg-orange-500" },
  { value: "Closed", label: "Closed", color: "bg-green-500" },
];

export default function TicketStatusDropdown({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setLoading(true);
    const result = await saUpdateSupportTicketStatus({
      ticketId,
      status: newStatus,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Failed to update status");
      return;
    }

    setStatus(newStatus);
    toast.success(`Status changed to ${newStatus}`);
    router.refresh();
  };

  const currentStatusConfig =
    STATUSES.find((s) => s.value === status) || STATUSES[0];

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[160px]">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${currentStatusConfig.color}`}
          />
          {currentStatusConfig.label}
        </div>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
