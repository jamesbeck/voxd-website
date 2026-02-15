// components/inputs/RemoteSelect.tsx
import * as React from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
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
  params: ServerActionReadParams,
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
  initialLabel?: string; // Label to display for the initial value if not found in loaded options
};

export type RHFFieldProps = {
  name?: string;
  value?: string; // RHF provides this (single value)
  onChange?: (value: string) => void; // RHF provides this
  onBlur?: () => void; // RHF provides this
};

// Works inside <FormControl>{...field}</FormControl>
export const RemoteSelect = React.forwardRef<
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
      value = "",
      onChange,
      onBlur,
      placeholder = "Select…",
      emptyMessage = "No options found.",
      disabled,
      className,
      maxHeight = 220,
      searchDebounceMs = 300,
      pageSize = 100,
      initialLabel,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Option[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [searchValue, setSearchValue] = React.useState("");
    const [commandValue, setCommandValue] = React.useState("");
    const isMouseDownRef = React.useRef(false);
    // Store selected option to keep its label even when not in search results
    // Initialize with initial value/label if provided
    const [selectedOption, setSelectedOption] = React.useState<Option | null>(
      value && initialLabel ? { value, label: initialLabel } : null,
    );

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

            // Set command value to first option to highlight it
            if (newOptions.length > 0) {
              setCommandValue(newOptions[0].label);
            }

            // Update the selected option if it's in the results
            if (value) {
              const matchedOption = newOptions.find(
                (opt) => opt.value === value,
              );
              if (matchedOption) {
                setSelectedOption(matchedOption);
              }
            }
          } else {
            setError(response.error || "Failed to load options");
            setOptions([]);
          }
        } catch (err) {
          setError("Failed to load options");
          setOptions([]);
          console.error("RemoteSelect error:", err);
        } finally {
          setLoading(false);
        }
      },
      [
        serverAction,
        pageSize,
        label,
        valueField,
        sortField,
        sortDirection,
        value,
      ],
    );

    // Load options on mount (only once)
    React.useEffect(() => {
      loadOptions("");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced search effect
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        loadOptions(searchValue);
      }, searchDebounceMs);

      return () => clearTimeout(timeoutId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValue, searchDebounceMs]);

    const select = (selectedValue: string) => {
      const option = options.find((opt) => opt.value === selectedValue);
      if (option) {
        setSelectedOption(option);
        onChange?.(selectedValue);
        // Set a flag to prevent onFocus from reopening
        isMouseDownRef.current = true;
        setOpen(false);
      }
    };

    const clear = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedOption(null);
      onChange?.("");
      // Prevent the button from reopening on focus after clearing
      isMouseDownRef.current = true;
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
              !selectedOption && "text-muted-foreground",
              className,
            )}
          >
            <span className="flex-1 truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-2">
              {selectedOption && (
                <span
                  onClick={clear}
                  className="flex items-center justify-center hover:bg-accent rounded-sm cursor-pointer"
                >
                  <X className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" />
                </span>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command
            shouldFilter={false}
            value={commandValue}
            onValueChange={setCommandValue}
          >
            <CommandInput
              placeholder="Search..."
              value={searchValue}
              onValueChange={handleSearchChange}
              autoFocus
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
                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => select(opt.value)}
                        >
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
  },
);

RemoteSelect.displayName = "RemoteSelect";
