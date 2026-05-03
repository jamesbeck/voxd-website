import assert from "node:assert/strict";
import test from "node:test";
import { validateAgentConfig } from "./validateAgentConfig";

test("accepts config that matches the schema", () => {
  const result = validateAgentConfig({
    schema: {
      type: "object",
      required: ["mode"],
      properties: {
        mode: { type: "string", enum: ["test", "live"] },
        retries: { type: "integer", minimum: 0 },
      },
      additionalProperties: false,
    },
    config: {
      mode: "test",
      retries: 2,
    },
  });

  assert.deepEqual(result, { valid: true });
});

test("accepts draft 2020-12 schemas", () => {
  const result = validateAgentConfig({
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["mode"],
      properties: {
        mode: { type: "string" },
      },
      unevaluatedProperties: false,
    },
    config: {
      mode: "test",
    },
  });

  assert.deepEqual(result, { valid: true });
});

test("reports missing required properties against their JSON path", () => {
  const result = validateAgentConfig({
    schema: {
      type: "object",
      required: ["mode"],
      properties: {
        mode: { type: "string" },
      },
    },
    config: {},
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, "Config does not match this agent's schema.");
  assert.equal(
    result.fieldErrors?.["$.mode"],
    "must have required property 'mode'",
  );
});

test("reports nested type errors using dot and array notation", () => {
  const result = validateAgentConfig({
    schema: {
      type: "object",
      properties: {
        options: {
          type: "object",
          properties: {
            retries: { type: "integer" },
          },
          required: ["retries"],
        },
        webhooks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
            },
            required: ["url"],
          },
        },
      },
    },
    config: {
      options: { retries: "three" },
      webhooks: [{}],
    },
  });

  assert.equal(result.valid, false);
  assert.equal(result.fieldErrors?.["$.options.retries"], "must be integer");
  assert.equal(
    result.fieldErrors?.["$.webhooks[0].url"],
    "must have required property 'url'",
  );
});

test("blocks validation when a schema has not been configured", () => {
  const result = validateAgentConfig({
    schema: null,
    config: {},
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /does not have a config schema/i);
  assert.equal(result.fieldErrors, undefined);
});

test("blocks validation when the stored schema is invalid", () => {
  const result = validateAgentConfig({
    schema: {
      required: "mode",
    },
    config: {},
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /invalid config schema/i);
  assert.match(result.error, /required/);
  assert.equal(result.fieldErrors, undefined);
});

test("reports non-object schema values clearly", () => {
  const result = validateAgentConfig({
    schema: "not-a-schema",
    config: {},
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /json object or boolean/i);
  assert.match(result.error, /received string/i);
});
