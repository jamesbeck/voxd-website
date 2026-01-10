"use client";

import { AdminUser } from "@/types/types";
import saDeleteAdminUser from "@/actions/saDeleteAdminUser";
import saDeleteSessionsByUser from "@/actions/saDeleteSessionsByUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";

export default function UserActions({
  user,
  superAdmin,
  partner,
}: {
  user: AdminUser;
  superAdmin: boolean;
  partner: boolean;
}) {
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const router = useRouter();

  const deleteUser = async () => {
    setIsDeletingUser(true);
    const saResponse = await saDeleteAdminUser({ userId: user.id });

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
    router.push("/admin/adminUsers");
  };

  return (
    <div className="flex items-center gap-2">
      {superAdmin && (
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
      )}
    </div>
  );
}
