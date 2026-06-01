import type { Knex } from "knex";

export type ChatUserQueryLogicalOperator = "and" | "or";
export type ChatUserQueryFieldType = "string" | "number" | "boolean";

export type ChatUserQueryOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_true"
  | "is_false"
  | "is_empty"
  | "is_not_empty"
  | "exists"
  | "not_exists";

export type ChatUserQueryValue = string | number | boolean;

export interface ChatUserQueryFieldOption {
  label: string;
  value: string | number;
}

export interface ChatUserQueryRule {
  id: string;
  kind: "rule";
  fieldPath: string;
  fieldType: ChatUserQueryFieldType;
  operator: ChatUserQueryOperator;
  value?: ChatUserQueryValue;
}

export interface ChatUserQueryGroup {
  id: string;
  kind: "group";
  operator: ChatUserQueryLogicalOperator;
  children: ChatUserQueryNode[];
}

export type ChatUserQueryNode = ChatUserQueryGroup | ChatUserQueryRule;

export interface ChatUserQueryDefinition {
  version: 1;
  root: ChatUserQueryGroup;
}

export interface SavedChatUserQuery {
  id: string;
  agentId: string;
  name: string;
  definitionVersion: number;
  query: ChatUserQueryDefinition;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatUserQueryFieldDefinition {
  path: string;
  label: string;
  type: ChatUserQueryFieldType;
  required: boolean;
  options?: ChatUserQueryFieldOption[];
}

type JsonSchema = {
  type?: string | string[];
  title?: string;
  const?: string | number | boolean | null;
  enum?: Array<string | number | boolean | null>;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
};

type CompileResult = { success: true } | { success: false; error: string };

const STRING_OPERATORS = new Set<ChatUserQueryOperator>([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "exists",
  "not_exists",
]);

const NUMBER_OPERATORS = new Set<ChatUserQueryOperator>([
  "equals",
  "not_equals",
  "gt",
  "gte",
  "lt",
  "lte",
  "exists",
  "not_exists",
]);

const BOOLEAN_OPERATORS = new Set<ChatUserQueryOperator>([
  "is_true",
  "is_false",
  "exists",
  "not_exists",
]);

export function extractChatUserQueryFields(
  schema: unknown,
): ChatUserQueryFieldDefinition[] {
  if (!isPlainObject(schema)) {
    return [];
  }

  const rootSchema = schema as JsonSchema;
  if (
    !schemaTypeIncludes(rootSchema.type, "object") ||
    !rootSchema.properties
  ) {
    return [];
  }

  const fields: ChatUserQueryFieldDefinition[] = [];
  collectFields({
    fields,
    pathPrefix: "",
    labelPrefix: "",
    schema: rootSchema,
    required: new Set(rootSchema.required || []),
  });

  return fields.sort((left, right) => left.label.localeCompare(right.label));
}

export function applyChatUserQueryDefinition({
  query,
  definition,
}: {
  query: Knex.QueryBuilder;
  definition: ChatUserQueryDefinition;
}): CompileResult {
  if (!definition || definition.version !== 1 || !definition.root) {
    return {
      success: false,
      error: "Invalid chat user query definition.",
    };
  }

  const validationResult = validateNode(definition.root);
  if (!validationResult.success) {
    return validationResult;
  }

  return applyGroupToQuery({
    query,
    combinator: "and",
    group: definition.root,
    isFirstSibling: true,
  });
}

function collectFields({
  fields,
  pathPrefix,
  labelPrefix,
  schema,
  required,
}: {
  fields: ChatUserQueryFieldDefinition[];
  pathPrefix: string;
  labelPrefix: string;
  schema: JsonSchema;
  required: Set<string>;
}) {
  const properties = schema.properties || {};

  Object.entries(properties).forEach(([key, childSchema]) => {
    const childPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const childLabel = childSchema.title || humanizeSegment(key);
    const label = labelPrefix ? `${labelPrefix} / ${childLabel}` : childLabel;

    const objectSchema = resolveObjectSchema(childSchema);
    if (objectSchema) {
      collectFields({
        fields,
        pathPrefix: childPath,
        labelPrefix: label,
        schema: objectSchema,
        required: new Set(objectSchema.required || []),
      });
      return;
    }

    const fieldType = resolveFieldType(childSchema);
    if (!fieldType) {
      return;
    }

    fields.push({
      path: childPath,
      label,
      type: fieldType,
      required: required.has(key),
      options: resolveFieldOptions(childSchema, fieldType),
    });
  });
}

function applyGroupToQuery({
  query,
  combinator,
  group,
  isFirstSibling,
}: {
  query: Knex.QueryBuilder;
  combinator: ChatUserQueryLogicalOperator;
  group: ChatUserQueryGroup;
  isFirstSibling: boolean;
}): CompileResult {
  if (group.kind !== "group") {
    return {
      success: false,
      error: "Invalid query group.",
    };
  }

  const children = group.children.filter(Boolean);
  if (children.length === 0) {
    return { success: true };
  }

  const method = combinator === "or" && !isFirstSibling ? "orWhere" : "where";

  query[method]((nestedQuery: Knex.QueryBuilder) => {
    children.forEach((child, index) => {
      if (child.kind === "group") {
        const result = applyGroupToQuery({
          query: nestedQuery,
          combinator: group.operator,
          group: child,
          isFirstSibling: index === 0,
        });

        if (!result.success) {
          throw new Error(result.error);
        }
        return;
      }

      const result = applyRuleToQuery({
        query: nestedQuery,
        rule: child,
        combinator: group.operator,
        isFirstSibling: index === 0,
      });

      if (!result.success) {
        throw new Error(result.error);
      }
    });
  });

  return { success: true };
}

function applyRuleToQuery({
  query,
  rule,
  combinator,
  isFirstSibling,
}: {
  query: Knex.QueryBuilder;
  rule: ChatUserQueryRule;
  combinator: ChatUserQueryLogicalOperator;
  isFirstSibling: boolean;
}): CompileResult {
  const operatorSet = getOperatorSet(rule.fieldType);
  if (!operatorSet.has(rule.operator)) {
    return {
      success: false,
      error: `Operator ${rule.operator} is not valid for ${rule.fieldType} fields.`,
    };
  }

  const validationResult = validateRuleValue(rule);
  if (!validationResult.success) {
    return validationResult;
  }

  const queryMethod =
    combinator === "or" && !isFirstSibling ? "orWhereRaw" : "whereRaw";
  const jsonPath = toJsonPath(rule.fieldPath);
  const textSql = `(jsonb_path_query_first("chatUser"."data", ?) #>> '{}')`;
  const existsSql = `(${textSql} IS NOT NULL AND ${textSql} != '')`;

  switch (rule.operator) {
    case "exists":
      query[queryMethod](existsSql, [jsonPath, jsonPath]);
      return { success: true };
    case "not_exists":
      query[queryMethod](`NOT ${existsSql}`, [jsonPath, jsonPath]);
      return { success: true };
    case "equals":
      if (rule.fieldType === "number") {
        query[queryMethod](`(${textSql})::numeric = ?`, [jsonPath, rule.value]);
        return { success: true };
      }

      query[queryMethod](`${textSql} = ?`, [jsonPath, String(rule.value)]);
      return { success: true };
    case "not_equals":
      if (rule.fieldType === "number") {
        query[queryMethod](`(${textSql})::numeric != ?`, [
          jsonPath,
          rule.value,
        ]);
        return { success: true };
      }

      query[queryMethod](`${textSql} != ?`, [jsonPath, String(rule.value)]);
      return { success: true };
    case "contains":
      query[queryMethod](`${textSql} ILIKE ?`, [
        jsonPath,
        `%${escapeLikeValue(String(rule.value))}%`,
      ]);
      return { success: true };
    case "not_contains":
      query[queryMethod](`${textSql} NOT ILIKE ?`, [
        jsonPath,
        `%${escapeLikeValue(String(rule.value))}%`,
      ]);
      return { success: true };
    case "starts_with":
      query[queryMethod](`${textSql} ILIKE ?`, [
        jsonPath,
        `${escapeLikeValue(String(rule.value))}%`,
      ]);
      return { success: true };
    case "ends_with":
      query[queryMethod](`${textSql} ILIKE ?`, [
        jsonPath,
        `%${escapeLikeValue(String(rule.value))}`,
      ]);
      return { success: true };
    case "gt":
      query[queryMethod](`(${textSql})::numeric > ?`, [jsonPath, rule.value]);
      return { success: true };
    case "gte":
      query[queryMethod](`(${textSql})::numeric >= ?`, [jsonPath, rule.value]);
      return { success: true };
    case "lt":
      query[queryMethod](`(${textSql})::numeric < ?`, [jsonPath, rule.value]);
      return { success: true };
    case "lte":
      query[queryMethod](`(${textSql})::numeric <= ?`, [jsonPath, rule.value]);
      return { success: true };
    case "is_true":
      query[queryMethod](`${textSql} = 'true'`, [jsonPath]);
      return { success: true };
    case "is_false":
      query[queryMethod](`${textSql} = 'false'`, [jsonPath]);
      return { success: true };
    case "is_empty":
      query[queryMethod](`(${textSql} IS NULL OR ${textSql} = '')`, [
        jsonPath,
        jsonPath,
      ]);
      return { success: true };
    case "is_not_empty":
      query[queryMethod](`(${textSql} IS NOT NULL AND ${textSql} != '')`, [
        jsonPath,
        jsonPath,
      ]);
      return { success: true };
    default:
      return {
        success: false,
        error: `Unsupported operator ${rule.operator}.`,
      };
  }
}

function validateRuleValue(rule: ChatUserQueryRule): CompileResult {
  if (rule.operator === "exists" || rule.operator === "not_exists") {
    return { success: true };
  }

  if (rule.operator === "is_true" || rule.operator === "is_false") {
    return { success: true };
  }

  if (rule.operator === "is_empty" || rule.operator === "is_not_empty") {
    return { success: true };
  }

  if (rule.value === undefined || rule.value === null) {
    return {
      success: false,
      error: `Rule ${rule.id} is missing a value.`,
    };
  }

  if (rule.fieldType === "number" && typeof rule.value !== "number") {
    return {
      success: false,
      error: `Rule ${rule.id} must use a numeric value.`,
    };
  }

  if (rule.fieldType === "string" && typeof rule.value !== "string") {
    return {
      success: false,
      error: `Rule ${rule.id} must use a string value.`,
    };
  }

  return { success: true };
}

function validateNode(node: ChatUserQueryNode): CompileResult {
  if (node.kind === "group") {
    for (const child of node.children) {
      const result = validateNode(child);
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  }

  const operatorSet = getOperatorSet(node.fieldType);
  if (!operatorSet.has(node.operator)) {
    return {
      success: false,
      error: `Operator ${node.operator} is not valid for ${node.fieldType} fields.`,
    };
  }

  return validateRuleValue(node);
}

function getOperatorSet(fieldType: ChatUserQueryFieldType) {
  if (fieldType === "string") {
    return STRING_OPERATORS;
  }

  if (fieldType === "number") {
    return NUMBER_OPERATORS;
  }

  return BOOLEAN_OPERATORS;
}

function getFieldType(type: JsonSchema["type"]): ChatUserQueryFieldType | null {
  if (schemaTypeIncludes(type, "string")) {
    return "string";
  }

  if (
    schemaTypeIncludes(type, "number") ||
    schemaTypeIncludes(type, "integer")
  ) {
    return "number";
  }

  if (schemaTypeIncludes(type, "boolean")) {
    return "boolean";
  }

  return null;
}

function resolveFieldOptions(
  schema: JsonSchema,
  fieldType: ChatUserQueryFieldType,
): ChatUserQueryFieldOption[] | undefined {
  const rawOptions = collectFieldOptions(schema, fieldType);

  if (rawOptions.length === 0) {
    return undefined;
  }

  const seenValues = new Set<string>();
  const normalizedOptions = rawOptions.filter((option) => {
    const key = `${typeof option.value}:${String(option.value)}`;
    if (seenValues.has(key)) {
      return false;
    }

    seenValues.add(key);
    return true;
  });

  return normalizedOptions.length > 0 ? normalizedOptions : undefined;
}

function collectFieldOptions(
  schema: JsonSchema,
  fieldType: ChatUserQueryFieldType,
): ChatUserQueryFieldOption[] {
  const optionsFromEnum = (schema.enum || [])
    .flatMap((value) => toFieldOption(value, undefined, fieldType))
    .filter(Boolean) as ChatUserQueryFieldOption[];

  if (optionsFromEnum.length > 0) {
    return optionsFromEnum;
  }

  const variantOptions = [
    ...(schema.anyOf || []),
    ...(schema.oneOf || []),
    ...(schema.allOf || []),
  ]
    .flatMap((variant) => {
      if (variant.const !== undefined) {
        return toFieldOption(variant.const, variant.title, fieldType);
      }

      return collectFieldOptions(variant, fieldType);
    })
    .filter(Boolean) as ChatUserQueryFieldOption[];

  return variantOptions;
}

function toFieldOption(
  value: string | number | boolean | null,
  label: string | undefined,
  fieldType: ChatUserQueryFieldType,
): ChatUserQueryFieldOption[] {
  if (value === null) {
    return [];
  }

  if (fieldType === "string" && typeof value === "string") {
    return [
      {
        label: label || value,
        value,
      },
    ];
  }

  if (fieldType === "number" && typeof value === "number") {
    return [
      {
        label: label || String(value),
        value,
      },
    ];
  }

  return [];
}

function resolveFieldType(schema: JsonSchema): ChatUserQueryFieldType | null {
  const directFieldType = getFieldType(schema.type);
  if (directFieldType) {
    return directFieldType;
  }

  for (const variant of schema.anyOf || []) {
    const variantFieldType = resolveFieldType(variant);
    if (variantFieldType) {
      return variantFieldType;
    }
  }

  for (const variant of schema.oneOf || []) {
    const variantFieldType = resolveFieldType(variant);
    if (variantFieldType) {
      return variantFieldType;
    }
  }

  for (const variant of schema.allOf || []) {
    const variantFieldType = resolveFieldType(variant);
    if (variantFieldType) {
      return variantFieldType;
    }
  }

  return null;
}

function resolveObjectSchema(schema: JsonSchema): JsonSchema | null {
  if (schemaTypeIncludes(schema.type, "object") && Boolean(schema.properties)) {
    return schema;
  }

  for (const variant of [
    ...(schema.anyOf || []),
    ...(schema.oneOf || []),
    ...(schema.allOf || []),
  ]) {
    const resolvedVariant = resolveObjectSchema(variant);
    if (resolvedVariant) {
      return resolvedVariant;
    }
  }

  return null;
}

function schemaTypeIncludes(
  type: JsonSchema["type"],
  expectedType: string,
): boolean {
  if (!type) {
    return false;
  }

  if (Array.isArray(type)) {
    return type.includes(expectedType);
  }

  return type === expectedType;
}

function toJsonPath(fieldPath: string) {
  const segments = fieldPath
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(segment)) {
        return `.${segment}`;
      }

      return `.${JSON.stringify(segment)}`;
    });

  return `$${segments.join("")}`;
}

function humanizeSegment(segment: string) {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (value) => value.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeLikeValue(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}
