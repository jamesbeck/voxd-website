"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import { ServerActionResponse } from "@/types/types";

export type LinkedItem = {
  id: string;
  itemId: string | null;
  itemName: string | null;
  itemDescription: string | null;
  otherName: string | null;
  otherDescription: string | null;
  note: string | null;
};

type OptionItem = {
  id: string;
  name: string;
  description: string | null;
};

interface QuoteLinkedItemsSectionProps {
  quoteId: string;
  title: string;
  description: string;
  items: LinkedItem[];
  fetchOptionsAction: () => Promise<ServerActionResponse>;
  addAction: (params: {
    quoteId: string;
    integrationId?: string;
    knowledgeSourceId?: string;
    otherName?: string;
    otherDescription?: string;
  }) => Promise<ServerActionResponse>;
  updateNoteAction: (params: {
    id: string;
    note: string;
  }) => Promise<ServerActionResponse>;
  deleteAction: (params: { id: string }) => Promise<ServerActionResponse>;
  isReadOnly: boolean;
  itemIdField: "integrationId" | "knowledgeSourceId";
}

function ItemCard({
  item,
  updateNoteAction,
  deleteAction,
  isReadOnly,
}: {
  item: LinkedItem;
  updateNoteAction: (params: {
    id: string;
    note: string;
  }) => Promise<ServerActionResponse>;
  deleteAction: (params: { id: string }) => Promise<ServerActionResponse>;
  isReadOnly: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(item.note || "");
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const title = item.itemName || item.otherName || "Unknown";
  const subtitle = item.itemDescription || item.otherDescription || null;
  const isOther = !item.itemId;

  const saveNote = useCallback(
    async (value: string) => {
      const result = await updateNoteAction({ id: item.id, note: value });
      if (!result.success) {
        toast.error("Failed to save note");
      }
    },
    [item.id, updateNoteAction],
  );

  const debouncedSaveNote = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveNote(value), 1000);
    },
    [saveNote],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAction({ id: item.id });
    if (result.success) {
      toast.success("Item removed");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove item");
    }
    setDeleting(false);
  };

  return (
    <Card className="bg-muted/50 shadow-none gap-0 py-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div>
          <CardTitle className="text-sm font-medium">
            {title}
            {isOther && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Custom)
              </span>
            )}
          </CardTitle>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {!isReadOnly && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {title}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove this item and any associated notes. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="px-3 pb-3">
        <Textarea
          placeholder="Add notes..."
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (!isReadOnly) debouncedSaveNote(e.target.value);
          }}
          className="h-[60px] bg-background text-sm"
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
      </div>
    </Card>
  );
}

export default function QuoteLinkedItemsSection({
  quoteId,
  title,
  description,
  items,
  fetchOptionsAction,
  addAction,
  updateNoteAction,
  deleteAction,
  isReadOnly,
  itemIdField,
}: QuoteLinkedItemsSectionProps) {
  const router = useRouter();
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  // "Other" flow state
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherDescription, setOtherDescription] = useState("");

  const loadOptions = useCallback(async () => {
    setLoading(true);
    const result = await fetchOptionsAction();
    if (result.success && result.data) {
      setOptions(result.data);
    }
    setLoading(false);
  }, [fetchOptionsAction]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleSelectItem = async (optionId: string) => {
    setAdding(true);
    setOpen(false);
    const result = await addAction({
      quoteId,
      [itemIdField]: optionId,
    });
    if (result.success) {
      toast.success("Item added");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add item");
    }
    setAdding(false);
  };

  const handleAddOther = async () => {
    if (!otherName.trim()) {
      toast.error("Name is required");
      return;
    }
    setAdding(true);
    const result = await addAction({
      quoteId,
      otherName: otherName.trim(),
      otherDescription: otherDescription.trim() || undefined,
    });
    if (result.success) {
      toast.success("Item added");
      setOtherName("");
      setOtherDescription("");
      setIsOtherMode(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add item");
    }
    setAdding(false);
  };

  // Filter out already-added items from the dropdown
  const existingItemIds = new Set(
    items.filter((i) => i.itemId).map((i) => i.itemId),
  );
  const availableOptions = options.filter(
    (opt) => !existingItemIds.has(opt.id),
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {!isReadOnly && (
        <div className="space-y-3">
          {!isOtherMode ? (
            <div className="flex items-center gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={adding}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add {title.replace(/s$/, "")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase()))
                        return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder={`Search ${title.toLowerCase()}...`}
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : availableOptions.length === 0 && !search ? (
                        <CommandEmpty>No options available.</CommandEmpty>
                      ) : (
                        <>
                          <CommandGroup>
                            {availableOptions.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.name}
                                onSelect={() => handleSelectItem(opt.id)}
                              >
                                <div>
                                  <div className="font-medium">{opt.name}</div>
                                  {opt.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                        </>
                      )}
                      <CommandGroup>
                        <CommandItem
                          value="__other__"
                          onSelect={() => {
                            setIsOtherMode(true);
                            setOpen(false);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Other (custom)
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Add Custom {title.replace(/s$/, "")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setIsOtherMode(false);
                      setOtherName("");
                      setOtherDescription("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Input
                  placeholder="Name"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  className="h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={handleAddOther}
                  disabled={adding || !otherName.trim()}
                >
                  Add
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              updateNoteAction={updateNoteAction}
              deleteAction={deleteAction}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No {title.toLowerCase()} added yet.
        </p>
      )}
    </div>
  );
}
