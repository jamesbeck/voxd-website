"use client";

import { saUpdateAgentConfig } from "@/actions/saUpdateAgentConfig";
import JsonSchemaEditor from "@/components/admin/JsonSchemaEditor";

interface JsonConfigEditorProps {
  agentId: string;
  initialData: unknown;
  configSchema: unknown;
}

export default function JsonConfigEditor({
  agentId,
  initialData,
  configSchema,
}: JsonConfigEditorProps) {
  return (
    <JsonSchemaEditor
      editorPath={`file:///agent-config/${agentId}.json`}
      initialData={initialData}
      schema={configSchema}
      onSave={(config) => saUpdateAgentConfig({ agentId, config })}
      saveSuccessMessage="Config saved successfully"
      saveErrorMessage="Failed to save config"
      validMessage="Config is valid against the schema"
      validationErrorTitle="Config validation issues"
    />
  );
}
