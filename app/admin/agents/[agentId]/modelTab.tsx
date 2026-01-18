import H2 from "@/components/adminui/H2";
import saGetAllModels from "@/actions/saGetAllModels";
import saGetAgentUsageStats from "@/actions/saGetAgentUsageStats";
import {
  Cpu,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Activity,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChangeModelButton from "./ChangeModelButton";

interface ModelTabProps {
  agentId: string;
  currentModelId?: string;
  currentModelName?: string;
  currentModelProvider?: string;
  currentInputTokenCost?: string;
  currentOutputTokenCost?: string;
}

interface Model {
  id: string;
  provider: string;
  model: string;
  inputTokenCost: string;
  outputTokenCost: string;
}

export default async function ModelTab({
  agentId,
  currentModelId,
  currentModelName,
  currentModelProvider,
  currentInputTokenCost,
  currentOutputTokenCost,
}: ModelTabProps) {
  const modelsResponse = await saGetAllModels();
  const allModels = modelsResponse.success ? modelsResponse.data : [];

  const usageStatsResponse = await saGetAgentUsageStats(agentId);
  const usageStats = usageStatsResponse.success
    ? usageStatsResponse.data
    : null;

  // Group models by provider
  const modelsByProvider = allModels.reduce(
    (acc: Record<string, Model[]>, model: Model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, Model[]>
  );

  // Format cost for display
  const formatCost = (cost: string | undefined | number) => {
    if (!cost) return "N/A";
    const numCost = typeof cost === "string" ? parseFloat(cost) : cost;
    return `$${numCost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return "0";
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(2)}K`;
    return tokens.toFixed(0);
  };

  return (
    <div className="space-y-8">
      {/* Usage Statistics */}
      <div>
        <H2 className="mb-4">Usage Statistics</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          {/* Average Token Usage Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Avg. Token Usage Per Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {usageStats && usageStats.totalSessions > 0 ? (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Input Tokens
                      </p>
                      <p className="text-2xl font-bold">
                        {formatTokens(usageStats.avgInputTokens)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Output Tokens
                      </p>
                      <p className="text-2xl font-bold">
                        {formatTokens(usageStats.avgOutputTokens)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>Based on {usageStats.totalSessions} sessions</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No usage data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cost Overview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cost Per Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {usageStats && usageStats.totalSessions > 0 ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Average Cost
                    </p>
                    <p className="text-2xl font-bold">
                      ${usageStats.avgCostPerSession.toFixed(4)}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>Based on {usageStats.totalSessions} sessions</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No cost data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Breakdown by Model */}
      {usageStats &&
        usageStats.modelBreakdown &&
        usageStats.modelBreakdown.length > 0 && (
          <div>
            <H2 className="mb-4">Cost Breakdown by Model</H2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usageStats.modelBreakdown.map((modelData) => (
                <Card key={modelData.modelId || modelData.modelName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {modelData.modelName}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit">
                      {modelData.provider}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Avg. Cost Per Session
                      </p>
                      <p className="text-2xl font-bold">
                        ${modelData.avgCostPerSession.toFixed(4)}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {modelData.sessionCount} session
                        {modelData.sessionCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      {/* All Models by Provider */}
      <div>
        <H2 className="mb-4">All Available Models</H2>
        <TooltipProvider>
          <div className="space-y-6">
            {Object.entries(modelsByProvider).map(([provider, models]) => {
              // Sort models by total cost (input + output), most expensive first
              const sortedModels = [...(models as Model[])].sort((a, b) => {
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
                      {sortedModels.map((model: Model) => {
                        const isCurrentModel = model.id === currentModelId;
                        const totalCost =
                          parseFloat(model.inputTokenCost) +
                          parseFloat(model.outputTokenCost);

                        // Calculate estimated cost per session based on average usage
                        const estimatedCostPerSession =
                          usageStats && usageStats.totalSessions > 0
                            ? (usageStats.avgInputTokens *
                                parseFloat(model.inputTokenCost)) /
                                1000000 +
                              (usageStats.avgOutputTokens *
                                parseFloat(model.outputTokenCost)) /
                                1000000
                            : null;

                        return (
                          <div
                            key={model.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isCurrentModel
                                ? "bg-blue-500/10 border-blue-500/50 shadow-sm"
                                : "bg-card hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">
                                  {model.model}
                                </p>
                                {isCurrentModel && (
                                  <Badge
                                    variant="default"
                                    className="text-xs shrink-0"
                                  >
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                                        Est. $
                                        {estimatedCostPerSession.toFixed(4)}
                                        /session
                                        <Info className="h-3 w-3" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-sm">
                                        Estimated cost calculated using average
                                        tokens per session (
                                        {formatTokens(
                                          usageStats?.avgInputTokens || 0
                                        )}{" "}
                                        input +{" "}
                                        {formatTokens(
                                          usageStats?.avgOutputTokens || 0
                                        )}{" "}
                                        output) multiplied by this model's token
                                        costs. Based on{" "}
                                        {usageStats?.totalSessions || 0} past
                                        sessions.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>

                            {!isCurrentModel && (
                              <ChangeModelButton
                                agentId={agentId}
                                modelId={model.id}
                                modelName={model.model}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
