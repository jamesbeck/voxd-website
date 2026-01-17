import DataCard, { DataItem } from "@/components/adminui/DataCard";
import H2 from "@/components/adminui/H2";
import saGetAllModels from "@/actions/saGetAllModels";
import { Cpu, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModelTabProps {
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
  currentModelId,
  currentModelName,
  currentModelProvider,
  currentInputTokenCost,
  currentOutputTokenCost,
}: ModelTabProps) {
  const modelsResponse = await saGetAllModels();
  const allModels = modelsResponse.success ? modelsResponse.data : [];

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
  const formatCost = (cost: string | undefined) => {
    if (!cost) return "N/A";
    const numCost = parseFloat(cost);
    return `$${numCost.toFixed(6)} / 1M tokens`;
  };

  return (
    <div className="space-y-8">
      {/* Current Model Section */}
      {currentModelId && (
        <div>
          <H2 className="mb-4">Current Model</H2>
          <DataCard
            items={
              [
                {
                  label: "Model Name",
                  value: currentModelName || "Unknown",
                  icon: <Cpu className="h-4 w-4" />,
                  variant: "info",
                },
                {
                  label: "Provider",
                  value: currentModelProvider || "Unknown",
                  icon: <Cpu className="h-4 w-4" />,
                  variant: "info",
                },
                {
                  label: "Input Token Cost",
                  value: formatCost(currentInputTokenCost),
                  icon: <DollarSign className="h-4 w-4" />,
                  variant: "default",
                },
                {
                  label: "Output Token Cost",
                  value: formatCost(currentOutputTokenCost),
                  icon: <DollarSign className="h-4 w-4" />,
                  variant: "default",
                },
              ].filter(Boolean) as DataItem[]
            }
          />
        </div>
      )}

      {/* All Models by Provider */}
      <div>
        <H2 className="mb-4">All Available Models</H2>
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
                  <div className="space-y-3">
                    {sortedModels.map((model: Model) => {
                      const isCurrentModel = model.id === currentModelId;
                      return (
                        <div
                          key={model.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            isCurrentModel
                              ? "bg-blue-500/10 border-blue-500/30"
                              : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{model.model}</p>
                              {isCurrentModel && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                Input Cost
                              </p>
                              <p className="font-mono">
                                {formatCost(model.inputTokenCost)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                Output Cost
                              </p>
                              <p className="font-mono">
                                {formatCost(model.outputTokenCost)}
                              </p>
                            </div>
                          </div>
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
    </div>
  );
}
