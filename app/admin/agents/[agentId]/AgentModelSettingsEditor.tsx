"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Cpu, Info, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import saUpdateAgentModel from "@/actions/saUpdateAgentModel";

interface ModelRecord {
  id: string;
  providerId: string;
  provider: string;
  model: string;
  inputTokenCost: string;
  outputTokenCost: string;
}

interface ProviderApiKeyRecord {
  id: string;
  providerId: string;
  providerName: string;
  label: string;
}

interface AgentModelSettingsEditorProps {
  agentId: string;
  models: ModelRecord[];
  providerApiKeys: ProviderApiKeyRecord[];
  currentModelId?: string;
  currentProviderApiKeyId?: string;
  avgInputTokens?: number;
  avgOutputTokens?: number;
  totalSessions?: number;
}

export default function AgentModelSettingsEditor({
  agentId,
  models,
  providerApiKeys,
  currentModelId,
  currentProviderApiKeyId,
  avgInputTokens = 0,
  avgOutputTokens = 0,
  totalSessions = 0,
}: AgentModelSettingsEditorProps) {
  const router = useRouter();
  const [selectedModelId, setSelectedModelId] = useState(currentModelId || "");
  const [selectedProviderApiKeyId, setSelectedProviderApiKeyId] = useState(
    currentProviderApiKeyId || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const selectedProviderApiKey = useMemo(
    () =>
      providerApiKeys.find((providerApiKey) => {
        return providerApiKey.id === selectedProviderApiKeyId;
      }),
    [providerApiKeys, selectedProviderApiKeyId],
  );

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId),
    [models, selectedModelId],
  );

  const hasProviderApiKeys = providerApiKeys.length > 0;

  const modelsByProvider = useMemo(() => {
    return models.reduce((acc: Record<string, ModelRecord[]>, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {});
  }, [models]);

  const hasChanges =
    selectedModelId !== (currentModelId || "") ||
    selectedProviderApiKeyId !== (currentProviderApiKeyId || "");

  const currentModelIsIncompatible =
    !!selectedProviderApiKey &&
    !!selectedModel &&
    selectedModel.providerId !== selectedProviderApiKey.providerId;

  const canSave =
    hasProviderApiKeys &&
    !!selectedProviderApiKey &&
    !!selectedModel &&
    !currentModelIsIncompatible &&
    hasChanges;

  const formatCost = (cost: string | undefined | number) => {
    if (!cost) return "N/A";
    const numericCost = typeof cost === "string" ? parseFloat(cost) : cost;
    return `$${numericCost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return "0";
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(2)}K`;
    return tokens.toFixed(0);
  };

  const handleSave = async () => {
    if (!canSave || !selectedModelId || !selectedProviderApiKeyId) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await saUpdateAgentModel({
        agentId,
        modelId: selectedModelId,
        providerApiKeyId: selectedProviderApiKeyId,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update model settings");
        return;
      }

      toast.success("Model settings updated successfully");
      router.refresh();
    } catch {
      toast.error("An error occurred while updating model settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5" />
              Model Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xl">
              <Label htmlFor="provider-api-key">Provider API Key</Label>
              <Select
                value={selectedProviderApiKeyId || undefined}
                onValueChange={setSelectedProviderApiKeyId}
                disabled={!hasProviderApiKeys || isSaving}
              >
                <SelectTrigger id="provider-api-key">
                  <SelectValue placeholder="Select a provider API key..." />
                </SelectTrigger>
                <SelectContent>
                  {providerApiKeys.map((providerApiKey) => (
                    <SelectItem
                      key={providerApiKey.id}
                      value={providerApiKey.id}
                    >
                      {providerApiKey.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!hasProviderApiKeys && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No API keys available</AlertTitle>
                <AlertDescription>
                  This organisation does not have any provider API keys yet, so
                  model changes are currently disabled.
                </AlertDescription>
              </Alert>
            )}

            {hasProviderApiKeys && currentModelIsIncompatible && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Current model is incompatible</AlertTitle>
                <AlertDescription>
                  The selected API key only supports{" "}
                  {selectedProviderApiKey?.providerName} models. Choose a
                  compatible model before saving.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Selected key provider:{" "}
                <span className="font-medium text-foreground">
                  {selectedProviderApiKey?.providerName || "None"}
                </span>
              </span>
              <Button onClick={handleSave} disabled={!canSave || isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Model Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(modelsByProvider).map(([provider, groupedModels]) => {
            const sortedModels = [...groupedModels].sort((a, b) => {
              const totalCostA =
                parseFloat(a.inputTokenCost) + parseFloat(a.outputTokenCost);
              const totalCostB =
                parseFloat(b.inputTokenCost) + parseFloat(b.outputTokenCost);
              return totalCostB - totalCostA;
            });

            return (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    {provider}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedModels.map((model) => {
                      const isCurrentModel = model.id === currentModelId;
                      const isSelectedModel = model.id === selectedModelId;
                      const isCompatible =
                        !selectedProviderApiKey ||
                        model.providerId === selectedProviderApiKey.providerId;
                      const totalCost =
                        parseFloat(model.inputTokenCost) +
                        parseFloat(model.outputTokenCost);
                      const estimatedCostPerSession =
                        totalSessions > 0
                          ? (avgInputTokens *
                              parseFloat(model.inputTokenCost)) /
                              1000000 +
                            (avgOutputTokens *
                              parseFloat(model.outputTokenCost)) /
                              1000000
                          : null;

                      return (
                        <div
                          key={model.id}
                          className={`flex items-center justify-between gap-4 rounded-lg border p-3 transition-all ${
                            isSelectedModel
                              ? "bg-blue-500/10 border-blue-500/50 shadow-sm"
                              : isCurrentModel
                                ? "bg-blue-500/5 border-blue-500/30"
                                : "bg-card"
                          } ${
                            !isCompatible ? "opacity-70" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm truncate">
                                {model.model}
                              </p>
                              {isCurrentModel && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {isSelectedModel && (
                                <Badge variant="default" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                              {!isCompatible && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Incompatible key
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                Input: {formatCost(model.inputTokenCost)}/1M
                              </span>
                              <span>
                                Output: {formatCost(model.outputTokenCost)}/1M
                              </span>
                              <span>Total: {formatCost(totalCost)}/1M</span>
                              {estimatedCostPerSession !== null && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-semibold text-foreground flex items-center gap-1 cursor-help">
                                      Est. ${estimatedCostPerSession.toFixed(4)}
                                      /session
                                      <Info className="h-3 w-3" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">
                                      Estimated cost calculated using average
                                      tokens per session (
                                      {formatTokens(avgInputTokens)} input +{" "}
                                      {formatTokens(avgOutputTokens)} output)
                                      based on {totalSessions} past sessions.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isSelectedModel ? "default" : "outline"}
                            size="sm"
                            className="shrink-0"
                            onClick={() => setSelectedModelId(model.id)}
                            disabled={
                              !hasProviderApiKeys || !isCompatible || isSaving
                            }
                          >
                            {isSelectedModel ? "Selected" : "Choose Model"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
