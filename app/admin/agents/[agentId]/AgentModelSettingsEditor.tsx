"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Cpu,
  Database,
  Info,
  KeyRound,
  Loader2,
  Save,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  inputTokenCost: string | null;
  outputTokenCost: string | null;
  embeddings: boolean;
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
  currentEmbeddingModelId?: string;
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
  currentEmbeddingModelId,
  currentProviderApiKeyId,
  avgInputTokens = 0,
  avgOutputTokens = 0,
  totalSessions = 0,
}: AgentModelSettingsEditorProps) {
  const router = useRouter();
  const currentProviderApiKey = providerApiKeys.find(
    (providerApiKey) => providerApiKey.id === currentProviderApiKeyId,
  );
  const currentModel = models.find((model) => model.id === currentModelId);
  const currentEmbeddingModel = models.find(
    (model) => model.id === currentEmbeddingModelId,
  );

  const initialProviderId =
    currentProviderApiKey?.providerId ||
    currentModel?.providerId ||
    currentEmbeddingModel?.providerId ||
    providerApiKeys[0]?.providerId ||
    models[0]?.providerId ||
    "";

  const [savedModelId, setSavedModelId] = useState(currentModelId || "");
  const [savedEmbeddingModelId, setSavedEmbeddingModelId] = useState(
    currentEmbeddingModelId || "",
  );
  const [savedProviderApiKeyId, setSavedProviderApiKeyId] = useState(
    currentProviderApiKeyId || "",
  );
  const [selectedProviderId, setSelectedProviderId] =
    useState(initialProviderId);
  const [selectedModelId, setSelectedModelId] = useState(currentModelId || "");
  const [selectedEmbeddingModelId, setSelectedEmbeddingModelId] = useState(
    currentEmbeddingModelId || "",
  );
  const [selectedProviderApiKeyId, setSelectedProviderApiKeyId] = useState(
    currentProviderApiKeyId || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showEmbeddingChangeDialog, setShowEmbeddingChangeDialog] =
    useState(false);

  const providerOptions = useMemo(() => {
    const uniqueProviders = new Map<string, string>();

    for (const providerApiKey of providerApiKeys) {
      uniqueProviders.set(
        providerApiKey.providerId,
        providerApiKey.providerName,
      );
    }

    for (const model of models) {
      uniqueProviders.set(model.providerId, model.provider);
    }

    return Array.from(uniqueProviders.entries())
      .map(([providerId, providerName]) => ({ providerId, providerName }))
      .sort((left, right) =>
        left.providerName.localeCompare(right.providerName),
      );
  }, [models, providerApiKeys]);

  const filteredProviderApiKeys = useMemo(
    () =>
      providerApiKeys.filter(
        (providerApiKey) => providerApiKey.providerId === selectedProviderId,
      ),
    [providerApiKeys, selectedProviderId],
  );

  const filteredChatModels = useMemo(
    () =>
      models
        .filter(
          (model) =>
            model.providerId === selectedProviderId && !model.embeddings,
        )
        .sort((left, right) => {
          const leftTotalCost =
            parseFloat(left.inputTokenCost || "0") +
            parseFloat(left.outputTokenCost || "0");
          const rightTotalCost =
            parseFloat(right.inputTokenCost || "0") +
            parseFloat(right.outputTokenCost || "0");

          return rightTotalCost - leftTotalCost;
        }),
    [models, selectedProviderId],
  );

  const filteredEmbeddingModels = useMemo(
    () =>
      models.filter(
        (model) => model.providerId === selectedProviderId && model.embeddings,
      ),
    [models, selectedProviderId],
  );

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

  const selectedEmbeddingModel = useMemo(
    () => models.find((model) => model.id === selectedEmbeddingModelId),
    [models, selectedEmbeddingModelId],
  );

  const hasProviderApiKeys = providerApiKeys.length > 0;
  const hasProviders = providerOptions.length > 0;
  const selectedProviderName =
    providerOptions.find(
      (provider) => provider.providerId === selectedProviderId,
    )?.providerName || "None";
  const isEmbeddingModelDirty =
    !!selectedEmbeddingModelId &&
    selectedEmbeddingModelId !== savedEmbeddingModelId;

  const formatCost = (cost: string | null | undefined | number) => {
    if (cost == null) return "N/A";
    const numericCost = typeof cost === "string" ? parseFloat(cost) : cost;
    return `$${numericCost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return "0";
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(2)}K`;
    return tokens.toFixed(0);
  };

  const persistSelection = async ({
    modelId,
    embeddingModelId,
    providerApiKeyId,
    successMessage,
  }: {
    modelId: string;
    embeddingModelId: string;
    providerApiKeyId: string;
    successMessage: string;
  }) => {
    if (!modelId || !embeddingModelId || !providerApiKeyId) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await saUpdateAgentModel({
        agentId,
        modelId,
        embeddingModelId,
        providerApiKeyId,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update model settings");
        return;
      }

      setSavedModelId(modelId);
      setSavedEmbeddingModelId(embeddingModelId);
      setSavedProviderApiKeyId(providerApiKeyId);
      setSelectedModelId(modelId);
      setSelectedEmbeddingModelId(embeddingModelId);
      setSelectedProviderApiKeyId(providerApiKeyId);

      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("An error occurred while updating model settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProviderId(providerId);

    setSelectedProviderApiKeyId((currentProviderApiKeyId) => {
      const currentKey = providerApiKeys.find(
        (providerApiKey) => providerApiKey.id === currentProviderApiKeyId,
      );
      return currentKey?.providerId === providerId
        ? currentProviderApiKeyId
        : "";
    });

    setSelectedModelId((currentSelectedModelId) => {
      const currentChatModel = models.find(
        (model) => model.id === currentSelectedModelId,
      );
      return currentChatModel?.providerId === providerId
        ? currentSelectedModelId
        : "";
    });

    setSelectedEmbeddingModelId((currentSelectedEmbeddingModelId) => {
      const currentEmbeddingChoice = models.find(
        (model) => model.id === currentSelectedEmbeddingModelId,
      );
      return currentEmbeddingChoice?.providerId === providerId &&
        currentEmbeddingChoice.embeddings
        ? currentSelectedEmbeddingModelId
        : "";
    });
  };

  const handleProviderApiKeyChange = (providerApiKeyId: string) => {
    setSelectedProviderApiKeyId(providerApiKeyId);
  };

  const handleChatModelSelection = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleEmbeddingModelSelection = (embeddingModelId: string) => {
    setSelectedEmbeddingModelId(embeddingModelId);
  };

  const currentSelectionIsValid = useMemo(() => {
    const nextProviderApiKey = providerApiKeys.find(
      (providerApiKey) => providerApiKey.id === selectedProviderApiKeyId,
    );
    const nextModel = models.find((model) => model.id === selectedModelId);
    const nextEmbeddingModel = models.find(
      (model) => model.id === selectedEmbeddingModelId,
    );

    if (
      !selectedProviderId ||
      !nextProviderApiKey ||
      !nextModel ||
      !nextEmbeddingModel ||
      nextModel.embeddings ||
      !nextEmbeddingModel.embeddings
    ) {
      return false;
    }

    return (
      nextProviderApiKey.providerId === selectedProviderId &&
      nextModel.providerId === selectedProviderId &&
      nextEmbeddingModel.providerId === selectedProviderId
    );
  }, [
    models,
    providerApiKeys,
    selectedEmbeddingModelId,
    selectedModelId,
    selectedProviderApiKeyId,
    selectedProviderId,
  ]);

  const hasUnsavedChanges =
    selectedProviderApiKeyId !== savedProviderApiKeyId ||
    selectedModelId !== savedModelId ||
    selectedEmbeddingModelId !== savedEmbeddingModelId;

  const saveMessage = useMemo(() => {
    if (
      selectedProviderApiKeyId !== savedProviderApiKeyId &&
      selectedModelId === savedModelId &&
      selectedEmbeddingModelId === savedEmbeddingModelId
    ) {
      return "Provider API key updated successfully";
    }

    if (
      selectedModelId !== savedModelId &&
      selectedEmbeddingModelId === savedEmbeddingModelId &&
      selectedProviderApiKeyId === savedProviderApiKeyId
    ) {
      return "Chat response model updated successfully";
    }

    if (
      selectedEmbeddingModelId !== savedEmbeddingModelId &&
      selectedModelId === savedModelId &&
      selectedProviderApiKeyId === savedProviderApiKeyId
    ) {
      return "Embedding model updated successfully";
    }

    return "Model settings updated successfully";
  }, [
    savedEmbeddingModelId,
    savedModelId,
    savedProviderApiKeyId,
    selectedEmbeddingModelId,
    selectedModelId,
    selectedProviderApiKeyId,
  ]);

  const handleSave = async () => {
    if (!currentSelectionIsValid || !hasUnsavedChanges) {
      return;
    }

    if (isEmbeddingModelDirty) {
      setShowEmbeddingChangeDialog(true);
      return;
    }

    await persistSelection({
      modelId: selectedModelId,
      embeddingModelId: selectedEmbeddingModelId,
      providerApiKeyId: selectedProviderApiKeyId,
      successMessage: saveMessage,
    });
  };

  const confirmEmbeddingModelSave = async () => {
    setShowEmbeddingChangeDialog(false);

    await persistSelection({
      modelId: selectedModelId,
      embeddingModelId: selectedEmbeddingModelId,
      providerApiKeyId: selectedProviderApiKeyId,
      successMessage: saveMessage,
    });
  };

  const getEstimatedCostPerSession = (model: ModelRecord) => {
    if (totalSessions <= 0) {
      return null;
    }

    return (
      (avgInputTokens * parseFloat(model.inputTokenCost || "0")) / 1000000 +
      (avgOutputTokens * parseFloat(model.outputTokenCost || "0")) / 1000000
    );
  };

  const renderModelSelectLabel = (model: ModelRecord) => {
    const estimatedCostPerSession = getEstimatedCostPerSession(model);

    return (
      <div className="flex min-w-0 flex-col gap-0.5 px-1 py-1.5">
        <span className="truncate font-medium">{model.model}</span>
        <span className="text-xs text-muted-foreground">
          Input {formatCost(model.inputTokenCost)}/1M
          {model.outputTokenCost != null
            ? ` · Output ${formatCost(model.outputTokenCost)}/1M`
            : ""}
          {estimatedCostPerSession != null
            ? ` · Est. ${formatCost(estimatedCostPerSession)}/session`
            : ""}
        </span>
      </div>
    );
  };

  const renderEmbeddingModelSelectLabel = (model: ModelRecord) => {
    return (
      <div className="flex min-w-0 flex-col px-1 py-1.5">
        <span className="truncate font-medium">{model.model}</span>
      </div>
    );
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
              <Label htmlFor="provider-filter">Provider</Label>
              <Select
                value={selectedProviderId || undefined}
                onValueChange={handleProviderChange}
                disabled={!hasProviders || isSaving}
              >
                <SelectTrigger
                  id="provider-filter"
                  className="w-full text-left"
                >
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((provider) => (
                    <SelectItem
                      key={provider.providerId}
                      value={provider.providerId}
                    >
                      {provider.providerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-w-xl">
              <Label htmlFor="provider-api-key">Provider API Key</Label>
              <Select
                value={selectedProviderApiKeyId || undefined}
                onValueChange={handleProviderApiKeyChange}
                disabled={
                  !hasProviderApiKeys || !selectedProviderId || isSaving
                }
              >
                <SelectTrigger
                  id="provider-api-key"
                  className="w-full text-left"
                >
                  <SelectValue placeholder="Select a provider API key..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProviderApiKeys.map((providerApiKey) => (
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

            {!hasProviders && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No providers available</AlertTitle>
                <AlertDescription>
                  No enabled providers or models are available for this agent
                  yet.
                </AlertDescription>
              </Alert>
            )}

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

            {selectedProviderId && filteredProviderApiKeys.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No API keys for this provider</AlertTitle>
                <AlertDescription>
                  This organisation does not have a {selectedProviderName} API
                  key yet, so model changes for this provider cannot be saved.
                </AlertDescription>
              </Alert>
            )}

            {selectedProviderId && filteredEmbeddingModels.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No embedding models for this provider</AlertTitle>
                <AlertDescription>
                  There are no embedding-capable models available for{" "}
                  {selectedProviderName}.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Choose the provider, API key, chat response model, and embedding
                model, then save the combination explicitly.
              </span>
              <span>
                Selected provider:{" "}
                <span className="font-medium text-foreground">
                  {selectedProviderName}
                </span>
              </span>
              {hasUnsavedChanges && (
                <span className="font-medium text-foreground">
                  Unsaved changes
                </span>
              )}
              {isSaving && (
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Chat Response Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Controls the model used to generate the agent&apos;s chat
                responses and the session cost profile.
              </p>
              <div className="space-y-2">
                <Label htmlFor="chat-model">Chat Response Model</Label>
                <Select
                  value={selectedModelId || undefined}
                  onValueChange={handleChatModelSelection}
                  disabled={!selectedProviderId || isSaving}
                >
                  <SelectTrigger
                    id="chat-model"
                    className="h-auto min-h-12 w-full py-2 text-left"
                  >
                    <SelectValue placeholder="Select a chat response model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChatModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {renderModelSelectLabel(model)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Embedding Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Controls the model used to generate embeddings for semantic
                knowledge search and user memory.
              </p>
              <div className="space-y-2">
                <Label htmlFor="embedding-model">Embedding Model</Label>
                <Select
                  value={selectedEmbeddingModelId || undefined}
                  onValueChange={handleEmbeddingModelSelection}
                  disabled={!selectedProviderId || isSaving}
                >
                  <SelectTrigger
                    id="embedding-model"
                    className="w-full text-left"
                  >
                    <SelectValue placeholder="Select an embedding model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmbeddingModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {renderEmbeddingModelSelectLabel(model)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 border-t pt-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={
                !currentSelectionIsValid || !hasUnsavedChanges || isSaving
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Model Settings
                </>
              )}
            </Button>
            {!currentSelectionIsValid && (
              <span className="text-sm text-muted-foreground">
                Select a compatible provider key, chat model, and embedding
                model to save.
              </span>
            )}
          </div>
          {isEmbeddingModelDirty && (
            <div className="text-sm text-muted-foreground">
              Saving will require confirmation because the embedding model has
              changed.
            </div>
          )}
        </div>

        <AlertDialog
          open={showEmbeddingChangeDialog}
          onOpenChange={setShowEmbeddingChangeDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-destructive" />
                Confirm Embedding Model Change
              </AlertDialogTitle>
              <AlertDialogDescription>
                Because you are about to change the model used for embeddings,
                you will need to re-generate the knowledge base embeddings and
                chat user memory embeddings for this agent. Continue only if you
                are ready to re-generate them after saving.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmEmbeddingModelSave}
                disabled={isSaving}
              >
                Continue And Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
