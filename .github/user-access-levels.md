# User Access Levels

This document describes the different user access levels in the admin dashboard and what data each level can access.

## Access Level Hierarchy

### 1. Super Admin Users (`superAdmin: true`)

Super Admins have full access to all data in the system. This differentiates them from regular admin users who may only have administrative access to their own organisation.

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

- Can view development sessions (non-super-admins cannot)
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
- WABAs and phone numbers (super admin only)
- Admin user management
- CMS features
- FAQ management (create/edit/delete - super admin only)

### 3. Organisation Users (regular admin users)

Regular admin users belong to a single organisation via the `organisationId` column on the `adminUser` table. These are administrative users for specific organisations, not to be confused with Super Admins.

**Can access:**

- The organisation they belong to (via `adminUser.organisationId`)
- Agents belonging to that organisation
- Sessions from those agents (excluding development sessions)
- Chat users who have interacted with those agents
- Quotes for their organisation
- Public FAQs only (those not marked as `partnersOnly`) - view only

**Cannot access:**

- Other organisations' data
- Partner features
- WABAs and phone numbers
- CMS features
- Partners-only FAQs
- FAQ management (create/edit/delete - super admin only)

## Data Filtering Implementation

When implementing data access, use the following pattern:

```typescript
const accessToken = await verifyAccessToken();

// Super Admin - no filtering needed
if (accessToken.superAdmin) {
  // Return all data
}

// Partner - filter by partnerId
if (accessToken.partner && !accessToken.superAdmin) {
  query.where("organisation.partnerId", accessToken.partnerId);
}

// Regular admin user - filter by organisationId
if (!accessToken.partner && !accessToken.superAdmin) {
  query.where("organisation.id", accessToken.organisationId);
}
```

## Development Sessions

Development sessions (`sessionType = 'development'`) are only visible to super admin users. Always filter these out for non-super-admin users:

```typescript
if (!accessToken.superAdmin) {
  base.where("session.sessionType", "!=", "development");
}
```

## Menu Visibility

Menu items in the sidebar use a `roles` property to control visibility:

```typescript
{
  roles: ["admin"],        // Super Admin only
  roles: ["partner", "admin"],  // Partners and super admins
  // No roles property = visible to all authenticated users
}
```
