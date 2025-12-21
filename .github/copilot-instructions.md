# Copilot Instructions

## Database Schema

When working with database-related code in this project:

1. **Always check the current schema** - Read `.copilot/schema.sql` to understand the current database structure before making changes or writing queries. This file contains the authoritative PostgreSQL schema dump.

2. **After running migrations** - Run `npm run dump-schema` to update the schema.sql file with the latest database structure.

3. **Schema file location**: `.copilot/schema.sql`

## Key Database Tables

- `agent` - AI agents with phone numbers and configurations
- `session` - Conversation sessions between users and agents
- `user` - WhatsApp users (identified by phone number)
- `adminUser` - Admin dashboard users
- `apiKey` - API keys for programmatic access (each belongs to an agent)
- `manualMessage` - Messages sent manually via API or admin dashboard
- `userMessage` - Incoming messages from users
- `assistantMessage` - AI-generated responses
- `toolCall` - Tool/function calls made by the AI
- `workerRun` - Background worker execution logs

## API Structure

API routes are organized in the `/api` directory with an Express router in `/api/index.ts`.

## Environment

- PostgreSQL with UUID v7 support (`pg_uuidv7` extension)
- Knex.js for migrations and queries
- TypeScript throughout
