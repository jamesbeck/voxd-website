"use client";

import JsonConfigEditor from "./JsonConfigEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentConfigTabProps {
  agentId: string;
  canEdit: boolean;
  config: unknown;
  configSchema: unknown;
  testConfig: unknown;
  testConfigSchema: unknown;
}

export default function AgentConfigTab({
  agentId,
  canEdit,
  config,
  configSchema,
  testConfig,
  testConfigSchema,
}: AgentConfigTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Toggle between production and test config to edit each payload
        independently.
      </p>
      <Tabs defaultValue="production" className="gap-4">
        <TabsList>
          <TabsTrigger value="production">Production Config</TabsTrigger>
          <TabsTrigger value="test">Test Config</TabsTrigger>
        </TabsList>
        <TabsContent value="production">
          <div className="space-y-4">
            {config ? (
              <JsonConfigEditor
                agentId={agentId}
                initialData={config}
                configSchema={configSchema}
                canEdit={canEdit}
                mode="production"
              />
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  No production config stored for this agent.
                </p>
                <JsonConfigEditor
                  agentId={agentId}
                  initialData={{}}
                  configSchema={configSchema}
                  canEdit={canEdit}
                  mode="production"
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="test">
          <div className="space-y-4">
            {testConfig ? (
              <JsonConfigEditor
                agentId={agentId}
                initialData={testConfig}
                configSchema={testConfigSchema}
                canEdit={canEdit}
                mode="test"
              />
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  No test config stored for this agent.
                </p>
                <JsonConfigEditor
                  agentId={agentId}
                  initialData={{}}
                  configSchema={testConfigSchema}
                  canEdit={canEdit}
                  mode="test"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
