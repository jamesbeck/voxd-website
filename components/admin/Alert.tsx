import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Alert({
  title,
  description,
  actionText,
  children,
  onAction,
  destructive = false,
}: {
  title: string;
  description: string;
  actionText: string;
  // Should typically be a single element (e.g., <Button />) that will act as the trigger
  children: React.ReactElement;
  onAction: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      {/* Use asChild so the trigger does not render its own <button>, preventing nested button warnings */}
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onAction}
            className={cn(
              buttonVariants({
                variant: destructive ? "destructive" : "default",
              })
            )}
          >
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
