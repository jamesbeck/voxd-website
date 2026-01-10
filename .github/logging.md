# Logging

This document describes how to use the logging system to track events and actions in the application.

## Overview

The `log` table stores audit logs for important events. Each log entry records who performed an action, what entities were affected, and additional context.

## Using the `addLog` Function

Import and use the function from `@/lib/addLog`:

```typescript
import { addLog } from "@/lib/addLog";

await addLog({
  adminUserId: "uuid-of-admin-user", // Required if request is from an admin user
  apiKeyId: "uuid-of-api-key", // Required if request is from an API key
  event: "User Login", // Required: identifies the event type
  description: "User logged in", // Optional: more detailed description
  organisationId: "org-uuid", // Optional: related organisation
  partnerId: "partner-uuid", // Optional: related partner
  sessionId: "session-uuid", // Optional: related session
  agentId: "agent-uuid", // Optional: related agent
  chatUserId: "chat-user-uuid", // Optional: related chat user
  data: {
    // Optional: any additional JSON data
    email: "user@example.com",
    browser: "Chrome",
  },
});
```

## Parameters

| Parameter        | Type                      | Required                           | Description                                                          |
| ---------------- | ------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `adminUserId`    | `string`                  | One of `adminUserId` or `apiKeyId` | UUID of the admin user making the request                            |
| `apiKeyId`       | `string`                  | One of `adminUserId` or `apiKeyId` | UUID of the API key used for the request                             |
| `event`          | `string`                  | Yes                                | Short identifier for the event (e.g., "User Login", "Agent Created") |
| `description`    | `string`                  | No                                 | More detailed description of what happened                           |
| `organisationId` | `string`                  | No                                 | UUID of the related organisation                                     |
| `partnerId`      | `string`                  | No                                 | UUID of the related partner                                          |
| `sessionId`      | `string`                  | No                                 | UUID of the related session                                          |
| `agentId`        | `string`                  | No                                 | UUID of the related agent                                            |
| `chatUserId`     | `string`                  | No                                 | UUID of the related chat user                                        |
| `data`           | `Record<string, unknown>` | No                                 | Any additional JSON data to store                                    |

## IP Address

The client IP address is automatically captured from request headers. The function checks these headers in order:

1. `x-forwarded-for` (first IP in the list)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)

## Example Events

Here are some standard event names to use:

- `User Login` - Admin user logged in
- `User Logout` - Admin user logged out
- `Agent Created` - New agent was created
- `Agent Updated` - Agent settings were modified
- `Session Started` - New chat session began
- `Message Sent` - Manual message sent via API or dashboard
- `API Key Created` - New API key was generated

## Database Schema

The `log` table has the following structure:

| Column           | Type           | Description                            |
| ---------------- | -------------- | -------------------------------------- |
| `id`             | `uuid`         | Primary key (auto-generated UUIDv7)    |
| `adminUserId`    | `uuid`         | Foreign key to adminUser (nullable)    |
| `apiKeyId`       | `uuid`         | Foreign key to apiKey (nullable)       |
| `organisationId` | `uuid`         | Foreign key to organisation (nullable) |
| `partnerId`      | `uuid`         | Foreign key to partner (nullable)      |
| `sessionId`      | `uuid`         | Foreign key to session (nullable)      |
| `agentId`        | `uuid`         | Foreign key to agent (nullable)        |
| `chatUserId`     | `uuid`         | Foreign key to chatUser (nullable)     |
| `event`          | `varchar(255)` | Event identifier                       |
| `description`    | `varchar(255)` | Detailed description                   |
| `data`           | `jsonb`        | Additional JSON data                   |
| `ipAddress`      | `varchar(255)` | Client IP address                      |
| `createdAt`      | `timestamptz`  | When the log was created               |
