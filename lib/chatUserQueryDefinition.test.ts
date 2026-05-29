import assert from "node:assert/strict";
import test from "node:test";
import db from "@/database/db";
import {
  applyChatUserQueryDefinition,
  extractChatUserQueryFields,
  ChatUserQueryDefinition,
} from "./chatUserQueryDefinition";

test("extracts nested scalar fields from user data schema", () => {
  const fields = extractChatUserQueryFields({
    type: "object",
    required: ["firstName"],
    properties: {
      firstName: { type: "string", title: "First name" },
      marketing: {
        type: "object",
        title: "Marketing",
        properties: {
          score: { type: "number" },
          subscribed: { type: "boolean", title: "Subscribed" },
        },
      },
      ignoredArray: {
        type: "array",
      },
    },
  });

  assert.deepEqual(fields, [
    {
      path: "firstName",
      label: "First name",
      type: "string",
      required: true,
    },
    {
      path: "marketing.score",
      label: "Marketing / Score",
      type: "number",
      required: false,
    },
    {
      path: "marketing.subscribed",
      label: "Marketing / Subscribed",
      type: "boolean",
      required: false,
    },
  ]);
});

test("extracts nullable scalar fields defined with anyOf", () => {
  const fields = extractChatUserQueryFields({
    type: "object",
    properties: {
      lastAuthenticatedEmail: {
        anyOf: [{ type: "string" }, { type: "null" }],
        title: "Last Authenticated Email",
      },
      authenticatedAt: {
        anyOf: [{ type: "string" }, { type: "null" }],
        title: "Authenticated At",
      },
      pendingEmailVerification: {
        anyOf: [
          {
            type: "object",
            properties: {
              email: { type: "string", title: "Email" },
            },
          },
          { type: "null" },
        ],
        title: "Pending Verification",
      },
    },
  });

  assert.deepEqual(fields, [
    {
      path: "authenticatedAt",
      label: "Authenticated At",
      type: "string",
      required: false,
    },
    {
      path: "lastAuthenticatedEmail",
      label: "Last Authenticated Email",
      type: "string",
      required: false,
    },
    {
      path: "pendingEmailVerification.email",
      label: "Pending Verification / Email",
      type: "string",
      required: false,
    },
  ]);
});

test("applies nested and/or rules to a chat user query", () => {
  const definition: ChatUserQueryDefinition = {
    version: 1,
    root: {
      id: "root",
      kind: "group",
      operator: "and",
      children: [
        {
          id: "rule-1",
          kind: "rule",
          fieldPath: "firstName",
          fieldType: "string",
          operator: "contains",
          value: "jam",
        },
        {
          id: "group-1",
          kind: "group",
          operator: "or",
          children: [
            {
              id: "rule-2",
              kind: "rule",
              fieldPath: "marketing.score",
              fieldType: "number",
              operator: "gte",
              value: 10,
            },
            {
              id: "rule-3",
              kind: "rule",
              fieldPath: "marketing.subscribed",
              fieldType: "boolean",
              operator: "is_true",
            },
          ],
        },
      ],
    },
  };

  const query = db("chatUser").select("chatUser.id");
  const result = applyChatUserQueryDefinition({ query, definition });

  assert.equal(result.success, true);
  const sql = query.toSQL();

  assert.match(sql.sql, /jsonb_path_query_first/);
  assert.match(sql.sql, / ilike /i);
  assert.match(sql.sql, /::numeric >= \?/i);
  assert.match(sql.sql, / or /i);
  assert.deepEqual(sql.bindings, [
    "$.firstName",
    "%jam%",
    "$.marketing.score",
    10,
    "$.marketing.subscribed",
  ]);
});

test("rejects invalid operators for field types", () => {
  const definition: ChatUserQueryDefinition = {
    version: 1,
    root: {
      id: "root",
      kind: "group",
      operator: "and",
      children: [
        {
          id: "rule-1",
          kind: "rule",
          fieldPath: "marketing.subscribed",
          fieldType: "boolean",
          operator: "contains",
          value: "yes",
        },
      ],
    },
  };

  const query = db("chatUser").select("chatUser.id");
  const result = applyChatUserQueryDefinition({ query, definition });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /not valid for boolean/i);
  }
});
