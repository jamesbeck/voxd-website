# Copilot Instructions

## Development Principles

When contributing to this project, please adhere to the following principles:

- Always create shared components where possible to promote code reuse. If you spot an opportunity to create a shared component, take it.
- Use server actions for any functionality that involves data fetching or mutations, all server action files should be in the `actions/` folder and prefixed with "sa", e.g. `saCreateUser.ts`.

## User Access Levels

See [user-access-levels.md](.github/user-access-levels.md) for detailed documentation on the three user levels (Admin, Partner, Organisation) and what data each can access.

## Logging

See [logging.md](.github/logging.md) for documentation on how to use the `addLog` function to record audit logs for important events.

## Database Schema

The database for this project and it's migrations is managed by another project. You can't create or run migrations or modify the database schema directly in this project.

If the schema doesn't show the fields you are expecing, update the schema by running `npm run dump-schema` to get the latest structure.

When working with database-related code in this project:

1. **Always check the current schema** - Read `.copilot/schema.sql` to understand the current database structure before making changes or writing queries. This file contains the authoritative PostgreSQL schema dump.

2. **To update the schema** - Run `npm run dump-schema` to update the schema.sql file with the latest database structure.

3. **Schema file location**: `.copilot/schema.sql`

## Key Database Tables

- `agent` - AI agents with phone numbers and configurations
- `session` - Conversation sessions between users and agents
- `chatUser` - WhatsApp users (identified by phone number)
- `adminUser` - Admin dashboard users
- `apiKey` - API keys for programmatic access (each belongs to an agent)
- `manualMessage` - Messages sent manually via API or admin dashboard
- `userMessage` - Incoming messages from users
- `assistantMessage` - AI-generated responses
- `toolCall` - Tool/function calls made by the AI
- `workerRun` - Background worker execution logs
- `quote` - Quotes for client projects

## Quote Stages

Quotes progress through the following stages (stored as plain English strings in the `quote.status` column):

1. **Draft** - Initial state when a quote is created. The partner is drafting the specification and details.
2. **Sent to Voxd for Cost Pricing** - The partner has submitted the quote to Voxd for cost pricing review.
3. **Cost Pricing Received from Voxd** - Voxd has provided cost pricing (setupFeeVoxdCost, monthlyFeeVoxdCost). The partner can now set their client-facing prices.
4. **Sent to Client** - The quote has been sent to the end client for review.
5. **Closed** - The quote process is complete (accepted or rejected).

### Quote Pricing Fields

- `setupFee` - One-time setup fee charged to the customer (editable by partner owner or admin)
- `monthlyFee` - Recurring monthly fee charged to the customer (editable by partner owner or admin)
- `setupFeeVoxdCost` - Voxd's cost for setup (editable by admin only, visible to partners)
- `monthlyFeeVoxdCost` - Voxd's monthly cost (editable by admin only, visible to partners)

## API Structure

API routes are organized in the `/api` directory with an Express router in `/api/index.ts`.

## Environment

- PostgreSQL with UUID v7 support (`pg_uuidv7` extension)
- Knex.js for migrations and queries
- TypeScript throughout
