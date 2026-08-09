# BUSINESS_RULES.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)
>
> Last Updated: July 2026

---

# 1. Purpose

This document defines the official business rules of KasWarga.

Business rules are independent of implementation.

Every feature, service, test case, and UI must comply with these rules.

Business Rule IDs (BR-xxx) are stable references and should never be reused.

Permission codes referenced in this document are defined in PERMISSION_MATRIX.md.

---

# 2. Authentication

## BR-001

Only authenticated users may access protected resources.

---

## BR-002

Every request must belong to an active session.

---

## BR-003

Inactive users cannot log in.

---

## BR-004

Deleted users cannot log in.

---

# 3. RT Management

## BR-010

RT registration approval requires `rt.approve` permission.

---

## BR-011

Each RT must have exactly one active Chair.

---

## BR-012

Each RT must have at least one Treasurer.

---

## BR-013

Each RT must have at least one Administrator.

---

## BR-014

Super Administrator does not have access to RT financial data.

This is enforced by the permission matrix, not by role name checks.

---

## BR-015

Archived RT cannot accept new residents.

---

# 4. Resident Registration

## BR-020

Resident registration must reference a valid RT code.

---

## BR-021

Resident registration starts in PENDING status.

---

## BR-022

Resident registration approval and rejection require `registration.approve` and `registration.reject` permissions respectively.

---

## BR-023

Approving registration automatically creates:

- User
- Resident
- Membership
- Activation Token

---

## BR-024

Rejected registration must not create any user.

---

## BR-025

Expired activation token cannot be used.

---

## BR-026

Bulk resident import creates `residents` rows without user accounts or memberships.

Imported residents cannot log in or interact with the system until they complete registration and activation.

---

## BR-027

When an imported resident registers and activates, the system attempts to claim an existing imported resident row instead of creating a duplicate.

Claiming logic during activation:

1. If a `residents` row in the same RT has the same email → reuse that row.
2. Otherwise, if the role is RESIDENT and the registration request contains `block` and `house_number` → search for an unlinked `residents` row in the same RT matching both fields (case-insensitive).
3. If a match is found and it has no existing membership → claim it: update the resident's `name`, `email`, and `phone` with data from the registration request, then link it to the new membership.
4. If no match is found → create a new `residents` row.

This ensures imported resident data is not duplicated when the resident later self-registers.

---

# 5. User Management

## BR-030

Email must be unique across the system.

---

## BR-031

One user may belong to multiple RTs.

(Future ready)

---

## BR-032

Role assignment must always belong to a Membership.

---

## BR-033

Removing Membership immediately revokes all permissions of that Membership.

---

## BR-034

Only RT Admin may change the role of a member within their RT.

Requires permission `membership.role_update`.

---

## BR-035

An RT must always have at least one active Administrator.

Role changes that would demote the last active Administrator are rejected.

This is enforced at both the API layer (HTTP 422) and the database layer (trigger `trg_guard_min_rt_admin` on `memberships`).

---

# 6. Payment

## BR-040

Resident may submit payment only for their own RT.

---

## BR-041

Payment starts with PENDING status.

---

## BR-042

Payment approval must be authorized according to the active authorization policy.

---

## BR-043

Payment rejection must be authorized according to the active authorization policy.

---

## BR-044

Approved payment cannot be modified.

---

## BR-045

Rejected payment cannot create ledger entry.

---

## BR-046

Approving payment automatically creates:

- Ledger Entry
- Notification
- Activity Log

---

## BR-047

Duplicate approval is prohibited.

---

## BR-048

Payment amount must be greater than zero.

---

# 7. Ledger

## BR-050

Ledger is append-only.

---

## BR-051

Ledger entries cannot be deleted.

---

## BR-052

Corrections must use adjustment entries.

---

## BR-053

Every approved payment creates exactly one ledger entry.

---

## BR-054

Every expense creates exactly one ledger entry.

---

# 8. Expense

## BR-060

Expense creation requires `expense.create` permission.

---

## BR-061

Expense amount must be greater than zero.

---

## BR-062

Expense automatically updates balance.

---

## BR-063

Expense automatically creates activity log.

---

## BR-064

Expense approval requires `expense.approve` permission.

Only the RT Chair holds this permission by default.

---

## BR-065

Expense rejection requires `expense.reject` permission.

Only the RT Chair holds this permission by default.

---

# 9. Notification

## BR-070

Notifications are generated by business events.

---

## BR-071

Notification delivery failure must not rollback business transactions.

---

## BR-072

Notification can be marked as READ only by its owner.

This requires `notification.mark-read` permission scoped to own data.

---

# 10. Activity Log

## BR-080

Every critical business action must create an activity log.

---

## BR-081

Activity logs are immutable.

---

## BR-082

Activity log stores:

- Actor
- Action
- Target
- Timestamp
- Metadata

---

# 11. Dashboard

## BR-090

Dashboard is read-only.

---

## BR-091

Dashboard never stores calculated values.

---

## BR-092

Dashboard data is generated from business tables.

---

# 12. Authorization (RBAC v2)

## BR-120

Authorization follows the RBAC v2 model.

Resolution order:

```
User → Role → Default Role Permissions → RT Overrides → Effective Permissions
```

---

## BR-121

Business modules must never compare role names directly.

Forbidden:

```ts
if (role === 'TREASURER');
```

Required:

```ts
permissionService.hasPermission(userId, 'payment.approve')
```

---

## BR-122

Permissions are assigned to Roles, not to individual users.

---

## BR-123

Each RT may override selected default permissions for its members without creating new roles.

---

## BR-124

When an RT override exists for a permission, it replaces the default role permission.

When no override exists, the default role permission applies.

---

## BR-125

Permission codes must follow the `module.action` format and must be defined in PERMISSION_MATRIX.md before use.

---

## BR-126

PERMISSION_MATRIX.md is the single source of truth for authorization.

Any permission change must be reflected there before implementation.

---

## BR-127

Scope restrictions (`own data only`) are enforced by RLS, not by the application layer alone.

---

## BR-128

SUPER_ADMIN bypasses all role and permission resolution unconditionally.

A user with a SUPER_ADMIN membership holds every permission in the system.

This bypass is detected in a single database query — no role table lookups are performed.

---

## BR-129

RT permission overrides apply at the RT + role level, not per individual member.

An override for role RESIDENT in RT-A affects all RESIDENT members in RT-A equally.

There are no individual-member permission overrides.

---

# 13. Role Management

## BR-130

Roles may be created and updated. Roles must never be deleted.

Deactivation is the only way to retire a role.

---

## BR-131

System roles (`is_system = true`) are platform-managed.

Their `code` and `name` are immutable and cannot be changed by operators.

`description` may be updated by an authorized administrator.

---

## BR-132

A user may not deactivate the role they currently hold.

Self-deactivation would lock the user out of the system and is prohibited.

This is enforced at the service layer and is not bypassable through the UI.

---

## BR-133

SUPER_ADMIN is a platform-level role that operates outside RT scope.

It must not appear in RT-level role management lists or the permission matrix.

SUPER_ADMIN bypasses the permission system unconditionally and has no configurable permissions.

---

## BR-134

Deactivating a role does not revoke permissions of existing members who hold that role.

It prevents the role from being newly assigned and hides it from management UIs.

---

# 14. Permission Matrix

## BR-140

The Permission Matrix defines the default permission assignments for each role.

Changes to the matrix apply globally to all RTs that have not overridden the affected permissions.

---

## BR-141

Permission Matrix changes require an explicit Save action.

Changes are never applied automatically. Unsaved changes must be discarded or confirmed before navigating away.

---

## BR-142

RT-specific permission overrides take precedence over the global Permission Matrix.

A change to the global matrix does not override existing RT overrides for the same permission.

---

## BR-143

SUPER_ADMIN is excluded from the Permission Matrix.

Its permissions cannot be configured because it unconditionally bypasses the permission system.

---

# 15. Income Management

## BR-150

Income Management (Pemasukan) handles non-iuran cash inflows to the RT.

Examples include: donations, government transfers, event proceeds, bazaar sales, rental income, bank interest.

Income is distinct from Payments (iuran warga). The payment workflow remains unchanged.

---

## BR-151

An income transaction is created with status=pending.

Only users with income.create permission may create income transactions.

---

## BR-152

An income transaction may only be approved or rejected while its status is pending.

Approval changes status to approved and calls insert_ledger() with type='pemasukan' and source='income'.

Rejection changes status to rejected and records the rejection reason.

---

## BR-153

Only users with income.approve or income.reject permission may perform those actions.

---

## BR-154

Approved income automatically creates a ledger entry.

The ledger entry uses: type=pemasukan, source=income, reference_id=income.id.

The cashflow chart on the dashboard reflects approved income.

---

## BR-155

Income categories are managed through database migrations only.

There is no CRUD UI for income categories.

---

# 16. Security

## BR-100

Authorization is enforced on the server.

---

## BR-101

Client-side permission checks are informational only.

---

## BR-102

RLS is mandatory for business tables.

RLS is the final data protection layer and cannot be bypassed by application logic.

---

# 16. General Principles

## BR-110

Business logic belongs in Services.

---

## BR-111

Repositories must not implement business rules.

---

## BR-112

Components must not access Supabase directly.

---

## BR-113

Business rules take precedence over implementation.

---

# 17. Shared Import Framework

## BR-160

All bulk imports (Resident, Payment, Income) are processed through the Shared Import Framework.

Imports are submitted to `POST /api/import` and processed asynchronously in the background via Next.js `after()`.

The dialog closes immediately after job creation; progress is delivered via Supabase Realtime.

---

## BR-161

Import types define their approval policy:

| Import Type | Approval Policy | Effect |
|-------------|-----------------|--------|
| RESIDENT    | NONE            | Rows committed immediately after validation |
| PAYMENT     | BATCH           | Job enters PENDING_APPROVAL; approver must confirm |
| INCOME      | BATCH           | Job enters PENDING_APPROVAL; approver must confirm |

---

## BR-162

For BATCH approval policy, the user who submitted the import (importer) cannot approve their own import batch.

Importer ≠ Approver is enforced at the API layer.

---

## BR-163

Approval is atomic. A concurrent approval attempt on the same job is rejected if the job is no longer in PENDING_APPROVAL status.

---

## BR-164

Import jobs and their row results are scoped to the submitter's RT.

Users in other RTs cannot view or approve import jobs belonging to a different RT.

---

## BR-165

All row results (VALID, INVALID, SKIPPED) are persisted in `import_job_rows` during processing.

VALID rows are stored with their raw data so the approval route can reconstruct and commit them server-side without the client re-sending data.

---

## BR-166

Import permissions follow the same RBAC model as other permissions.

`resident.import`, `payment.update` (for payment import), and `income.import` govern who may initiate imports.

`payment.approve` and `income.approve` govern who may approve BATCH import jobs.

---

---

# Part X — Authorization Rules (RBAC v2)

## Purpose

This section defines how authorization is applied to all business rules in KasWarga.

Business Rules describe **what** operations are permitted or prohibited.

RBAC v2 determines **who** is authorized to perform those operations.

Authorization implementation details are intentionally separated from business rules to ensure long-term maintainability.

---

# Authorization Principles

The following principles apply to every protected operation in the application.

1. Authentication is required before authorization.
2. Authorization is evaluated using the active AuthorizationContext.
3. Business Services enforce authorization before executing business logic.
4. PostgreSQL Row-Level Security (RLS) remains the final authorization layer.
5. UI visibility does not grant authorization.
6. Authorization decisions are permission-based and never rely on hardcoded role names.

---

# General Authorization Rule

Every protected business operation must satisfy all the following conditions:

1. The requester is authenticated.
2. The requester is authorized according to the active AuthorizationContext.
3. Business validation succeeds.
4. PostgreSQL RLS permits the operation.

Failure of any condition must reject the operation.

---

# Resident Management

Resident-related operations require authorization.

Examples include:

- Creating residents
- Updating resident information
- Deleting residents
- Approving resident registration
- Rejecting resident registration

The specific permission required for each operation is defined in the Permission Catalog.

Business Rules intentionally do not reference permission codes directly.

---

# Payment Management

Payment operations require authorization.

Examples include:

- Recording payments
- Updating payment information
- Approving payments
- Rejecting payments
- Cancelling payments

Only an authorized actor may perform these operations.

Business Services determine authorization using AuthorizationContext.

---

# Expense Management

Expense operations require authorization.

Examples include:

- Creating expenses
- Editing expenses
- Deleting expenses
- Approving expenses (if applicable)

Authorization is evaluated before business validation.

---

# Ledger Management

Ledger operations require authorization.

Examples include:

- Viewing ledger entries
- Creating ledger adjustments
- Exporting ledger reports

Ledger integrity rules remain unchanged.

Authorization determines whether the requester may execute the operation.

---

# Report Access

Reports require authorization.

Authorization may vary between RTs through Permission Override.

Business Rules remain identical regardless of local configuration.

---

# Permission Override

KasWarga supports RT-specific permission customization.

Permission Override changes authorization behavior only.

It never changes business rules.

Example:

Business Rule:

> Resident registration requires authorization.

RT A:

Treasurer may approve registrations.

RT B:

Treasurer may not approve registrations.

The business rule remains identical.

Only authorization differs.

---

# Business Rule Independence

Business Rules must never depend on:

- Role names
- Default roles
- Organization structure

Business Rules define business behavior only.

Authorization determines who may execute that behavior.

---

# Authorization Decision Flow

Every protected operation follows this sequence.

```
Authentication

↓

AuthorizationContext

↓

Business Authorization

↓

Business Validation

↓

Repository

↓

PostgreSQL RLS

↓

Commit
```

Skipping any stage is prohibited.

---

# Separation of Responsibilities

Business Rules

Responsible for:

- Domain rules
- Business constraints
- Validation requirements

Business Rules are NOT responsible for:

- Role evaluation
- Permission lookup
- Session validation

Authorization is handled by the Authorization Architecture.

---

# Future Compatibility

This design allows each RT to define different permission assignments without modifying Business Rules.

Business behavior remains consistent across all RTs.

Only authorization policy changes.

This ensures long-term maintainability while supporting flexible organizational structures.

---

# Architecture Reference

The authorization model described in this section is implemented by:

- AUTHORIZATION_ARCHITECTURE.md
- AUTHORIZATION_PIPELINE.md
- PERMISSION_SERVICE.md
- REQUEST_CONTEXT.md
- API_SECURITY.md
- RLS_POLICY.md

These documents describe the runtime implementation of the authorization model.

BUSINESS_RULES.md remains the source of truth for domain behavior.

End of Document
