"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import saGenerateExampleConversation from "@/actions/saGenerateExampleConversation";
import saDeleteExampleConversation from "@/actions/saDeleteExampleConversation";
import saUpdateExampleConversation from "@/actions/saUpdateExampleConversation";
import WhatsAppSim from "@/components/whatsAppSim";

import { cn } from "@/lib/utils";

type ExampleConversation = {
  id: string;
  description: string;
  prompt: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    annotation: string | null;
    time: number;
  }[];
};

export default function ExampleConversationsTab({
  exampleId,
  conversations,
  businessName,
}: {
  exampleId: string;
  conversations: ExampleConversation[];
  businessName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(conversations.length > 0 ? conversations[0].id : null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editConversation, setEditConversation] =
    useState<ExampleConversation | null>(null);
  const [editMessages, setEditMessages] = useState<
    ExampleConversation["messages"]
  >([]);
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a conversation description");
      return;
    }

    setLoading(true);

    const response = await saGenerateExampleConversation({
      exampleId,
      prompt,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to generate conversation");
      setLoading(false);
      return;
    }

    toast.success("Conversation generated successfully");
    setLoading(false);
    setIsOpen(false);
    setPrompt("");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    const response = await saDeleteExampleConversation({
      conversationId: deleteId,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to delete conversation");
      setDeleting(false);
      return;
    }

    toast.success("Conversation deleted");
    setDeleting(false);
    setDeleteId(null);

    // If we deleted the selected conversation, select the first remaining one
    if (selectedConversationId === deleteId) {
      const remaining = conversations.filter((c) => c.id !== deleteId);
      setSelectedConversationId(remaining.length > 0 ? remaining[0].id : null);
    }

    router.refresh();
  };

  const openEditDialog = (conversation: ExampleConversation) => {
    setEditConversation(conversation);
    setEditMessages([...conversation.messages]);
    setEditDescription(conversation.description);
    setEditStartTime(conversation.startTime);
  };

  const closeEditDialog = () => {
    setEditConversation(null);
    setEditMessages([]);
    setEditDescription("");
    setEditStartTime("");
  };

  const handleSaveEdit = async () => {
    if (!editConversation) return;

    setSaving(true);

    const response = await saUpdateExampleConversation({
      conversationId: editConversation.id,
      messages: editMessages,
      description: editDescription,
      startTime: editStartTime,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to save conversation");
      setSaving(false);
      return;
    }

    toast.success("Conversation saved");
    setSaving(false);
    closeEditDialog();
    router.refresh();
  };

  const updateMessage = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setEditMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, [field]: value } : msg))
    );
  };

  const deleteMessage = (index: number) => {
    setEditMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const addMessage = (role: "user" | "assistant") => {
    setEditMessages((prev) => [
      ...prev,
      {
        role,
        content: "",
        annotation: role === "assistant" ? "" : null,
        time: 30,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Example Conversation</DialogTitle>
              <DialogDescription>
                Describe the scenario you want the conversation to demonstrate.
                The AI will generate a realistic chat between a user and the
                chatbot based on the example specification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Conversation Scenario</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g. A customer asking about product availability and then placing an order..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No example conversations yet.</p>
          <p className="text-sm mt-1">
            Click &quot;Generate Conversation&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left side - conversation list */}
          <div className="w-[350px] space-y-2 flex-shrink-0">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex rounded-lg border transition-colors",
                  selectedConversationId === conversation.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <button
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className="flex-1 text-left p-4"
                >
                  <p className="font-medium text-sm">
                    {conversation.description}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                    {conversation.prompt}
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    {conversation.messages.length} messages • Starts at{" "}
                    {conversation.startTime}
                  </p>
                </button>
                <div className="flex flex-col gap-1 p-2 border-l">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(conversation);
                    }}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Edit conversation"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(conversation.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right side - WhatsApp simulator */}
          <div className="flex-1 flex justify-center">
            {selectedConversation && (
              <WhatsAppSim
                messages={selectedConversation.messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                  time: m.time,
                  annotation: m.annotation || "",
                }))}
                businessName={businessName}
                startTime={selectedConversation.startTime}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this example conversation? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Spinner className="mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit conversation dialog */}
      <Dialog
        open={!!editConversation}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Conversation</DialogTitle>
            <DialogDescription>
              Edit the messages, timing, and annotations for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief description of this conversation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  placeholder="HH:mm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Messages</Label>
              <div className="space-y-3">
                {editMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border space-y-3",
                      message.role === "user" ? "bg-muted/30" : "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {message.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor={`time-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            Delay (s):
                          </Label>
                          <Input
                            id={`time-${index}`}
                            type="number"
                            value={message.time}
                            onChange={(e) =>
                              updateMessage(
                                index,
                                "time",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 h-7 text-xs"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMessage(index)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={message.content}
                      onChange={(e) =>
                        updateMessage(index, "content", e.target.value)
                      }
                      placeholder="Message content (HTML supported)"
                      className="min-h-[80px] text-sm"
                    />
                    {message.role === "assistant" && (
                      <div className="space-y-1">
                        <Label
                          htmlFor={`annotation-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Annotation
                        </Label>
                        <Input
                          id={`annotation-${index}`}
                          value={message.annotation || ""}
                          onChange={(e) =>
                            updateMessage(index, "annotation", e.target.value)
                          }
                          placeholder="Brief description of what the bot is doing"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessage("user")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add User Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessage("assistant")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Assistant Message
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Spinner className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
