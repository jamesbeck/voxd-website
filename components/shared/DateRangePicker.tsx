"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onFromChange: (date: Date) => void;
  onToChange: (date: Date) => void;
  earliestDate?: Date;
  className?: string;
}

const getPresets = (earliestDate?: Date) => [
  {
    label: "This Week",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: new Date(),
    }),
  },
  {
    label: "Last Week",
    getRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    },
  },
  {
    label: "This Month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Last Month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "This Year",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Last Year",
    getRange: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      };
    },
  },
  {
    label: "All Time",
    getRange: () => ({
      from: earliestDate ?? new Date(),
      to: new Date(),
    }),
  },
];

const DateRangePicker = ({
  from,
  to,
  onFromChange,
  onToChange,
  earliestDate,
  className,
}: DateRangePickerProps) => {
  const presets = getPresets(earliestDate);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* From date picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[160px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(from, "LLL dd, y")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={from}
            onSelect={(date) => {
              if (date) onFromChange(date);
            }}
            disabled={{ after: to }}
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">to</span>

      {/* To date picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[160px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(to, "LLL dd, y")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={to}
            onSelect={(date) => {
              if (date) onToChange(date);
            }}
            disabled={{ before: from, after: new Date() }}
          />
        </PopoverContent>
      </Popover>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1 ml-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              const range = preset.getRange();
              onFromChange(range.from);
              onToChange(range.to);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DateRangePicker;
