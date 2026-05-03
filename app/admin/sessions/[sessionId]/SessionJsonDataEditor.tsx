"use client";

import { saUpdateSessionData } from "@/actions/saUpdateSessionData";
import JsonSchemaEditor from "@/components/admin/JsonSchemaEditor";

interface SessionJsonDataEditorProps {
  sessionId: string;
  initialData: unknown;
  sessionDataSchema: unknown;
}

export default function SessionJsonDataEditor({
  sessionId,
  initialData,
  sessionDataSchema,
}: SessionJsonDataEditorProps) {
  return (
    <JsonSchemaEditor
      editorPath={`file:///session-data/${sessionId}.json`}
      initialData={initialData}
      schema={sessionDataSchema}
      onSave={(data) => saUpdateSessionData({ sessionId, data })}
      saveSuccessMessage="Data saved successfully"
      saveErrorMessage="Failed to save data"
      validMessage="Session data is valid against the schema"
      validationErrorTitle="Session data validation issues"
    />
  );
}
