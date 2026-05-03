import Ajv, { ErrorObject, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  strict: false,
});

const ajv2020 = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: false,
});

const validatorCache = new Map<string, ValidateFunction>();

export type AgentConfigValidationResult =
  | { valid: true }
  | {
      valid: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

export function validateAgentConfig({
  schema,
  config,
}: {
  schema: unknown;
  config: unknown;
}): AgentConfigValidationResult {
  if (schema === null || schema === undefined) {
    return {
      valid: false,
      error:
        "This agent does not have a config schema yet. Add a schema before editing config.",
    };
  }

  if (typeof schema !== "object" && typeof schema !== "boolean") {
    return {
      valid: false,
      error: formatInvalidSchemaError(
        `Schema must be a JSON object or boolean, received ${typeof schema}.`,
      ),
    };
  }

  const validatorResult = getValidator(schema);

  if (!validatorResult.success) {
    return {
      valid: false,
      error: validatorResult.error,
    };
  }

  const isValid = validatorResult.validator(config);

  if (isValid) {
    return { valid: true };
  }

  return {
    valid: false,
    error: "Config does not match this agent's schema.",
    fieldErrors: normaliseAjvErrors(validatorResult.validator.errors),
  };
}

function getValidator(
  schema: object | boolean,
):
  | { success: true; validator: ValidateFunction }
  | { success: false; error: string } {
  const cacheKey = `${getSchemaDialect(schema)}:${JSON.stringify(schema)}`;
  const cachedValidator = validatorCache.get(cacheKey);

  if (cachedValidator) {
    return { success: true, validator: cachedValidator };
  }

  try {
    const validator = getAjvForSchema(schema).compile(schema);
    validatorCache.set(cacheKey, validator);
    return { success: true, validator };
  } catch (error) {
    return {
      success: false,
      error: formatInvalidSchemaError(getSchemaCompileErrorMessage(error)),
    };
  }
}

function getAjvForSchema(schema: object | boolean) {
  return getSchemaDialect(schema) === "2020-12" ? ajv2020 : ajv;
}

function getSchemaDialect(schema: object | boolean) {
  if (
    typeof schema === "object" &&
    schema !== null &&
    "$schema" in schema &&
    (schema as { $schema?: unknown }).$schema ===
      "https://json-schema.org/draft/2020-12/schema"
  ) {
    return "2020-12";
  }

  return "default";
}

function formatInvalidSchemaError(detail: string): string {
  return `This agent has an invalid config schema: ${detail}`;
}

function getSchemaCompileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown schema compilation error.";
}

function normaliseAjvErrors(
  errors: ErrorObject[] | null | undefined,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const error of errors || []) {
    const path = getErrorPath(error);

    if (!fieldErrors[path]) {
      fieldErrors[path] = error.message || "Invalid value";
    }
  }

  return fieldErrors;
}

function getErrorPath(error: ErrorObject): string {
  if (error.keyword === "required") {
    return appendPathSegment(
      formatInstancePath(error.instancePath),
      String(
        (error.params as { missingProperty?: string }).missingProperty || "",
      ),
    );
  }

  if (error.keyword === "additionalProperties") {
    return appendPathSegment(
      formatInstancePath(error.instancePath),
      String(
        (error.params as { additionalProperty?: string }).additionalProperty ||
          "",
      ),
    );
  }

  return formatInstancePath(error.instancePath);
}

function formatInstancePath(instancePath: string): string {
  if (!instancePath) {
    return "$";
  }

  return instancePath
    .split("/")
    .slice(1)
    .reduce((path, segment) => {
      const decodedSegment = decodeJsonPointerSegment(segment);

      if (/^\d+$/.test(decodedSegment)) {
        return `${path}[${decodedSegment}]`;
      }

      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(decodedSegment)) {
        return `${path}.${decodedSegment}`;
      }

      return `${path}[${JSON.stringify(decodedSegment)}]`;
    }, "$");
}

function appendPathSegment(path: string, segment: string): string {
  if (!segment) {
    return path;
  }

  if (/^\d+$/.test(segment)) {
    return `${path}[${segment}]`;
  }

  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
    return `${path}.${segment}`;
  }

  return `${path}[${JSON.stringify(segment)}]`;
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
