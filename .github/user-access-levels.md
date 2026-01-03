# User Access Levels

This document describes the different user access levels in the admin dashboard and what data each level can access.

## Access Level Hierarchy

### 1. Admin Users (`admin: true`)

Admins have full access to all data in the system.

**Can access:**

- All organisations
- All agents (across all organisations)
- All sessions (including development sessions)
- All chat users
- All partners
- All WABAs and phone numbers
- All admin users
- All quotes
- All FAQs (including partners-only FAQs)
- CMS features (industries, functions, examples)

**Special permissions:**

- Can view development sessions (non-admins cannot)
- Can access partner management
- Can access WABA and phone number management
- Can create, edit, and delete FAQs

### 2. Partner Users (`partner: true`, has `partnerId`)

Partners are resellers or agencies that manage multiple client organisations.

**Can access:**

- Organisations that belong to their partner (`organisation.partnerId` matches their `partnerId`)
- Agents belonging to those organisations
- Sessions from those agents (excluding development sessions)
- Chat users who have interacted with those agents
- Quotes for their client organisations
- All FAQs (including partners-only FAQs) - view only

**Cannot access:**

- Other partners' data
- WABAs and phone numbers (admin only)
- Admin user management
- CMS features
- FAQ management (create/edit/delete - admin only)

### 3. Organisation Users (regular users)

Regular users are associated with one or more organisations via the `organisationUser` table.

**Can access:**

- Organisations they are associated with (via `organisationUser.adminUserId`)
- Agents belonging to those organisations
- Sessions from those agents (excluding development sessions)
- Chat users who have interacted with those agents
- Quotes for their organisations
- Public FAQs only (those not marked as `partnersOnly`) - view only

**Cannot access:**

- Other organisations' data
- Partner features
- WABAs and phone numbers
- CMS features
- Partners-only FAQs
- FAQ management (create/edit/delete - admin only)

## Data Filtering Implementation

When implementing data access, use the following pattern:

```typescript
const accessToken = await verifyAccessToken();

// Admin - no filtering needed
if (accessToken.admin) {
  // Return all data
}

// Partner - filter by partnerId
if (accessToken.partner && !accessToken.admin) {
  query.where("organisation.partnerId", accessToken.partnerId);
}

// Regular user - filter by organisationUser association
if (!accessToken.partner && !accessToken.admin) {
  query
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .where("organisationUser.adminUserId", accessToken.adminUserId);
}
```

## Development Sessions

Development sessions (`sessionType = 'development'`) are only visible to admin users. Always filter these out for non-admin users:

```typescript
if (!accessToken.admin) {
  base.where("session.sessionType", "!=", "development");
}
```

## Menu Visibility

Menu items in the sidebar use a `roles` property to control visibility:

```typescript
{
  roles: ["admin"],        // Admin only
  roles: ["partner", "admin"],  // Partners and admins
  // No roles property = visible to all authenticated users
}
```
