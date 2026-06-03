"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import saGetAvailableCustomFunctions from "@/actions/saGetAvailableCustomFunctions";

export type AvailableCustomFunction = {
  id: string;
  agentId: string;
  key: string;
  name: string;
  niceName: string;
  description: string;
  humanReadableDescription: string;
  targetScopes: string[];
  inputSchema: Record<string, unknown> | null;
};

export const getAvailableCustomFunctionLabel = (
  customFunction: AvailableCustomFunction,
) => customFunction.niceName || customFunction.name || customFunction.key;

export default function useAvailableCustomFunctions({
  agentId,
  allowedTargetScopes,
}: {
  agentId: string;
  allowedTargetScopes: string[];
}) {
  const [functions, setFunctions] = useState<AvailableCustomFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const allowedTargetScopesKey = allowedTargetScopes.join("|");

  useEffect(() => {
    let isMounted = true;
    const allowedTargetScopeSet = new Set(
      allowedTargetScopesKey ? allowedTargetScopesKey.split("|") : [],
    );

    const loadFunctions = async () => {
      setIsLoading(true);

      const response = await saGetAvailableCustomFunctions({ agentId });

      if (!isMounted) {
        return;
      }

      if (!response.success) {
        toast.error(response.error || "Failed to load custom functions");
        setFunctions([]);
        setIsLoading(false);
        return;
      }

      const nextFunctions = (
        (response.data || []) as AvailableCustomFunction[]
      ).filter((customFunction) =>
        customFunction.targetScopes.some((scope) =>
          allowedTargetScopeSet.has(scope),
        ),
      );

      setFunctions(nextFunctions);
      setIsLoading(false);
    };

    void loadFunctions();

    return () => {
      isMounted = false;
    };
  }, [agentId, allowedTargetScopesKey]);

  return {
    functions,
    isLoading,
  };
}
