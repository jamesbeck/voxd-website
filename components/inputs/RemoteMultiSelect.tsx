// components/inputs/RemoteMultiSelect.tsx
import * as React from "react";
import { X, Check, ChevronDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

export type Option = { label: string; value: string };

type ServerAction = (
  params: ServerActionReadParams
) => Promise<ServerActionReadResponse>;

type BaseProps = {
  serverAction: ServerAction;
  label: (record: any) => string; // Function to format the label from server response
  valueField: string; // Field from server response to use as value
  sortField?: string; // Field to use for sorting (optional, defaults to valueField)
  sortDirection?: "asc" | "desc"; // Sort direction (optional, defaults to "asc")
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
  searchDebounceMs?: number;
  pageSize?: number;
};

export type RHFFieldProps = {
  name?: string;
  value?: string[]; // RHF provides this
  onChange?: (values: string[]) => void; // RHF provides this
  onBlur?: () => void; // RHF provides this
  "aria-invalid"?: boolean; // For form validation styling
};

// Works inside <FormControl>{...field}</FormControl>
export const RemoteMultiSelect = React.forwardRef<
  HTMLButtonElement,
  BaseProps & RHFFieldProps
>(
  (
    {
      serverAction,
      label,
      valueField,
      sortField,
      sortDirection = "asc",
      value = [],
      onChange,
      onBlur,
      placeholder = "Select…",
      emptyMessage = "No options found.",
      disabled,
      className,
      maxHeight = 220,
      searchDebounceMs = 300,
      pageSize = 100,
      "aria-invalid": ariaInvalid,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Option[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [searchValue, setSearchValue] = React.useState("");
    const isMouseDownRef = React.useRef(false);
    // Store all selected options to keep their labels even when not in search results
    const [allSelectedOptions, setAllSelectedOptions] = React.useState<
      Map<string, string>
    >(new Map());

    const selectedValues = React.useMemo(
      () => (Array.isArray(value) ? value : []),
      [value]
    );

    // Build the display list of selected options using stored labels
    const selectedOptions = React.useMemo(() => {
      return selectedValues.map((val) => ({
        value: val,
        label: allSelectedOptions.get(val) || val, // Fallback to value if label not found
      }));
    }, [selectedValues, allSelectedOptions]);

    const loadOptions = React.useCallback(
      async (search: string) => {
        setLoading(true);
        setError(null);

        try {
          const response = await serverAction({
            search: search || undefined,
            page: 1,
            pageSize,
            sortField: sortField || valueField, // Use provided sortField or fallback to valueField
            sortDirection: sortDirection,
          });

          if (response.success) {
            const newOptions: Option[] = response.data.map((item: any) => ({
              label: label(item),
              value: item[valueField],
            }));
            setOptions(newOptions);

            // Update the allSelectedOptions map with any new options
            setAllSelectedOptions((prev) => {
              const updated = new Map(prev);
              newOptions.forEach((opt) => {
                updated.set(opt.value, opt.label);
              });
              return updated;
            });
          } else {
            setError(response.error || "Failed to load options");
            setOptions([]);
          }
        } catch (err) {
          setError("Failed to load options");
          setOptions([]);
          console.error("RemoteMultiSelect error:", err);
        } finally {
          setLoading(false);
        }
      },
      [serverAction, pageSize, label, valueField, sortField, sortDirection]
    );

    // Load options on mount (only once)
    React.useEffect(() => {
      loadOptions("");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced search effect (only when search value changes)
    React.useEffect(() => {
      // Don't search if the search value is empty (initial state)
      if (searchValue === "") {
        return;
      }

      const timeoutId = setTimeout(() => {
        loadOptions(searchValue);
      }, searchDebounceMs);

      return () => clearTimeout(timeoutId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValue, searchDebounceMs]);

    const commit = (next: string[]) => {
      onChange?.(next);
    };

    const toggle = (v: string) => {
      if (selectedValues.includes(v)) {
        commit(selectedValues.filter((x) => x !== v));
      } else {
        commit([...selectedValues, v]);
      }
    };

    const clearAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      commit([]);
    };

    const handleSearchChange = (search: string) => {
      setSearchValue(search);
    };

    return (
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            onBlur?.();
            setSearchValue(""); // Reset search when closing
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            tabIndex={0}
            onMouseDown={() => {
              isMouseDownRef.current = true;
            }}
            onFocus={() => {
              // Only open on focus if it wasn't from a mouse click
              if (!isMouseDownRef.current && !open) {
                setOpen(true);
              }
              isMouseDownRef.current = false;
            }}
            className={cn(
              "w-full justify-between text-left min-h-10 h-auto py-2",
              selectedOptions.length === 0 && "text-muted-foreground",
              "aria-invalid:!border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
              className
            )}
          >
            <div className="flex flex-wrap items-center gap-1 flex-1 mr-2">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt: Option) => (
                  <Badge
                    key={opt.value}
                    variant="secondary"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(opt.value);
                    }}
                  >
                    {opt.label}
                    <X className="h-3 w-3 opacity-70" />
                  </Badge>
                ))
              ) : (
                <span>{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <span
                  className="cursor-pointer rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll(e);
                  }}
                >
                  Clear
                </span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              value={searchValue}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-500">{error}</div>
              ) : options.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                <ScrollArea style={{ maxHeight }}>
                  <CommandGroup>
                    {options.map((opt: Option) => {
                      const selected = selectedValues.includes(opt.value);
                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => toggle(opt.value)}
                        >
                          <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border">
                            {selected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : null}
                          </div>
                          <span>{opt.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </ScrollArea>
              )}
            </CommandList>
          </Command>
          <Separator />
          <div className="flex items-center justify-end gap-2 p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

RemoteMultiSelect.displayName = "RemoteMultiSelect";
