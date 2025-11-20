"use client";

import { User } from "@/types/types";
import saDeleteUser from "@/actions/saDeleteUser";
import saDeleteSessionsByUser from "@/actions/saDeleteSessionsByUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";

export default function UserActions({ user }: { user: User }) {
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingSessions, setIsDeletingSessions] = useState(false);

  const router = useRouter();

  const deleteUser = async () => {
    setIsDeletingUser(true);
    const saResponse = await saDeleteUser({ userId: user.id });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting User: ${
          saResponse.error || "There was an error deleting the user"
        }`
      );
      setIsDeletingUser(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${user.name}`);
    setIsDeletingUser(false);
    router.push("/admin/users");
  };

  return (
    <div className="flex items-center gap-2">
      <Alert
        destructive
        title={`Delete ${user.name}`}
        description="This action cannot be undone."
        actionText="Delete"
        onAction={deleteUser}
      >
        <Button className="cursor-pointer" variant="destructive" size="sm">
          {isDeletingUser ? <Spinner /> : null}
          Delete {user.name}
        </Button>
      </Alert>
    </div>
  );
}
