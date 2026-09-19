# Migration History

All database migrations are located in `supabase/migrations/`. Apply them in numeric order.

---

## 000_foundation

**Purpose** — Core identity and membership schema.

| Object | Type | Description |
|---|---|---|
| `user_role` | Enum | `SUPER_ADMIN`, `CHAIR`, `ADMIN`, `TREASURER`, `RESIDENT` |
| `rt` | Table | RT (neighbourhood unit) profiles — name, code, monthly fee |
| `users` | Table | Application user accounts linked to Supabase Auth |
| `residents` | Table | Resident (warga) records belonging to an RT |
| `memberships` | Table | Many-to-many join between users, residents, and RTs; carries role and status |

---

## 001_financial

**Purpose** — Payment and expense financial tables plus the double-entry ledger.

| Object | Type | Description |
|---|---|---|
| `payment_confirmations` | Table | Resident-submitted payment requests (pending → approved / rejected) |
| `confirmation_details` | Table | Per-month line items for a payment confirmation |
| `payments` | Table | Approved payment records (immutable after approval) |
| `payment_details` | Table | Per-month line items for an approved payment |
| `expense_categories` | Table | Configurable expense categories (seeded with 12 defaults) |
| `expenses` | Table | Expense records submitted by treasurer / admin |
| `ledger` | Table | Append-only double-entry cashflow ledger with running balance |

**Seed data** — 12 default expense categories inserted at migration time.

---

## 002_communication

**Purpose** — In-app notifications and audit trail.

| Object | Type | Description |
|---|---|---|
| `notifications` | Table | Per-user in-app notifications (read / unread) |
| `activity_logs` | Table | Immutable audit trail of all business actions |

---

## 003_registration

**Purpose** — RT and resident self-service registration workflow.

| Object | Type | Description |
|---|---|---|
| `registration_requests` | Table | Pending RT or resident registration submissions |
| `activation_invites` | Table | Email invitations generated upon registration approval |
| `notify_on_new_registration()` | Trigger function | `SECURITY DEFINER` trigger that creates notifications on new registration requests — fires `AFTER INSERT ON registration_requests` |

---

## 004_constraints

**Purpose** — Data integrity constraints and query indexes.

### Constraints

| Target | Constraint |
|---|---|
| `registration_requests.status` | CHECK — `pending`, `approved`, `rejected`, `expired` |
| `payment_confirmations.status` | CHECK — `pending`, `approved`, `rejected` |
| `expenses.status` | CHECK — `pending`, `approved`, `rejected` |
| `payment_confirmations.total_amount` | CHECK — must be positive |
| `expenses.amount` | CHECK — must be positive |
| `payment_confirmations.year` | CHECK — `>= 2020` |
| `payment_details.year` | CHECK — `>= 2020` |
| `payment_details.month` | CHECK — `1 – 12` |
| `payment_details (resident_id, year, month)` | UNIQUE — one approved payment per resident per month |

### Indexes

Indexes on foreign keys, soft-delete (`deleted_at IS NULL`) partial indexes, and frequently filtered columns across: `ledger`, `notifications`, `memberships`, `residents`, `payment_confirmations`, `payments`, `expenses`, `activity_logs`, `confirmation_details`, `payment_details`.

---

## 005_functions

**Purpose** — All stored functions and triggers (depends on 000–003).

### Helper functions

| Function | Description |
|---|---|
| `get_last_balance(rt_id)` | Returns the most recent ledger balance for an RT (`0` if none) |
| `insert_ledger(...)` | Appends a ledger entry with a running balance; returns new row id |
| `is_super_admin()` | `SECURITY DEFINER` — returns true if current user has `SUPER_ADMIN` role |
| `get_user_rt_ids()` | `SECURITY DEFINER` — returns all active RT IDs for the current user |
| `is_member_of_rt(rt_id)` | `SECURITY DEFINER` — returns true if current user is an active member of the given RT |
| `generate_rt_code()` | `SECURITY DEFINER` — returns the next available `RT-XXXX` code, accounting for in-flight registrations |
| `cleanup_expired_registrations()` | `SECURITY DEFINER` — marks `pending` requests past `expires_at` as `expired`; intended for nightly pg_cron |

### Business workflow functions

| Function | Description |
|---|---|
| `approve_confirmation(confirmation_id, user_id)` | Atomically approves a payment confirmation: validates status → inserts `payments` + `payment_details` → writes ledger entry → notifies resident |
| `reject_confirmation(confirmation_id, reason, user_id)` | Marks confirmation as rejected and notifies resident |
| `approve_expense(id, user_id)` | Approves an expense: writes ledger debit entry → notifies creator |
| `reject_expense(id, reason, user_id)` | Marks expense as rejected and notifies creator |
| `approve_all_pending_expenses(rt_id, user_id)` | Approves all pending expenses for an RT atomically; uses `SKIP LOCKED` |

### Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `trg_prevent_system_rt_delete` | `rt` | `BEFORE DELETE` | Raises exception if the System RT row (`00000000-...-0001`) is targeted |
| `trg_registration_requests_updated_at` | `registration_requests` | `BEFORE UPDATE` | Stamps `updated_at` |
| `trg_users_updated_at` | `users` | `BEFORE UPDATE` | Stamps `updated_at` |
| `trg_residents_updated_at` | `residents` | `BEFORE UPDATE` | Stamps `updated_at` |
| `trg_notifications_updated_at` | `notifications` | `BEFORE UPDATE` | Stamps `updated_at` |
| `trg_expenses_updated_at` | `expenses` | `BEFORE UPDATE` | Stamps `updated_at` |
| `trg_expense_categories_updated_at` | `expense_categories` | `BEFORE UPDATE` | Stamps `updated_at` |

### Dev utility

| Function | Description |
|---|---|
| `populate_cashflow(year, ...)` | `service_role` only — generates synthetic payment and expense records for testing |

---

## 006_storage

**Purpose** — Supabase Storage bucket definitions.

| Bucket | Public | Size Limit | Allowed Types | Purpose |
|---|---|---|---|---|
| `rt-assets` | Yes | 2 MB | JPEG, PNG, WebP | RT logo and QRIS image |
| `payment-proof` | Yes | 5 MB | JPEG, PNG, PDF | Proof-of-payment uploads by residents |
| `expense-receipts` | Yes | 5 MB | JPEG, PNG, PDF | Expense receipt attachments |

---

## 007_rls

**Purpose** — Row Level Security policies for all tables and storage buckets (depends on 000–005).

**Design** — every RT-scoped table uses the same pattern:

- `SELECT` — `rt_id IN (get_user_rt_ids()) OR is_super_admin()`
- `INSERT` — `is_member_of_rt(rt_id) OR is_super_admin()`
- `UPDATE` — same predicates as SELECT (USING) and INSERT (WITH CHECK)

Detail tables without a direct `rt_id` column (e.g. `confirmation_details`, `payment_details`) scope through their parent row.

Role-based access within an RT (e.g. treasurer-only actions) is enforced at the service layer per `PERMISSION_MATRIX.md`.

### RLS enabled on

`rt`, `users`, `residents`, `memberships`, `payment_confirmations`, `confirmation_details`, `payments`, `payment_details`, `expenses`, `ledger`, `notifications`, `activity_logs`, `registration_requests`, `activation_invites`

### Notable policies

| Table | Policy notes |
|---|---|
| `rt` | All authenticated users can SELECT; only SUPER_ADMIN can INSERT or DELETE |
| `users` | All authenticated users can SELECT (needed for name lookups) |
| `memberships` | Users read only their own row; SUPER_ADMIN reads all; all writes are SUPER_ADMIN only |
| `notifications` | Users see and update only their own notifications; any authenticated user can INSERT |
| `activity_logs` | INSERT requires `rt_id IN get_user_rt_ids()` — prevents RLS 42501 for non-SUPER_ADMIN callers |
| `registration_requests` | Anonymous users can INSERT (public registration); SUPER_ADMIN manages RT type; ADMIN/CHAIR manages resident type |
| `activation_invites` | Writes go through `service_role` (bypasses RLS); reads for SUPER_ADMIN and ADMIN/CHAIR only |

### Storage policies

All three buckets (`rt-assets`, `payment-proof`, `expense-receipts`) allow public SELECT and authenticated INSERT, UPDATE, DELETE.

---

## 008_realtime

**Purpose** — Supabase Realtime subscriptions for live UI updates.

| Table | Notes |
|---|---|
| `payment_confirmations` | Live confirmation status updates |
| `payments` | Live payment approval feed |
| `expenses` | Live expense status updates |
| `ledger` | Live cashflow / running balance |
| `residents` | Live resident list updates |
| `activity_logs` | Live activity feed |
| `notifications` | FULL replica identity — UPDATE events deliver the complete row (including `is_read`) to clients |
| `registration_requests` | Live badge counter and management page for SUPER_ADMIN |

---

## 009_seed

**Purpose** — System bootstrap data. Run once on initial setup.

| Object | Value | Notes |
|---|---|---|
| System RT | `id = 00000000-0000-0000-0000-000000000001`, `code = 'SYS'` | Reserved for SUPER_ADMIN membership; hardcoded in application code and `prevent_system_rt_delete` trigger; UUID must never change |

**pg_cron** — A commented-out `cron.schedule` call configures a nightly job (`0 2 * * *`) to run `cleanup_expired_registrations()`. Requires the `pg_cron` extension to be enabled in the Supabase dashboard before uncommenting.

