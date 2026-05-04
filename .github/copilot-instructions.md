# Copilot Instructions

## Development Principles

When contributing to this project, please adhere to the following principles:

- Always create shared components where possible to promote code reuse. If you spot an opportunity to create a shared component, take it.
- Use server actions for any functionality that involves data fetching or mutations, all server action files should be in the `actions/` folder and prefixed with "sa", e.g. `saCreateUser.ts`.

##AI Architecture Overview

Always use the ai sdk from Vercel.
Use the open ai key of the relevant partner, either logged in OR the partner that owns the relevant organisation.

## User Access Levels

See [user-access-levels.md](.github/user-access-levels.md) for detailed documentation on the three user levels (Admin, Partner, Organisation) and what data each can access.

## Permissions

This project now has two permission layers for admin-facing features:

1. **Access scope** answers whether the current admin user can see a resource at all.
2. **Permission definitions** answer whether the current admin user can perform a specific action on that resource.

Do not rely on `superAdmin` checks alone when a permission key exists for the feature. Super admins still bypass permission checks, but feature code should prefer the shared permission helpers so non-super-admin access behaves consistently.

### Permission sources

- `permissionDefinition` stores the permission key, display metadata, `scopeMode`, default value, and whether only super admins can manage that permission.
- `adminUserPermission` stores global explicit overrides for an admin user.
- `adminUserAgentPermission` stores agent-scoped explicit overrides for an admin user.

### Effective permission resolution

Use the shared helpers in `lib/adminUserPermissions.ts` to resolve permissions. The effective value is resolved with the same precedence used by the admin permissions UI:

- For `global` permissions: `adminUserPermission.value ?? permissionDefinition.defaultValue`
- For `agent` permissions: `adminUserPermission.value ?? adminUserAgentPermission.value ?? permissionDefinition.defaultValue`

This means a global explicit value currently overrides an agent-specific explicit value. Keep runtime checks aligned with this precedence unless the permission model itself is intentionally changed.

### Shared helpers

The main permission helpers live in `lib/adminUserPermissions.ts`:

- `getAdminUserPermissionValue({ adminUserId, permissionKey, agentId? })`
  Returns the effective boolean value for a permission. This is the main reusable resolver for new permission-gated features.
- `hasAdminUserPermission({ adminUserId, permissionKey, agentId? })`
  Thin boolean helper that currently delegates to `getAdminUserPermissionValue`. Use this when the calling code only needs a yes/no check.
- `applyAgentScope({ query, accessToken })`
  Applies the current admin user's organisation/partner/super-admin visibility rules to an agent query.
- `getScopedAgentForAdminUser({ agentId, targetAdminUser })`
  Confirms whether a specific agent is within the target admin user's scope.
- `getAccessibleAgentsForAdminUser({ targetAdminUser })`
  Returns the agents available to that admin user for agent-scoped permission management.
- `getAdminUserPermissionsAccess({ targetAdminUserId, accessToken? })`
  Resolves whether the acting admin user can manage another admin user's permissions.

### Resource visibility vs action permissions

Keep resource visibility checks separate from action permission checks:

- Use `userCanViewAgent(...)` for coarse agent visibility.
- Use `hasAdminUserPermission(...)` or `getAdminUserPermissionValue(...)` for feature-specific access such as `read_agent_config` or `write_agent_config`.

For agent-scoped features, compose both checks. A user should not be able to exercise a permission for an agent they cannot access.

### UI requirements

When a feature is not available to the current user:

- Do not render the related tab, button, action, or navigation item.
- If the page is URL-driven and the user manually lands on a hidden tab, normalize to a visible tab instead of rendering an empty state.
- If the user has read access but not write access, prefer rendering the data in a read-only state instead of exposing edit affordances that will fail later.

### Server action requirements

UI hiding is not sufficient. Always enforce the same permission server-side in the action or backend helper that performs the mutation or sensitive read.

Recommended pattern for agent-scoped server actions:

1. Verify the access token.
2. Validate required identifiers.
3. Confirm the user can access the resource with `userCanViewAgent(...)` or the equivalent resource visibility helper.
4. Resolve the feature permission with `hasAdminUserPermission(...)` or `getAdminUserPermissionValue(...)`.
5. Reject the request before performing the read or mutation if the permission check fails.

### Current example

Agent config uses this model:

- `read_agent_config` controls whether the Config tab is visible.
- `write_agent_config` controls whether config can be edited.
- The UI hides the Config tab entirely without read access.
- The config editor becomes read-only when the user can read but cannot write.
- The server action still re-checks access before updating config.

Use this pattern as the template for future permission-gated features across the app.

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
2. **Concept Sent to Client** - The concept has been sent to the client and we're waiting for their interest before proceeding.
3. **Proposal with Client** - The formal proposal has been sent to the end client for review.
4. **Closed Won** or **Closed Lost** - The quote process is complete. "Closed Won" indicates the client accepted, "Closed Lost" indicates the client declined.

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

## Admin Page Tabs & Actions

When building admin detail pages that have tabs and/or action buttons, always use the shared `RecordTabs` component from `@/components/admin/RecordTabs`. This ensures consistent horizontal-scrolling behaviour across all record types.

**Usage:**

```tsx
import RecordTabs, { RecordTab } from "@/components/admin/RecordTabs";
import { TabsContent } from "@/components/ui/tabs";

<RecordTabs
  value={activeTab} // controlled (URL-based) — OR defaultValue="info" for uncontrolled
  tabs={[
    { value: "info", label: "Info", href: `/admin/things/${id}?tab=info` },
    { value: "edit", label: "Edit", href: `/admin/things/${id}?tab=edit` },
  ]}
  actions={<MyActions />} // optional ReactNode pinned to the right
>
  <TabsContent value="info">...</TabsContent>
  <TabsContent value="edit">...</TabsContent>
</RecordTabs>;
```

- Pass `href` on each tab for URL-driven navigation (most pages), or omit it for local `defaultValue` tabs.
- The `label` field accepts `ReactNode`, so you can include badges or icons.
- Conditional tabs should be handled by filtering the array before passing (e.g. spread with ternary).
- Do **not** manually compose `Tabs` + `TabsList` + `TabsTrigger` + divider in admin pages — always use `RecordTabs`.

### Action Buttons (`RecordActions`)

When building action buttons for admin pages, always use the shared `RecordActions` component from `@/components/admin/RecordActions`. This ensures consistent button styling, spacing, dropdown menus, and confirm dialogs across all record types.

Per-page action components are client components that use `RecordActions` internally and are passed as the `actions` ReactNode prop to `RecordTabs`.

**Usage:**

```tsx
import RecordActions from "@/components/admin/RecordActions";

// Single button
<RecordActions buttons={[{ label: "Delete", icon: <Trash2Icon />, variant: "destructive", onClick: handleDelete }]} />

// Button with confirm dialog
<RecordActions buttons={[{
  label: "Delete",
  icon: <Trash2Icon />,
  variant: "destructive",
  loading: isDeleting,
  confirm: { title: "Delete Item", description: "This cannot be undone.", actionText: "Delete", destructive: true },
  onClick: handleDelete,
}]} />

// Button group
<RecordActions buttons={[{ buttons: [
  { label: "View", href: "/example", target: "_blank" },
  { icon: <CopyIcon />, tooltip: "Copy link", onClick: copyLink },
] }]} />

// Ellipsis dropdown (always renders as a single ⋯ button on the far right)
<RecordActions dropdown={{ groups: [
  { items: [
    { label: "Clone", icon: <CopyIcon />, onSelect: () => setCloneOpen(true) },
    { label: "Delete", icon: <Trash2Icon />, danger: true, confirm: {
      title: "Delete", description: "Cannot be undone.", actionText: "Delete",
      destructive: true, onAction: handleDelete,
    }},
  ]},
] }} />

// Custom slot for unique elements (rendered first/leftmost)
<RecordActions custom={<MyStatusDropdown />} buttons={[...]} dropdown={{ ... }} />
```

- `custom`: Arbitrary ReactNode rendered first (for unique elements like status dropdowns, ticket badges).
- `buttons`: Array of `ActionButton` or `ActionButtonGroup` objects. Single buttons default to `variant="outline"` and `size="sm"` (or `size="icon-sm"` if label-less).
- `dropdown`: Single ellipsis menu. Groups are separated by `DropdownMenuSeparator`. Items with `confirm` auto-wrap in the `Alert` confirm dialog. Items with `href` render as links.
- Do **not** manually compose `DropdownMenu` + `Button` + `Alert` in action components — always use `RecordActions`.

## Admin Table Action Buttons

When adding action buttons in the last column of admin `DataTable` components, always use the shared `TableActions` component from `@/components/admin/TableActions`. Do **not** manually compose `<Button>` + `<Link>` + `<Alert>` in the `actions` prop.

**Usage:**

```tsx
import TableActions from "@/components/admin/TableActions";

// Simple single-link (most common) — defaults label to "View"
<DataTable
  actions={(row: any) => (
    <TableActions href={`/admin/things/${row.id}`} />
  )}
/>

// Custom label
<TableActions href={`/admin/things/${row.id}`} label="Edit" />

// Multiple buttons
<TableActions
  buttons={[
    { label: "View", href: `/admin/things/${row.id}` },
    { label: "Link", href: externalUrl, target: "_blank" },
    { label: "Action", variant: "outline", onClick: handleAction },
  ]}
/>

// With confirm dialog
<TableActions
  buttons={[
    { label: "View", href: `/admin/things/${row.id}` },
    {
      label: "Delete",
      variant: "destructive",
      confirm: {
        title: "Delete Item",
        description: "This cannot be undone.",
        actionText: "Delete",
        destructive: true,
        onAction: handleDelete,
      },
    },
  ]}
/>

// Conditional visibility
<TableActions
  buttons={[
    { label: "View", href: "...", hidden: !canView },
    { label: "Close", variant: "destructive", hidden: isClosed, onClick: handleClose },
  ]}
/>

// Icon-only button
<TableActions
  buttons={[
    { icon: <Trash2Icon />, variant: "ghost", confirm: { ... } },
  ]}
/>

// Custom slot for unique elements
<TableActions custom={<MySpecialWidget />} buttons={[...]} />
```

- All buttons render at `size="xs"` for a compact table aesthetic.
- Buttons default to `variant="outline"`. Use `"default"` for primary, `"destructive"` for danger.
- `hidden: true` hides a button without conditional JSX.
- `confirm` wraps the button in an `Alert` confirm dialog.
- Buttons support `icon`, `label`, or both. Icon-only buttons render at `size="icon-xs"`.
- `custom`: Arbitrary ReactNode rendered before the standard buttons.
- Do **not** manually compose `<Button>` + `<Link>` in table action columns — always use `TableActions`.

## Admin Table Links

When adding clickable links inside admin `DataTable` column formatters, always use the shared `TableLink` component from `@/components/adminui/TableLink`. Do **not** use raw `<Link>` or `<a>` tags with manual classes.

```tsx
import TableLink from "@/components/adminui/TableLink";

{
  label: "Name",
  name: "niceName",
  sort: true,
  format: (row: any) => (
    <TableLink href={`/admin/agents/${row.id}`}>{row.niceName}</TableLink>
  ),
}
```
