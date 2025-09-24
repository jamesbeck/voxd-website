// components/form-multi-select.tsx
import * as React from "react";
import { X, Check, ChevronDown } from "lucide-react";
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

export type Option = { label: string; value: string };

type BaseProps = {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
};

export type RHFFieldProps = {
  name?: string;
  value?: string[]; // RHF provides this
  onChange?: (values: string[]) => void; // RHF provides this
  onBlur?: () => void; // RHF provides this
};

// Works inside <FormControl>{...field}</FormControl>
export const FormMultiSelect = React.forwardRef<
  HTMLButtonElement,
  BaseProps & RHFFieldProps
>(
  (
    {
      options,
      value = [],
      onChange,
      onBlur,
      placeholder = "Select…",
      emptyMessage = "No options found.",
      disabled,
      className,
      maxHeight = 220,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedValues = Array.isArray(value) ? value : [];
    const selectedOptions = React.useMemo(
      () => options.filter((o) => selectedValues.includes(o.value)),
      [options, selectedValues]
    );

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

    return (
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) onBlur?.();
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
            className={cn(
              "w-full justify-between text-left",
              selectedOptions.length === 0 && "text-muted-foreground",
              className
            )}
          >
            <div className="flex flex-wrap items-center gap-1">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
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
          <Command shouldFilter>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <ScrollArea style={{ maxHeight }}>
                <CommandGroup>
                  {options.map((opt) => {
                    const selected = selectedValues.includes(opt.value);
                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        onSelect={() => toggle(opt.value)}
                      >
                        <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border">
                          {selected ? <Check className="h-3.5 w-3.5" /> : null}
                        </div>
                        <span>{opt.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </ScrollArea>
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

FormMultiSelect.displayName = "FormMultiSelect";
