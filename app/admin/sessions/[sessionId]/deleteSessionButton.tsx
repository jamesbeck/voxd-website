"use client";

import { Button } from "@/components/ui/button";
import deleteSession from "@/lib/deleteSession";
import { useRouter } from "next/navigation";

const DeleteSessionButton = ({
  sessionId,
  agentId,
}: {
  sessionId: string;
  agentId: string;
}) => {
  const router = useRouter();

  return (
    <Button
      variant="destructive"
      onClick={async () => {
        await deleteSession({ sessionId });
        router.push(`/admin/agents/${agentId}`);
      }}
    >
      Delete Session
    </Button>
  );
};

export default DeleteSessionButton;
