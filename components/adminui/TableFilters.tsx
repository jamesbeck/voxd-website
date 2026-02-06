"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import {
  TableFilterConfig,
  TableFilterOption,
  TableFilterValues,
} from "@/types/types";

interface TableFiltersProps {
  /** Filter configuration array */
  filters: TableFilterConfig[];
  /** Current filter values */
  values: TableFilterValues;
  /** Callback when a filter value changes */
  onChange: (name: string, value: string | boolean) => void;
  /** Callback to clear all filters */
  onClear: () => void;
  /** Whether any filters are active (differ from defaults) */
  hasActiveFilters: boolean;
}

interface SelectFilterProps {
  filter: TableFilterConfig;
  value: string;
  onChange: (value: string) => void;
}

function SelectFilter({ filter, value, onChange }: SelectFilterProps) {
  const [options, setOptions] = useState<TableFilterOption[]>(
    filter.options || [],
  );
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!filter.options);

  // Load async options when component mounts
  useEffect(() => {
    if (filter.loadOptions && !loaded) {
      setLoading(true);
      filter
        .loadOptions()
        .then((loadedOptions) => {
          setOptions(loadedOptions);
          setLoaded(true);
        })
        .catch((error) => {
          console.error("Failed to load filter options:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [filter, loaded]);

  // Use a special value for "clear" since Radix Select doesn't allow empty string
  const CLEAR_VALUE = "__clear__";

  const handleChange = (newValue: string) => {
    onChange(newValue === CLEAR_VALUE ? "" : newValue);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`filter-${filter.name}`} className="text-sm font-medium">
        {filter.label}
      </Label>
      <Select
        value={value || CLEAR_VALUE}
        onValueChange={handleChange}
        disabled={loading && !loaded}
      >
        <SelectTrigger id={`filter-${filter.name}`} className="w-[200px]">
          {loading && !loaded ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <SelectValue placeholder={filter.placeholder || "Select..."} />
          )}
        </SelectTrigger>
        <SelectContent>
          {/* Clear option to reset the filter */}
          <SelectItem value={CLEAR_VALUE}>
            {filter.placeholder || "All"}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SwitchFilterProps {
  filter: TableFilterConfig;
  value: boolean;
  onChange: (value: boolean) => void;
}

function SwitchFilter({ filter, value, onChange }: SwitchFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`filter-${filter.name}`}
        checked={value}
        onCheckedChange={onChange}
      />
      <Label htmlFor={`filter-${filter.name}`} className="text-sm font-medium">
        {filter.label}
      </Label>
    </div>
  );
}

export default function TableFilters({
  filters,
  values,
  onChange,
  onClear,
  hasActiveFilters,
}: TableFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-4 mb-4">
      {filters.map((filter) => {
        if (filter.type === "select") {
          return (
            <SelectFilter
              key={filter.name}
              filter={filter}
              value={(values[filter.name] as string) || ""}
              onChange={(value) => onChange(filter.name, value)}
            />
          );
        }

        if (filter.type === "switch") {
          return (
            <SwitchFilter
              key={filter.name}
              filter={filter}
              value={(values[filter.name] as boolean) || false}
              onChange={(value) => onChange(filter.name, value)}
            />
          );
        }

        return null;
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
