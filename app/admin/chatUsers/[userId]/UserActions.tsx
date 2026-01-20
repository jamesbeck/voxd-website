"use client";

import { ChatUser } from "@/types/types";
import saDeleteUser from "@/actions/saDeleteUser";
import saDeleteSessionsByUser from "@/actions/saDeleteSessionsByUser";
import saClearUserData from "@/actions/saClearUserData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon, XCircleIcon } from "lucide-react";

export default function UserActions({ user }: { user: ChatUser }) {
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingSessions, setIsDeletingSessions] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const router = useRouter();

  const deleteUser = async () => {
    setIsDeletingUser(true);
    const saResponse = await saDeleteUser({ userId: user.id });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting User: ${
          saResponse.error || "There was an error deleting the user"
        }`,
      );
      setIsDeletingUser(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${user.name}`);
    setIsDeletingUser(false);
    router.push("/admin/chatUsers");
  };

  const deleteUserSessions = async () => {
    setIsDeletingSessions(true);
    const saResponse = await saDeleteSessionsByUser({ userId: user.id });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting User's Sessions: ${
          saResponse.error || "There was an error deleting the user's sessions"
        }`,
      );
      setIsDeletingSessions(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted sessions for ${user.name}`);
    setIsDeletingSessions(false);
    router.refresh();
  };

  const clearUserData = async () => {
    setIsClearingData(true);
    const saResponse = await saClearUserData({ userId: user.id });

    if (!saResponse.success) {
      toast.error(
        `Error Clearing User Data: ${
          saResponse.error || "There was an error clearing the user data"
        }`,
      );
      setIsClearingData(false);
      return;
    }
    // If successful
    toast.success(`Successfully cleared data for ${user.name}`);
    setIsClearingData(false);
    router.refresh();
  };

  return (
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
          <Alert
            destructive
            title={`Clear ${user.name}'s Data`}
            description="This action cannot be undone. All stored data for this user will be cleared and reset to an empty object."
            actionText="Clear Data"
            onAction={clearUserData}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              {isClearingData ? (
                <Spinner />
              ) : (
                <XCircleIcon className="h-4 w-4" />
              )}
              Clear User Data
            </DropdownMenuItem>
          </Alert>
          <Alert
            destructive
            title={`Delete ${user.name}'s Sessions`}
            description="This action cannot be undone. All sessions for this user will be permanently deleted."
            actionText="Delete Sessions"
            onAction={deleteUserSessions}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              {isDeletingSessions ? (
                <Spinner />
              ) : (
                <Trash2Icon className="h-4 w-4" />
              )}
              Delete Sessions
            </DropdownMenuItem>
          </Alert>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Alert
            destructive
            title={`Delete ${user.name}`}
            description="This action cannot be undone. The user and all their data will be permanently deleted."
            actionText="Delete"
            onAction={deleteUser}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              {isDeletingUser ? (
                <Spinner />
              ) : (
                <Trash2Icon className="h-4 w-4" />
              )}
              Delete User
            </DropdownMenuItem>
          </Alert>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
