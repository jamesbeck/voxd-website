"use client";

import saCreateChatUserQuery from "@/actions/saCreateChatUserQuery";
import saDeleteChatUserQuery from "@/actions/saDeleteChatUserQuery";
import saGetChatUserQueries from "@/actions/saGetChatUserQueries";
import saUpdateChatUserQuery from "@/actions/saUpdateChatUserQuery";
import {
  ChatUserQueryDefinition,
  ChatUserQueryFieldDefinition,
  ChatUserQueryFieldType,
  ChatUserQueryGroup,
  ChatUserQueryNode,
  ChatUserQueryOperator,
  ChatUserQueryRule,
  extractChatUserQueryFields,
  SavedChatUserQuery,
} from "@/lib/chatUserQueryDefinition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

const EMPTY_SELECT_VALUE = "__draft__";

const STRING_OPERATOR_OPTIONS: Array<{
  value: ChatUserQueryOperator;
  label: string;
}> = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
  { value: "exists", label: "Exists" },
  { value: "not_exists", label: "Does not exist" },
];

const NUMBER_OPERATOR_OPTIONS: Array<{
  value: ChatUserQueryOperator;
  label: string;
}> = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater than or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less than or equal" },
  { value: "exists", label: "Exists" },
  { value: "not_exists", label: "Does not exist" },
];

const BOOLEAN_OPERATOR_OPTIONS: Array<{
  value: ChatUserQueryOperator;
  label: string;
}> = [
  { value: "is_true", label: "Is true" },
  { value: "is_false", label: "Is false" },
  { value: "exists", label: "Exists" },
  { value: "not_exists", label: "Does not exist" },
];

export default function ChatUserQueryManager({
  agentId,
  userDataSchema,
  onDefinitionChange,
}: {
  agentId: string;
  userDataSchema: unknown;
  onDefinitionChange: (definition?: ChatUserQueryDefinition) => void;
}) {
  const fields = useMemo(
    () => extractChatUserQueryFields(userDataSchema),
    [userDataSchema],
  );
  const [savedQueries, setSavedQueries] = useState<SavedChatUserQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDefinition, setDraftDefinition] =
    useState<ChatUserQueryDefinition>(createEmptyDefinition());
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editorName, setEditorName] = useState("");
  const [editorDefinition, setEditorDefinition] =
    useState<ChatUserQueryDefinition>(createEmptyDefinition());
  const [loadingQueries, startLoadingQueries] = useTransition();
  const [savingQuery, startSavingQuery] = useTransition();

  const hasDraftRules = draftDefinition.root.children.length > 0;
  const summary = useMemo(
    () => summariseDefinition(draftDefinition, fields),
    [draftDefinition, fields],
  );

  useEffect(() => {
    onDefinitionChange(hasDraftRules ? draftDefinition : undefined);
  }, [draftDefinition, hasDraftRules, onDefinitionChange]);

  useEffect(() => {
    startLoadingQueries(async () => {
      const result = await saGetChatUserQueries({ agentId });

      if (!result.success) {
        toast.error(result.error || "Failed to load saved queries");
        return;
      }

      setSavedQueries((result.data || []) as SavedChatUserQuery[]);
    });
  }, [agentId]);

  const openNewEditor = () => {
    if (fields.length === 0) {
      toast.error("Add a user data schema before building saved queries");
      return;
    }

    setSelectedQueryId(null);
    setEditorName("");
    setEditorDefinition(createEmptyDefinition());
    setEditorOpen(true);
  };

  const openEditEditor = () => {
    if (fields.length === 0) {
      toast.error("Add a user data schema before editing queries");
      return;
    }

    setEditorName(draftName);
    setEditorDefinition(cloneDefinition(draftDefinition));
    setEditorOpen(true);
  };

  const handleSavedQuerySelection = (value: string) => {
    if (value === EMPTY_SELECT_VALUE) {
      setSelectedQueryId(null);
      return;
    }

    const selectedQuery = savedQueries.find((query) => query.id === value);
    if (!selectedQuery) {
      return;
    }

    setSelectedQueryId(selectedQuery.id);
    setDraftName(selectedQuery.name);
    setDraftDefinition(cloneDefinition(selectedQuery.query));
  };

  const handleApplyDraft = () => {
    setDraftName(editorName.trim());
    setDraftDefinition(cloneDefinition(editorDefinition));
    setEditorOpen(false);
  };

  const handleSaveAsNew = () => {
    const trimmedName = editorName.trim();
    if (!trimmedName) {
      toast.error("Query name is required");
      return;
    }

    startSavingQuery(async () => {
      const result = await saCreateChatUserQuery({
        agentId,
        name: trimmedName,
        query: editorDefinition,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save query");
        return;
      }

      const createdQuery = result.data as SavedChatUserQuery;
      setSavedQueries((currentQueries) =>
        [...currentQueries, createdQuery].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setSelectedQueryId(createdQuery.id);
      setDraftName(createdQuery.name);
      setDraftDefinition(cloneDefinition(createdQuery.query));
      setEditorOpen(false);
      toast.success("Query saved");
    });
  };

  const handleSaveExisting = () => {
    if (!selectedQueryId) {
      toast.error("Select a saved query first or use Save as new");
      return;
    }

    const trimmedName = editorName.trim();
    if (!trimmedName) {
      toast.error("Query name is required");
      return;
    }

    startSavingQuery(async () => {
      const result = await saUpdateChatUserQuery({
        queryId: selectedQueryId,
        name: trimmedName,
        query: editorDefinition,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update query");
        return;
      }

      const updatedQuery = result.data as SavedChatUserQuery;
      setSavedQueries((currentQueries) =>
        currentQueries
          .map((query) => (query.id === updatedQuery.id ? updatedQuery : query))
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
      setDraftName(updatedQuery.name);
      setDraftDefinition(cloneDefinition(updatedQuery.query));
      setEditorOpen(false);
      toast.success("Query updated");
    });
  };

  const handleDeleteQuery = () => {
    if (!selectedQueryId) {
      return;
    }

    startSavingQuery(async () => {
      const result = await saDeleteChatUserQuery({ queryId: selectedQueryId });

      if (!result.success) {
        toast.error(result.error || "Failed to delete query");
        return;
      }

      setSavedQueries((currentQueries) =>
        currentQueries.filter((query) => query.id !== selectedQueryId),
      );
      setSelectedQueryId(null);
      setDraftName("");
      setDraftDefinition(createEmptyDefinition());
      setDeleteOpen(false);
      toast.success("Query deleted");
    });
  };

  return (
    <>
      <div className="mb-4 rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-1.5">
            <Label htmlFor="chat-user-query-select">Saved Groups</Label>
            <Select
              value={selectedQueryId || EMPTY_SELECT_VALUE}
              onValueChange={handleSavedQuerySelection}
            >
              <SelectTrigger
                id="chat-user-query-select"
                className="w-full min-w-[280px]"
              >
                <SelectValue placeholder="Select a saved query" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_SELECT_VALUE}>
                  Unsaved draft
                </SelectItem>
                {savedQueries.map((query) => (
                  <SelectItem key={query.id} value={query.id}>
                    {query.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={openNewEditor}>
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openEditEditor}
              disabled={fields.length === 0}
            >
              Edit Query
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(true)}
              disabled={!selectedQueryId}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedQueryId ? (
            <Badge>Saved query</Badge>
          ) : hasDraftRules ? (
            <Badge variant="secondary">Draft query</Badge>
          ) : (
            <Badge variant="outline">No query</Badge>
          )}
          <span className="text-sm font-medium">
            {draftName || (hasDraftRules ? "Unsaved query" : "No active query")}
          </span>
          {loadingQueries && (
            <span className="text-sm text-muted-foreground">
              Loading saved queries...
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {hasDraftRules
            ? summary
            : "Build a saved group to filter chat users by the fields stored in user data."}
        </p>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden p-0 sm:max-w-[96vw] xl:w-[1400px] xl:max-w-[1400px]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {selectedQueryId ? "Edit Saved Query" : "New Saved Query"}
            </DialogTitle>
            <DialogDescription>
              Build nested AND/OR rules from this agent&apos;s user data schema.
            </DialogDescription>
          </DialogHeader>

          {fields.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                This agent does not currently expose any schema-defined user
                data fields.
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6">
              <div className="grid gap-1.5">
                <Label htmlFor="chat-user-query-name">Query name</Label>
                <Input
                  id="chat-user-query-name"
                  value={editorName}
                  onChange={(event) => setEditorName(event.target.value)}
                  placeholder="High value prospects"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-2 pb-1">
                <QueryGroupEditor
                  group={editorDefinition.root}
                  fields={fields}
                  depth={0}
                  isRoot
                  onChange={(nextGroup) =>
                    setEditorDefinition((currentDefinition) => ({
                      ...currentDefinition,
                      root: nextGroup,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditorOpen(false)}
              disabled={savingQuery}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyDraft}
              disabled={savingQuery || fields.length === 0}
            >
              Apply Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsNew}
              disabled={savingQuery || fields.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as New
            </Button>
            <Button
              type="button"
              onClick={handleSaveExisting}
              disabled={savingQuery || !selectedQueryId || fields.length === 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved query?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved group definition for this agent. The
              current draft filter will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingQuery}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuery}
              disabled={savingQuery}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function QueryGroupEditor({
  group,
  fields,
  onChange,
  depth,
  isRoot = false,
}: {
  group: ChatUserQueryGroup;
  fields: ChatUserQueryFieldDefinition[];
  onChange: (group: ChatUserQueryGroup) => void;
  depth: number;
  isRoot?: boolean;
}) {
  const canAddRules = fields.length > 0;

  const handleAddRule = () => {
    if (!canAddRules) {
      return;
    }

    onChange({
      ...group,
      children: [...group.children, createEmptyRule(fields[0])],
    });
  };

  const handleAddGroup = () => {
    onChange({
      ...group,
      children: [...group.children, createEmptyGroup()],
    });
  };

  const handleChildChange = (childId: string, nextNode: ChatUserQueryNode) => {
    onChange({
      ...group,
      children: group.children.map((child) =>
        child.id === childId ? nextNode : child,
      ),
    });
  };

  const handleRemoveChild = (childId: string) => {
    onChange({
      ...group,
      children: group.children.filter((child) => child.id !== childId),
    });
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: depth % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{isRoot ? "Root" : "Group"}</Badge>
          <Select
            value={group.operator}
            onValueChange={(value: "and" | "or") =>
              onChange({ ...group, operator: value })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND</SelectItem>
              <SelectItem value="or">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRule}
            disabled={!canAddRules}
          >
            Add Rule
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGroup}
          >
            Add Group
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {group.children.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Add a rule or a nested group to start filtering users.
          </div>
        ) : (
          group.children.map((child) =>
            child.kind === "group" ? (
              <div key={child.id} className="space-y-2">
                <QueryGroupEditor
                  group={child}
                  fields={fields}
                  depth={depth + 1}
                  onChange={(nextGroup) =>
                    handleChildChange(child.id, nextGroup)
                  }
                />
                {!isRoot && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveChild(child.id)}
                    >
                      Remove Group
                    </Button>
                  </div>
                )}
                {isRoot && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveChild(child.id)}
                    >
                      Remove Group
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <QueryRuleEditor
                key={child.id}
                rule={child}
                fields={fields}
                onChange={(nextRule) => handleChildChange(child.id, nextRule)}
                onRemove={() => handleRemoveChild(child.id)}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}

function QueryRuleEditor({
  rule,
  fields,
  onChange,
  onRemove,
}: {
  rule: ChatUserQueryRule;
  fields: ChatUserQueryFieldDefinition[];
  onChange: (rule: ChatUserQueryRule) => void;
  onRemove: () => void;
}) {
  const selectedField =
    fields.find((field) => field.path === rule.fieldPath) || fields[0];
  const operatorOptions = getOperatorOptions(selectedField.type);
  const operatorNeedsInput = doesOperatorRequireValue(rule.operator);

  const handleFieldChange = (fieldPath: string) => {
    const nextField = fields.find((field) => field.path === fieldPath);
    if (!nextField) {
      return;
    }

    const nextOperator = getDefaultOperator(nextField.type);
    onChange({
      ...rule,
      fieldPath: nextField.path,
      fieldType: nextField.type,
      operator: nextOperator,
      value: getDefaultValue(nextField.type, nextOperator),
    });
  };

  const handleOperatorChange = (operator: ChatUserQueryOperator) => {
    onChange({
      ...rule,
      operator,
      value: doesOperatorRequireValue(operator)
        ? getDefaultValue(selectedField.type, operator, rule.value)
        : undefined,
    });
  };

  return (
    <div className="grid gap-3 rounded-md border p-3 xl:grid-cols-[minmax(320px,1.8fr)_minmax(220px,1fr)_minmax(220px,1fr)_120px] xl:items-end">
      <div className="grid gap-1.5">
        <Label>Field</Label>
        <Select value={selectedField.path} onValueChange={handleFieldChange}>
          <SelectTrigger className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fields.map((field) => (
              <SelectItem key={field.path} value={field.path}>
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Operator</Label>
        <Select value={rule.operator} onValueChange={handleOperatorChange}>
          <SelectTrigger className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operatorOptions.map((operator) => (
              <SelectItem key={operator.value} value={operator.value}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Value</Label>
        {operatorNeedsInput ? (
          selectedField.type === "number" ? (
            <Input
              type="number"
              className="w-full min-w-0"
              value={typeof rule.value === "number" ? String(rule.value) : ""}
              onChange={(event) =>
                onChange({
                  ...rule,
                  value:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
            />
          ) : (
            <Input
              className="w-full min-w-0"
              value={typeof rule.value === "string" ? rule.value : ""}
              onChange={(event) =>
                onChange({
                  ...rule,
                  value: event.target.value,
                })
              }
              placeholder="Enter value"
            />
          )
        ) : (
          <div className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
            No value needed
          </div>
        )}
      </div>

      <div className="flex justify-end xl:pb-0.5">
        <Button
          type="button"
          variant="ghost"
          className="w-full xl:w-auto"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function createEmptyDefinition(): ChatUserQueryDefinition {
  return {
    version: 1,
    root: createEmptyGroup(),
  };
}

function createEmptyGroup(): ChatUserQueryGroup {
  return {
    id: crypto.randomUUID(),
    kind: "group",
    operator: "and",
    children: [],
  };
}

function createEmptyRule(
  field: ChatUserQueryFieldDefinition,
): ChatUserQueryRule {
  const operator = getDefaultOperator(field.type);

  return {
    id: crypto.randomUUID(),
    kind: "rule",
    fieldPath: field.path,
    fieldType: field.type,
    operator,
    value: getDefaultValue(field.type, operator),
  };
}

function getDefaultOperator(
  fieldType: ChatUserQueryFieldType,
): ChatUserQueryOperator {
  if (fieldType === "number") {
    return "equals";
  }

  if (fieldType === "boolean") {
    return "is_true";
  }

  return "contains";
}

function getDefaultValue(
  fieldType: ChatUserQueryFieldType,
  operator: ChatUserQueryOperator,
  currentValue?: string | number | boolean,
) {
  if (!doesOperatorRequireValue(operator)) {
    return undefined;
  }

  if (fieldType === "number") {
    return typeof currentValue === "number" ? currentValue : 0;
  }

  return typeof currentValue === "string" ? currentValue : "";
}

function getOperatorOptions(fieldType: ChatUserQueryFieldType) {
  if (fieldType === "number") {
    return NUMBER_OPERATOR_OPTIONS;
  }

  if (fieldType === "boolean") {
    return BOOLEAN_OPERATOR_OPTIONS;
  }

  return STRING_OPERATOR_OPTIONS;
}

function doesOperatorRequireValue(operator: ChatUserQueryOperator) {
  return ![
    "exists",
    "not_exists",
    "is_true",
    "is_false",
    "is_empty",
    "is_not_empty",
  ].includes(operator);
}

function summariseDefinition(
  definition: ChatUserQueryDefinition,
  fields: ChatUserQueryFieldDefinition[],
) {
  if (definition.root.children.length === 0) {
    return "No active query";
  }

  return summariseNode(definition.root, fields, true);
}

function summariseNode(
  node: ChatUserQueryNode,
  fields: ChatUserQueryFieldDefinition[],
  isRoot = false,
): string {
  if (node.kind === "rule") {
    const field = fields.find((item) => item.path === node.fieldPath);
    const fieldLabel = field?.label || node.fieldPath;
    const operatorLabel = getOperatorLabel(node.operator);

    if (!doesOperatorRequireValue(node.operator)) {
      return `${fieldLabel} ${operatorLabel}`;
    }

    return `${fieldLabel} ${operatorLabel} ${JSON.stringify(node.value ?? "")}`;
  }

  const childSummary = node.children
    .map((child) => summariseNode(child, fields))
    .filter(Boolean)
    .join(node.operator === "and" ? " AND " : " OR ");

  if (isRoot) {
    return childSummary;
  }

  return `(${childSummary})`;
}

function getOperatorLabel(operator: ChatUserQueryOperator) {
  const option = [
    ...STRING_OPERATOR_OPTIONS,
    ...NUMBER_OPERATOR_OPTIONS,
    ...BOOLEAN_OPERATOR_OPTIONS,
  ].find((item) => item.value === operator);

  return option?.label.toLowerCase() || operator;
}

function cloneDefinition(
  definition: ChatUserQueryDefinition,
): ChatUserQueryDefinition {
  return JSON.parse(JSON.stringify(definition));
}
