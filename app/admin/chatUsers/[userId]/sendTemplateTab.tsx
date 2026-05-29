"use client";

import { useEffect, useState } from "react";
import saGetTemplatesForUser from "@/actions/saGetTemplatesForUser";
import saSendTemplateMessage from "@/actions/saSendTemplateMessage";
import {
  extractTemplateParameters,
  generateTemplatePreview,
  TemplateRecord,
} from "@/lib/templateMessages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SendTemplateTab({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [parameterValues, setParameterValues] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      const result = await saGetTemplatesForUser({ userId });
      if (result.success && result.templates) {
        setTemplates(result.templates);
      } else {
        setError(result.error || "Failed to load templates");
      }
      setLoading(false);
    };
    loadTemplates();
  }, [userId]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const parameters = selectedTemplate
    ? extractTemplateParameters(selectedTemplate)
    : [];
  const preview = selectedTemplate
    ? generateTemplatePreview(selectedTemplate, parameterValues)
    : null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setParameterValues({}); // Reset parameter values when template changes
  };

  const handleParameterChange = (paramName: string, value: string) => {
    setParameterValues((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    try {
      const result = await saSendTemplateMessage({
        userId,
        templateId: selectedTemplate.id,
        parameterValues,
      });

      if (result.success) {
        toast.success("Template message sent successfully!");
        setParameterValues({});
        setSelectedTemplateId("");
      } else {
        toast.error(result.error || "Failed to send template");
      }
    } catch (err) {
      toast.error("An error occurred while sending the template");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>No approved templates available for this user&apos;s agent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template-select">Select Template</Label>
        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
          <SelectTrigger id="template-select" className="w-full max-w-md">
            <SelectValue placeholder="Choose a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} ({template.data?.language || "unknown"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parameter Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  This template has no parameters.
                </p>
              ) : (
                parameters.map((param) => (
                  <div key={param.name} className="space-y-1">
                    <Label htmlFor={`param-${param.name}`}>
                      {param.name}
                      {param.example && (
                        <span className="text-muted-foreground font-normal ml-2">
                          (e.g., {param.example})
                        </span>
                      )}
                    </Label>
                    <Input
                      id={`param-${param.name}`}
                      placeholder={param.example || `Enter ${param.name}`}
                      value={parameterValues[param.name] || ""}
                      onChange={(e) =>
                        handleParameterChange(param.name, e.target.value)
                      }
                    />
                  </div>
                ))
              )}

              <Button
                className="w-full mt-4"
                disabled={!selectedTemplate || sending}
                onClick={handleSendTemplate}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Send Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-2">
                {preview?.header && (
                  <div className="font-semibold text-sm">{preview.header}</div>
                )}
                {preview?.body && (
                  <div className="text-sm whitespace-pre-wrap">
                    {preview.body}
                  </div>
                )}
                {preview?.footer && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {preview.footer}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
