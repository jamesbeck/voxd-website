"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saUpdateSessionData } from "@/actions/saUpdateSessionData";

interface SessionJsonDataEditorProps {
  sessionId: string;
  initialData: any;
}

export default function SessionJsonDataEditor({
  sessionId,
  initialData,
}: SessionJsonDataEditorProps) {
  const [data, setData] = useState(JSON.stringify(initialData, null, 2));
  const [isValid, setIsValid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    setData(value);
    setHasChanges(value !== JSON.stringify(initialData, null, 2));

    // Validate JSON
    try {
      JSON.parse(value);
      setIsValid(true);
    } catch (e) {
      setIsValid(false);
    }
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Invalid JSON format");
      return;
    }

    setIsSaving(true);
    try {
      const parsedData = JSON.parse(data);
      const result = await saUpdateSessionData({ sessionId, data: parsedData });

      if (result.success) {
        toast.success("Data saved successfully");
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save data");
      }
    } catch (error) {
      toast.error("Failed to save data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setData(JSON.stringify(initialData, null, 2));
    setIsValid(true);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {!isValid && (
            <p className="text-sm text-destructive">Invalid JSON format</p>
          )}
          {hasChanges && isValid && (
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="500px"
          defaultLanguage="json"
          value={data}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
