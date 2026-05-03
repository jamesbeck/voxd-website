"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { validateAgentConfig } from "@/lib/validateAgentConfig";
import { ServerActionResponse } from "@/types/types";

interface JsonSchemaEditorProps {
  editorPath: string;
  initialData: unknown;
  schema: unknown;
  onSave: (data: unknown) => Promise<ServerActionResponse>;
  saveSuccessMessage: string;
  saveErrorMessage: string;
  validMessage: string;
  validationErrorTitle: string;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function getEditorValidationState(value: string, schema: unknown) {
  try {
    const parsedValue = JSON.parse(value);
    const validationResult = validateAgentConfig({
      schema,
      config: parsedValue,
    });

    if (validationResult.valid) {
      return {
        fieldErrors: {},
        parseError: null,
        schemaError: null,
      };
    }

    return {
      fieldErrors: validationResult.fieldErrors || {},
      parseError: null,
      schemaError: validationResult.fieldErrors ? null : validationResult.error,
    };
  } catch {
    return {
      fieldErrors: {},
      parseError: "Invalid JSON format",
      schemaError: null,
    };
  }
}

export default function JsonSchemaEditor({
  editorPath,
  initialData,
  schema,
  onSave,
  saveSuccessMessage,
  saveErrorMessage,
  validMessage,
  validationErrorTitle,
}: JsonSchemaEditorProps) {
  const initialJson = formatJson(initialData);
  const initialValidationState = getEditorValidationState(initialJson, schema);
  const [savedData, setSavedData] = useState(initialJson);
  const [data, setData] = useState(initialJson);
  const [parseError, setParseError] = useState<string | null>(
    initialValidationState.parseError,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [clientFieldErrors, setClientFieldErrors] = useState<
    Record<string, string>
  >(initialValidationState.fieldErrors);
  const [schemaError, setSchemaError] = useState<string | null>(
    initialValidationState.schemaError,
  );
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});
  const hasValidationErrors = Object.keys(clientFieldErrors).length > 0;
  const hasMonacoSchema = typeof schema === "object" && schema !== null;
  const isBlocked = !!schemaError || !!parseError || hasValidationErrors;

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    const nextValidationState = getEditorValidationState(value, schema);

    setData(value);
    setHasChanges(value !== savedData);
    setClientFieldErrors(nextValidationState.fieldErrors);
    setSchemaError(nextValidationState.schemaError);
    setServerFieldErrors({});
    setParseError(nextValidationState.parseError);
  };

  const handleFormat = () => {
    try {
      const formattedData = formatJson(JSON.parse(data));
      const nextValidationState = getEditorValidationState(
        formattedData,
        schema,
      );

      setData(formattedData);
      setHasChanges(formattedData !== savedData);
      setClientFieldErrors(nextValidationState.fieldErrors);
      setSchemaError(nextValidationState.schemaError);
      setParseError(nextValidationState.parseError);
      setServerFieldErrors({});
    } catch {
      toast.error("Fix the JSON syntax before formatting");
    }
  };

  const handleSave = async () => {
    if (parseError) {
      toast.error("Invalid JSON format");
      return;
    }

    if (schemaError) {
      toast.error(schemaError);
      return;
    }

    if (hasValidationErrors) {
      toast.error("Fix the schema validation errors before saving");
      return;
    }

    setIsSaving(true);
    try {
      const parsedData = JSON.parse(data);
      const result = await onSave(parsedData);

      if (result.success) {
        const formattedData = formatJson(parsedData);
        setData(formattedData);
        setSavedData(formattedData);
        toast.success(saveSuccessMessage);
        setHasChanges(false);
        setClientFieldErrors({});
        setSchemaError(null);
        setServerFieldErrors({});
      } else {
        setServerFieldErrors(result.fieldErrors || {});
        toast.error(result.error || saveErrorMessage);
      }
    } catch {
      toast.error(saveErrorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const nextValidationState = getEditorValidationState(savedData, schema);

    setData(savedData);
    setClientFieldErrors(nextValidationState.fieldErrors);
    setSchemaError(nextValidationState.schemaError);
    setParseError(nextValidationState.parseError);
    setHasChanges(false);
    setServerFieldErrors({});
  };

  const displayErrors = [
    ...Object.entries(clientFieldErrors).map(([path, message]) =>
      path === "$" ? message : `${path}: ${message}`,
    ),
    ...Object.entries(serverFieldErrors).map(([path, message]) =>
      path === "$" ? message : `${path}: ${message}`,
    ),
  ];

  const uniqueDisplayErrors = Array.from(new Set(displayErrors));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {!!parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
          {!parseError && !!schemaError && (
            <p className="text-sm text-destructive">{schemaError}</p>
          )}
          {!parseError && !schemaError && hasValidationErrors && (
            <p className="text-sm text-destructive">
              {Object.keys(clientFieldErrors).length} schema validation
              {Object.keys(clientFieldErrors).length === 1
                ? " error"
                : " errors"}
            </p>
          )}
          {hasChanges &&
            !parseError &&
            !schemaError &&
            !hasValidationErrors && (
              <p className="text-sm text-muted-foreground">Unsaved changes</p>
            )}
          {!hasChanges &&
            !parseError &&
            !schemaError &&
            !hasValidationErrors && (
              <p className="text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4" />
                {validMessage}
              </p>
            )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleFormat}
            variant="outline"
            disabled={isSaving || !!parseError || !!schemaError}
          >
            Format JSON
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isBlocked || !hasChanges || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="500px"
          defaultLanguage="json"
          path={editorPath}
          value={data}
          onChange={handleEditorChange}
          beforeMount={(monaco) => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
              allowComments: false,
              enableSchemaRequest: false,
              schemaValidation: "error",
              schemas: hasMonacoSchema
                ? [
                    {
                      fileMatch: [editorPath],
                      schema,
                      uri: `${editorPath}.schema.json`,
                    },
                  ]
                : [],
              validate: true,
            });
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            formatOnPaste: true,
            formatOnType: true,
            readOnly: !!schemaError,
            scrollBeyondLastLine: false,
            quickSuggestions: {
              comments: false,
              other: true,
              strings: true,
            },
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
      {!!uniqueDisplayErrors.length && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>{validationErrorTitle}</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {uniqueDisplayErrors.map((message) => (
                <p key={message} className="text-sm">
                  {message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
