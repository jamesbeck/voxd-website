"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Industry, Function } from "@/types/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExampleFilters({
  industries,
  selectedIndustry,
  functions,
  selectedFunction,
}: {
  industries: Industry[];
  selectedIndustry: string | undefined;
  functions: Function[];
  selectedFunction: string | undefined;
}) {
  const router = useRouter();

  const getUrl = ({
    industrySlug,
    functionSlug,
  }: {
    industrySlug?: string;
    functionSlug?: string;
  }) => {
    const url = new URL(window.location.href);

    if (industrySlug === "any") {
      url.searchParams.delete("industry");
    } else if (industrySlug) {
      url.searchParams.set("industry", industrySlug);
    }

    if (functionSlug === "any") {
      url.searchParams.delete("function");
    } else if (functionSlug) {
      url.searchParams.set("function", functionSlug);
    }

    return url.toString();
  };

  const functionValue = selectedFunction || "any";
  const industryValue = selectedIndustry || "any";

  return (
    <div className="flex gap-4 px-4 py-3 items-center bg-primary rounded-lg border border-darkgrey  ">
      <div className="text-white font-bold">Filters:</div>
      <Select
        value={functionValue}
        onValueChange={(value) => {
          router.push(getUrl({ functionSlug: value }));
        }}
      >
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="Filter by Function" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Function</SelectItem>
          {functions.map((func) => (
            <SelectItem key={func.id} value={func.slug}>
              {func.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={industryValue}
        onValueChange={(value) => {
          router.push(getUrl({ industrySlug: value }));
        }}
      >
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder="Filter by Industry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Industry</SelectItem>
          {industries.map((industry) => (
            <SelectItem key={industry.id} value={industry.slug}>
              {industry.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          router.push(getUrl({ industrySlug: "any", functionSlug: "any" }));
        }}
      >
        Clear
      </Button>
    </div>
  );
}
