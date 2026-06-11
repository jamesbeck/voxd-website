"use client";

import { saUpdateAgentConfig } from "@/actions/saUpdateAgentConfig";
import { saUpdateAgentTestConfig } from "@/actions/saUpdateAgentTestConfig";
import JsonSchemaEditor from "@/components/admin/JsonSchemaEditor";

interface JsonConfigEditorProps {
  agentId: string;
  initialData: unknown;
  configSchema: unknown;
  canEdit?: boolean;
  mode?: "production" | "test";
}

export default function JsonConfigEditor({
  agentId,
  initialData,
  configSchema,
  canEdit = true,
  mode = "production",
}: JsonConfigEditorProps) {
  const isTestMode = mode === "test";

  return (
    <JsonSchemaEditor
      editorPath={
        isTestMode
          ? `file:///agent-test-config/${agentId}.json`
          : `file:///agent-config/${agentId}.json`
      }
      initialData={initialData}
      schema={configSchema}
      readOnly={!canEdit}
      onSave={(config) =>
        isTestMode
          ? saUpdateAgentTestConfig({ agentId, config })
          : saUpdateAgentConfig({ agentId, config })
      }
      saveSuccessMessage={
        isTestMode
          ? "Test config saved successfully"
          : "Config saved successfully"
      }
      saveErrorMessage={
        isTestMode ? "Failed to save test config" : "Failed to save config"
      }
      validMessage={
        isTestMode
          ? "Test config is valid against the schema"
          : "Config is valid against the schema"
      }
      validationErrorTitle={
        isTestMode
          ? "Test config validation issues"
          : "Config validation issues"
      }
    />
  );
}
