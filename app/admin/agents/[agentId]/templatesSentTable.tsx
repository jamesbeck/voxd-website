"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import saGetChatUserQueries from "@/actions/saGetChatUserQueries";
import saGetTemplateSendGroupPreview from "@/actions/saGetTemplateSendGroupPreview";
import saGetTemplatesForAgent from "@/actions/saGetTemplatesForAgent";
import saSendAgentTemplateMessage from "@/actions/saSendAgentTemplateMessage";
import Alert from "@/components/admin/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedChatUserQuery } from "@/lib/chatUserQueryDefinition";
import {
  extractTemplateParameters,
  generateTemplatePreview,
  getTemplateFieldSourceOptionsForChatUsers,
  resolveTemplateParameterValues,
  TemplateChatUserRecord,
  TemplateParameterMappings,
  TemplateRecord,
} from "@/lib/templateMessages";

const EMPTY_SOURCE = "__none__";

const TemplatesSentTable = ({ agentId }: { agentId: string }) => {
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [loadingPreviewUsers, setLoadingPreviewUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedChatUserQuery[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [previewUsers, setPreviewUsers] = useState<TemplateChatUserRecord[]>(
    [],
  );
  const [recipientCount, setRecipientCount] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [excludedUsersWithoutWhatsApp, setExcludedUsersWithoutWhatsApp] =
    useState(0);
  const [selectedQueryName, setSelectedQueryName] = useState("");
  const [mappings, setMappings] = useState<TemplateParameterMappings>({});
  useEffect(() => {
    const loadQueries = async () => {
      setLoadingQueries(true);
      const result = await saGetChatUserQueries({ agentId });

      if (!result.success) {
        toast.error(result.error || "Failed to load saved groups");
      } else if (result.data) {
        setSavedQueries(result.data as SavedChatUserQuery[]);
      } else {
        setSavedQueries([]);
      }

      setLoadingQueries(false);
    };

    const loadTemplates = async () => {
      setLoadingTemplates(true);
      const result = await saGetTemplatesForAgent({ agentId });
      if (!result.success) {
        toast.error(result.error || "Failed to load templates");
      } else if (result.templates) {
        setTemplates(result.templates);
      } else {
        setTemplates([]);
      }
      setLoadingTemplates(false);
    };

    loadQueries();
    loadTemplates();
  }, [agentId]);

  const loadPreviewUsers = async (queryId: string) => {
    if (!queryId) {
      setPreviewUsers([]);
      setRecipientCount(0);
      setTotalMatches(0);
      setExcludedUsersWithoutWhatsApp(0);
      setSelectedQueryName("");
      return;
    }

    setLoadingPreviewUsers(true);
    const result = await saGetTemplateSendGroupPreview({
      agentId,
      queryId,
      sampleSize: 3,
    });

    if (!result.success) {
      setPreviewUsers([]);
      setRecipientCount(0);
      setTotalMatches(0);
      setExcludedUsersWithoutWhatsApp(0);
      setSelectedQueryName("");
      toast.error(result.error || "Failed to load preview users");
    } else {
      setPreviewUsers(result.previewUsers || []);
      setRecipientCount(result.recipientCount || 0);
      setTotalMatches(result.totalMatches || 0);
      setExcludedUsersWithoutWhatsApp(result.excludedUsersWithoutWhatsApp || 0);
      setSelectedQueryName(result.queryName || "");
    }

    setLoadingPreviewUsers(false);
  };

  useEffect(() => {
    void loadPreviewUsers(selectedQueryId);
  }, [agentId, selectedQueryId]);

  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const parameters = useMemo(
    () => (selectedTemplate ? extractTemplateParameters(selectedTemplate) : []),
    [selectedTemplate],
  );

  useEffect(() => {
    setMappings((currentMappings) => {
      if (!selectedTemplate) {
        return Object.keys(currentMappings).length === 0 ? currentMappings : {};
      }

      const nextMappings: TemplateParameterMappings = {};
      parameters.forEach((parameter) => {
        nextMappings[parameter.name] = currentMappings[parameter.name] || {
          sourceKey: undefined,
          overrideValue: "",
        };
      });

      const currentKeys = Object.keys(currentMappings);
      const nextKeys = Object.keys(nextMappings);
      const hasSameKeys =
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => key in currentMappings);

      if (hasSameKeys) {
        const hasSameValues = nextKeys.every((key) => {
          const current = currentMappings[key];
          const next = nextMappings[key];
          return (
            current?.sourceKey === next?.sourceKey &&
            current?.overrideValue === next?.overrideValue
          );
        });

        if (hasSameValues) {
          return currentMappings;
        }
      }

      return nextMappings;
    });
  }, [selectedTemplateId, parameters]);

  const sourceOptions = useMemo(
    () => getTemplateFieldSourceOptionsForChatUsers(previewUsers),
    [previewUsers],
  );

  const previewCards = useMemo(
    () =>
      selectedTemplate
        ? previewUsers.map((previewUser) => ({
            chatUser: previewUser,
            resolvedValues: resolveTemplateParameterValues(
              mappings,
              previewUser,
            ),
            preview: generateTemplatePreview(
              selectedTemplate,
              resolveTemplateParameterValues(mappings, previewUser),
            ),
          }))
        : [],
    [mappings, previewUsers, selectedTemplate],
  );

  const handleMappingChange = (
    parameterName: string,
    nextMapping: Partial<TemplateParameterMappings[string]>,
  ) => {
    setMappings((currentMappings) => ({
      ...currentMappings,
      [parameterName]: {
        ...currentMappings[parameterName],
        ...nextMapping,
      },
    }));
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !selectedQueryId || recipientCount === 0) {
      return;
    }

    setSending(true);
    try {
      const result = await saSendAgentTemplateMessage({
        agentId,
        queryId: selectedQueryId,
        templateId: selectedTemplate.id,
        mappings,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to send template");
        return;
      }

      toast.success(
        `Template sent to ${result.data?.successCount || 0} of ${result.data?.recipientCount || recipientCount} users.`,
      );
      if (result.data?.excludedUsersWithoutWhatsApp) {
        const excludedLabel =
          result.data.excludedUsersWithoutWhatsApp === 1
            ? "user was"
            : "users were";
        const excludedReason =
          result.data.excludedUsersWithoutWhatsApp === 1
            ? "that user does not have a WhatsApp number"
            : "those users do not have WhatsApp numbers";

        toast.warning(
          `${result.data.excludedUsersWithoutWhatsApp} ${excludedLabel} excluded because ${excludedReason}.`,
        );
      }
      if (result.data?.partialFailure) {
        toast.warning(result.data.partialFailure);
      }
      if (result.data?.storageWarning) {
        toast.warning(result.data.storageWarning);
      }
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Template</Label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : (
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger id="template-select">
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
              )}
            </div>

            <div className="space-y-2">
              <Label>Saved Group</Label>
              {loadingQueries ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading saved groups...
                </div>
              ) : (
                <Select
                  value={selectedQueryId}
                  onValueChange={setSelectedQueryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a saved group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedQueries.map((query) => (
                      <SelectItem key={query.id} value={query.id}>
                        {query.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedQueryId && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {selectedQueryName || "Selected group"}
                  </div>
                  <div className="text-muted-foreground">
                    {loadingPreviewUsers
                      ? "Resolving group members..."
                      : `${recipientCount} ${recipientCount === 1 ? "recipient" : "recipients"} ready to send${excludedUsersWithoutWhatsApp > 0 ? `, ${excludedUsersWithoutWhatsApp} excluded` : ""}`}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadPreviewUsers(selectedQueryId)}
                  disabled={loadingPreviewUsers}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh sample
                </Button>
              </div>
            )}

            {loadingPreviewUsers && selectedQueryId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading preview users...
              </div>
            )}

            {selectedTemplate && selectedQueryId && (
              <div className="space-y-4">
                {parameters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This template has no parameters.
                  </p>
                ) : (
                  parameters.map((parameter) => {
                    const mapping = mappings[parameter.name] || {};
                    const resolvedValue =
                      previewCards[0]?.resolvedValues[parameter.name] || "";

                    return (
                      <div
                        key={parameter.name}
                        className="space-y-2 rounded-md border p-3"
                      >
                        <div>
                          <Label>{parameter.name}</Label>
                          {parameter.example && (
                            <p className="text-xs text-muted-foreground">
                              Example: {parameter.example}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Mapped Field</Label>
                            <Select
                              value={mapping.sourceKey || EMPTY_SOURCE}
                              onValueChange={(value) =>
                                handleMappingChange(parameter.name, {
                                  sourceKey:
                                    value === EMPTY_SOURCE ? undefined : value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a chat user field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={EMPTY_SOURCE}>
                                  No field mapping
                                </SelectItem>
                                {sourceOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label>Manual Override</Label>
                            <Input
                              placeholder="Optional override"
                              value={mapping.overrideValue || ""}
                              onChange={(event) =>
                                handleMappingChange(parameter.name, {
                                  overrideValue: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Sample value: {resolvedValue || "No value selected"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {selectedTemplate &&
              selectedQueryId &&
              excludedUsersWithoutWhatsApp > 0 && (
                <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                  {excludedUsersWithoutWhatsApp}{" "}
                  {excludedUsersWithoutWhatsApp === 1
                    ? "user has"
                    : "users have"}{" "}
                  been excluded because{" "}
                  {excludedUsersWithoutWhatsApp === 1
                    ? "that user does not have a WhatsApp number"
                    : "those users do not have WhatsApp numbers"}
                  .
                </p>
              )}

            {selectedQueryId && !loadingPreviewUsers && totalMatches === 0 && (
              <p className="text-sm text-destructive">
                This saved group currently matches no users. Update the group or
                choose another one before sending.
              </p>
            )}

            {selectedQueryId &&
              !loadingPreviewUsers &&
              totalMatches > 0 &&
              recipientCount === 0 && (
                <p className="text-sm text-destructive">
                  This saved group has no sendable recipients because none of
                  the matched users have a WhatsApp number.
                </p>
              )}

            <Alert
              title="Send template to this group?"
              description={`This will immediately send this WhatsApp template to ${recipientCount} ${recipientCount === 1 ? "recipient" : "recipients"}.${excludedUsersWithoutWhatsApp > 0 ? ` ${excludedUsersWithoutWhatsApp} ${excludedUsersWithoutWhatsApp === 1 ? "matched user will be" : "matched users will be"} excluded because ${excludedUsersWithoutWhatsApp === 1 ? "that user does not have a WhatsApp number" : "those users do not have WhatsApp numbers"}.` : ""} This action cannot be undone.`}
              actionText={
                recipientCount === 1
                  ? "Send to 1 recipient"
                  : `Send to ${recipientCount} recipients`
              }
              destructive
              onAction={handleSendTemplate}
            >
              <Button
                className="w-full"
                disabled={
                  !selectedTemplate ||
                  !selectedQueryId ||
                  recipientCount === 0 ||
                  sending
                }
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Send Template
                  </>
                )}
              </Button>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview Sample</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTemplate ? (
              <p className="text-sm text-muted-foreground">
                Select a template to preview the rendered message.
              </p>
            ) : !selectedQueryId ? (
              <p className="text-sm text-muted-foreground">
                Select a saved group to preview random matching users.
              </p>
            ) : loadingPreviewUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building preview sample...
              </div>
            ) : previewCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No preview users are available for this group.
              </p>
            ) : (
              <div className="space-y-3">
                {previewCards.map(({ chatUser, preview }, index) => (
                  <div
                    key={chatUser.id}
                    className="space-y-3 rounded-lg bg-green-50 p-4 dark:bg-green-950"
                  >
                    <div className="text-xs text-muted-foreground">
                      Preview {index + 1}:{" "}
                      {chatUser.name || chatUser.number || "Unnamed user"}
                      {chatUser.number ? ` (${chatUser.number})` : ""}
                    </div>
                    {preview.header && (
                      <div className="text-sm font-semibold">
                        {preview.header}
                      </div>
                    )}
                    {preview.body && (
                      <div className="whitespace-pre-wrap text-sm">
                        {preview.body}
                      </div>
                    )}
                    {preview.footer && (
                      <div className="text-xs text-muted-foreground">
                        {preview.footer}
                      </div>
                    )}
                    {!preview.header && !preview.body && !preview.footer && (
                      <p className="text-sm text-muted-foreground">
                        No text preview available for this template.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default TemplatesSentTable;
