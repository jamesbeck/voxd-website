"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Code2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import saGenerateScenario from "@/actions/saGenerateScenario";
import saDeleteQuoteExampleConversation from "@/actions/saDeleteQuoteExampleConversation";
import saDeleteExampleConversation from "@/actions/saDeleteExampleConversation";
import saUpdateQuoteExampleConversation from "@/actions/saUpdateQuoteExampleConversation";
import saUpdateExampleConversation from "@/actions/saUpdateExampleConversation";
import saReorderExampleConversations from "@/actions/saReorderExampleConversations";
import saCreatePendingExampleConversations from "@/actions/saCreatePendingExampleConversations";
import saGenerateExampleConversationById from "@/actions/saGenerateExampleConversationById";
import WhatsAppSim from "@/components/whatsAppSim";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

type ExampleConversation = {
  id: string;
  description: string;
  prompt: string;
  startTime: string;
  generating?: boolean;
  messages: {
    role: "user" | "assistant";
    content: string;
    annotation: string | null;
    time: number;
  }[];
};

function SortableConversationItem({
  conversation,
  isSelected,
  onSelect,
  onEdit,
  onEmbed,
  onDelete,
}: {
  conversation: ExampleConversation;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onEmbed: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conversation.id, disabled: conversation.generating });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGenerating = conversation.generating;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex rounded-lg border transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isDragging && "opacity-50 shadow-lg",
        isGenerating && "opacity-70",
      )}
    >
      <div
        {...(isGenerating ? {} : attributes)}
        {...(isGenerating ? {} : listeners)}
        className={cn(
          "flex items-center px-2 text-muted-foreground",
          isGenerating
            ? "cursor-not-allowed"
            : "cursor-grab active:cursor-grabbing hover:text-foreground",
        )}
        suppressHydrationWarning
      >
        {isGenerating ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <GripVertical className="h-4 w-4" />
        )}
      </div>
      <button
        onClick={isGenerating ? undefined : onSelect}
        className={cn("flex-1 text-left p-4", isGenerating && "cursor-default")}
        disabled={isGenerating}
      >
        <p className="font-medium text-sm">
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-3 w-3" />
              Generating conversation...
            </span>
          ) : (
            conversation.description
          )}
        </p>
        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
          {conversation.prompt}
        </p>
        {!isGenerating && (
          <p className="text-muted-foreground text-xs mt-2">
            {conversation.messages.length} messages • Starts at{" "}
            {conversation.startTime}
          </p>
        )}
      </button>
      <div className="flex flex-col gap-1 p-2 border-l">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isGenerating) onEdit();
          }}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground",
            isGenerating
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-muted hover:text-foreground",
          )}
          title="Edit conversation"
          disabled={isGenerating}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isGenerating) onEmbed();
          }}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground",
            isGenerating
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-muted hover:text-foreground",
          )}
          title="Get embed code"
          disabled={isGenerating}
        >
          <Code2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isGenerating) onDelete();
          }}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground",
            isGenerating
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-destructive/10 hover:text-destructive",
          )}
          title="Delete conversation"
          disabled={isGenerating}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type ExampleConversationsTabProps = {
  conversations: ExampleConversation[];
  businessName: string;
} & (
  | { quoteId: string; exampleId?: never }
  | { exampleId: string; quoteId?: never }
);

export default function ExampleConversationsTab({
  quoteId,
  exampleId,
  conversations: initialConversations,
  businessName,
}: ExampleConversationsTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingScenarios, setGeneratingScenarios] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([""]);
  const [conversations, setConversations] =
    useState<ExampleConversation[]>(initialConversations);
  const [generatingIds, setGeneratingIds] = useState<string[]>(() =>
    initialConversations.filter((c) => c.generating).map((c) => c.id),
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(initialConversations.length > 0 ? initialConversations[0].id : null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [origin, setOrigin] = useState("");
  const [editConversation, setEditConversation] =
    useState<ExampleConversation | null>(null);
  const [editMessages, setEditMessages] = useState<
    ExampleConversation["messages"]
  >([]);
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set origin on mount
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Poll for updates when there are generating conversations
  useEffect(() => {
    if (generatingIds.length > 0) {
      // Start polling every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        router.refresh();
      }, 5000);
    } else {
      // Stop polling when no conversations are generating
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [generatingIds.length, router]);

  // Sync local state with props when they change
  useEffect(() => {
    setConversations(initialConversations);
    // Update generatingIds based on refreshed data
    setGeneratingIds((prev) => {
      const stillGenerating = initialConversations
        .filter((c) => c.generating)
        .map((c) => c.id);
      // Keep IDs that are still generating according to new data
      return prev.filter((id) => stillGenerating.includes(id));
    });
  }, [initialConversations]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = conversations.findIndex((c) => c.id === active.id);
      const newIndex = conversations.findIndex((c) => c.id === over.id);

      const newConversations = arrayMove(conversations, oldIndex, newIndex);
      setConversations(newConversations);

      // Save the new order to the database
      const response = await saReorderExampleConversations({
        quoteId,
        exampleId,
        conversationIds: newConversations.map((c) => c.id),
      });

      if (!response.success) {
        toast.error(response.error || "Failed to save order");
        // Revert to original order
        setConversations(conversations);
      }
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  const handleGenerateScenarios = async () => {
    setGeneratingScenarios(true);

    const response = await saGenerateScenario(
      quoteId
        ? { quoteId, count: prompts.length }
        : { exampleId: exampleId!, count: prompts.length },
    );

    if (!response.success) {
      toast.error(response.error || "Failed to generate scenarios");
      setGeneratingScenarios(false);
      return;
    }

    if (response.data?.scenarios) {
      const scenarios = response.data.scenarios as string[];
      const newPrompts = prompts.map((_, i) => scenarios[i] || "");
      setPrompts(newPrompts);
      toast.success(
        `Generated ${scenarios.length} scenario${scenarios.length > 1 ? "s" : ""} successfully`,
      );
    }

    setGeneratingScenarios(false);
  };

  const addPrompt = () => {
    if (prompts.length < 5) {
      setPrompts([...prompts, ""]);
    }
  };

  const addMaxPrompts = () => {
    setPrompts([...Array(5)].map((_, i) => prompts[i] || ""));
  };

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((_, i) => i !== index));
    }
  };

  const updatePrompt = (index: number, value: string) => {
    setPrompts(prompts.map((p, i) => (i === index ? value : p)));
  };

  const handleGenerate = async () => {
    const validPrompts = prompts.filter((p) => p.trim());

    if (validPrompts.length === 0) {
      toast.error("Please enter at least one conversation scenario");
      return;
    }

    setLoading(true);

    // Create pending conversation records
    const response = await saCreatePendingExampleConversations(
      quoteId
        ? { quoteId, prompts: validPrompts }
        : { exampleId: exampleId!, prompts: validPrompts },
    );

    if (!response.success) {
      toast.error(response.error || "Failed to create conversations");
      setLoading(false);
      return;
    }

    const conversationIds = response.data!.conversationIds as string[];

    // Add pending conversations to local state immediately
    const pendingConversations: ExampleConversation[] = validPrompts.map(
      (prompt, i) => ({
        id: conversationIds[i],
        description: "Generating...",
        prompt,
        startTime: "--:--",
        messages: [],
        generating: true,
      }),
    );

    setConversations((prev) => [...prev, ...pendingConversations]);
    setGeneratingIds((prev) => [...prev, ...conversationIds]);

    // Close dialog and reset
    setIsOpen(false);
    setPrompts([""]);
    setLoading(false);

    toast.success(
      `Generating ${validPrompts.length} conversation${validPrompts.length > 1 ? "s" : ""}...`,
    );

    // Fire off generation requests in background (no await)
    for (const conversationId of conversationIds) {
      saGenerateExampleConversationById({ conversationId }).catch((error) => {
        console.error("Background generation error:", error);
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    const response = quoteId
      ? await saDeleteQuoteExampleConversation({ conversationId: deleteId })
      : await saDeleteExampleConversation({ conversationId: deleteId });

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

    const response = quoteId
      ? await saUpdateQuoteExampleConversation({
          conversationId: editConversation.id,
          messages: editMessages,
          description: editDescription,
          startTime: editStartTime,
        })
      : await saUpdateExampleConversation({
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
    value: string | number,
  ) => {
    setEditMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, [field]: value } : msg)),
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
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setPrompts([""]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Generate Example Conversation{prompts.length > 1 ? "s" : ""}
              </DialogTitle>
              <DialogDescription>
                Describe the scenario{prompts.length > 1 ? "s" : ""} you want
                the conversation{prompts.length > 1 ? "s" : ""} to demonstrate.
                The AI will generate realistic chat
                {prompts.length > 1 ? "s" : ""} between a user and the chatbot
                based on your specification{prompts.length > 1 ? "s" : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {prompts.map((prompt, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`prompt-${index}`}>
                      Scenario {prompts.length > 1 ? index + 1 : ""}
                    </Label>
                    {prompts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrompt(index)}
                        disabled={loading || generatingScenarios}
                        className="h-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={`prompt-${index}`}
                    placeholder="e.g. A customer asking about product availability and then placing an order..."
                    value={prompt}
                    onChange={(e) => updatePrompt(index, e.target.value)}
                    className="h-[60px]"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPrompt}
                    disabled={
                      prompts.length >= 5 || loading || generatingScenarios
                    }
                    className="h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add another
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMaxPrompts}
                    disabled={
                      prompts.length >= 5 || loading || generatingScenarios
                    }
                    className="h-8"
                  >
                    Add max (5)
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateScenarios}
                  disabled={generatingScenarios || loading}
                  className="h-8"
                >
                  {generatingScenarios ? (
                    <>
                      <Spinner className="mr-2 h-3.5 w-3.5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Generate {prompts.length} scenario
                      {prompts.length > 1 ? "s" : ""} for me
                    </>
                  )}
                </Button>
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
              <Button
                onClick={handleGenerate}
                disabled={loading || generatingScenarios}
              >
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
          <div className="flex-1 min-w-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={conversations.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2" suppressHydrationWarning>
                  {conversations.map((conversation) => (
                    <SortableConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() =>
                        setSelectedConversationId(conversation.id)
                      }
                      onEdit={() => openEditDialog(conversation)}
                      onEmbed={() => setEmbedId(conversation.id)}
                      onDelete={() => setDeleteId(conversation.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Right side - WhatsApp simulator */}
          <div className="flex-shrink-0">
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

      {/* Embed dialog */}
      <Dialog
        open={!!embedId}
        onOpenChange={(open) => {
          if (!open) {
            setEmbedId(null);
            setCopiedUrl(false);
            setCopiedCode(false);
          }
        }}
      >
        <DialogContent className="w-full max-w-6xl sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Embed Conversation</DialogTitle>
            <DialogDescription>
              Copy the URL or iframe code to embed this conversation on your
              website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed URL</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const url = `${origin}/iframes/example-conversations/${embedId}`;
                    await navigator.clipboard.writeText(url);
                    setCopiedUrl(true);
                    toast.success("URL copied to clipboard");
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {origin}/iframes/example-conversations/{embedId}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Iframe Code</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const iframeCode = `<iframe\n  src="${origin}/iframes/example-conversations/${embedId}"\n  width="360"\n  height="736"\n  frameborder="0"\n  allowtransparency="true"\n></iframe>`;
                    await navigator.clipboard.writeText(iframeCode);
                    setCopiedCode(true);
                    toast.success("Code copied to clipboard");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                {`<iframe
  src="${origin}/iframes/example-conversations/${embedId}"
  width="360"
  height="736"
  frameborder="0"
  allowtransparency="true"
></iframe>`}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEmbedId(null)}>Close</Button>
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
                      message.role === "user" ? "bg-muted/30" : "bg-primary/5",
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
                                parseInt(e.target.value) || 0,
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
