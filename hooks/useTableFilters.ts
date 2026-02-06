"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { TableFilterConfig, TableFilterValues } from "@/types/types";

interface UseTableFiltersOptions {
  /** Unique identifier for persisting filter state to localStorage */
  tableId: string;
  /** Filter configuration array */
  filters: TableFilterConfig[];
}

interface UseTableFiltersReturn {
  /** Current filter values */
  values: TableFilterValues;
  /** Set a single filter value */
  setValue: (name: string, value: string | boolean) => void;
  /** Clear all filters to their default values */
  clearAll: () => void;
  /** Object to spread into DataTable's getDataParams */
  getDataParams: Record<string, string | boolean | undefined>;
  /** Key string for DataTable's key prop (triggers re-fetch on change) */
  filterKey: string;
  /** True if any filter differs from its default value */
  hasActiveFilters: boolean;
}

/**
 * Hook for managing table filter state with localStorage persistence.
 * Mirrors the sort persistence pattern in DataTable.
 */
export function useTableFilters({
  tableId,
  filters,
}: UseTableFiltersOptions): UseTableFiltersReturn {
  // Build default values from filter config
  const defaultValues = useMemo(() => {
    const defaults: TableFilterValues = {};
    for (const filter of filters) {
      defaults[filter.name] = filter.defaultValue;
    }
    return defaults;
  }, [filters]);

  // Initialize with defaults (don't read localStorage during render to avoid hydration mismatch)
  const [values, setValues] = useState<TableFilterValues>(defaultValues);

  // Load filter values from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`table-filters-${tableId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new filters added after storage
        setValues({ ...defaultValues, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
  }, [tableId, defaultValues]);

  // Sync with localStorage when values change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Only store non-default values to keep localStorage clean
      const nonDefaultValues: TableFilterValues = {};
      let hasNonDefault = false;

      for (const [key, value] of Object.entries(values)) {
        if (value !== defaultValues[key]) {
          nonDefaultValues[key] = value;
          hasNonDefault = true;
        }
      }

      if (hasNonDefault) {
        localStorage.setItem(
          `table-filters-${tableId}`,
          JSON.stringify(nonDefaultValues)
        );
      } else {
        // Remove from localStorage if all values are defaults
        localStorage.removeItem(`table-filters-${tableId}`);
      }
    } catch {
      // Ignore storage errors
    }
  }, [values, tableId, defaultValues]);

  // Set a single filter value
  const setValue = useCallback((name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Clear all filters to defaults
  const clearAll = useCallback(() => {
    setValues(defaultValues);
    try {
      localStorage.removeItem(`table-filters-${tableId}`);
    } catch {
      // Ignore storage errors
    }
  }, [defaultValues, tableId]);

  // Check if any filter differs from default
  const hasActiveFilters = useMemo(() => {
    for (const filter of filters) {
      if (values[filter.name] !== filter.defaultValue) {
        return true;
      }
    }
    return false;
  }, [values, filters]);

  // Build getDataParams object - only include non-empty/non-default values
  const getDataParams = useMemo(() => {
    const params: Record<string, string | boolean | undefined> = {};
    for (const filter of filters) {
      const value = values[filter.name];
      // For select filters, only include if not empty string
      // For switch filters, only include if true (or always include if needed)
      if (filter.type === "select" && value && value !== "") {
        params[filter.name] = value;
      } else if (filter.type === "switch") {
        params[filter.name] = value;
      }
    }
    return params;
  }, [values, filters]);

  // Create a stable key string for DataTable's key prop
  const filterKey = useMemo(() => {
    return JSON.stringify(values);
  }, [values]);

  return {
    values,
    setValue,
    clearAll,
    getDataParams,
    filterKey,
    hasActiveFilters,
  };
}
