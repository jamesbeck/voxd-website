"use client";

import { saUpdateUserData } from "@/actions/saUpdateUserData";
import JsonSchemaEditor from "@/components/admin/JsonSchemaEditor";

interface JsonDataEditorProps {
  userId: string;
  initialData: unknown;
  userDataSchema: unknown;
}

export default function JsonDataEditor({
  userId,
  initialData,
  userDataSchema,
}: JsonDataEditorProps) {
  return (
    <JsonSchemaEditor
      editorPath={`file:///chat-user-data/${userId}.json`}
      initialData={initialData}
      schema={userDataSchema}
      onSave={(data) => saUpdateUserData({ userId, data })}
      saveSuccessMessage="Data saved successfully"
      saveErrorMessage="Failed to save data"
      validMessage="User data is valid against the schema"
      validationErrorTitle="User data validation issues"
    />
  );
}
