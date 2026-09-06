# Sprint 5.9 — Income Donation & Donation Tracking: Design Document

> Status: Implemented — reflects Sprint 5.9 as built.
>
> Last Updated: 2026-08-27

---

## 1. Background

The current Income module (`income_transactions`) records individual cash inflows per transaction. There is no concept of a **fundraising Donation**: a coordinated effort to collect donations from multiple sources toward a specific goal (e.g., "Renovasi Balai RT", "Santunan Anak Yatim Idul Fitri").

Without Donations:
- Treasurers manually group `DONATION` entries by `income_name` to estimate progress.
- There is no target amount, deadline, or progress visualization.
- Donors have no visibility into what they contributed to or what reference code to use for bank transfers.

Sprint 5.9 introduces a first-class **Donation** entity that existing `DONATION` income transactions link to, a human-readable **Contribution Code** for each monetary contribution, and a UI to create and monitor Donations.

---

## 2. Scope

### In scope
- `income_donations` table with status lifecycle, target, deadline, and Donation Code.
- `contribution_code` field on `income_transactions` for Donation-linked monetary contributions (copied from `donation_code` at insert time).
- In-kind contribution recording (description, quantity, estimated value) on `income_transactions`.
- RBAC permissions for Donation management.
- Donation list tab within the Income module.
- Donation detail drawer showing progress (approved + pending), donation list with contribution codes, and in-kind list.
- `IncomeForm` extended: Donation selector when category = `DONATION`; contribution code shown in success state.
- Donation cards on Home (resident home) and Dashboard (staff dashboard) for all RT members.
- Resident donation flow: pre-filled form from Donation card.
- Activity log entries for Donation lifecycle events.
- Notification when Donation target is reached.
- Income import template: optional `donation_name` column.

### Out of scope
- Public donation links, QR codes, or crowdfunding pages.
- Recurring Donations or pledge tracking.
- Resident self-service Donation creation.
- Bank API integration or automatic reconciliation.
- Scheduler/cron infrastructure solely for Donation expiry.
- Donor profiles, rankings, or leaderboards.
- WhatsApp/SMS channels.
- Separate Donation ledger or financial accounting system.

---

## 3. Domain Terminology

All terms follow `docs/development/GLOSSARY.md`. New terms introduced by this sprint:

| Term | Indonesian | Definition |
|---|---|---|
| Donation | Kampanye Donasi | Named fundraising effort with optional target amount and deadline |
| Monetary Contribution | Donasi Tunai | An `income_transaction` of category `DONATION` linked to a Donation |
| In-Kind Contribution | Donasi Non-Tunai | A non-cash contribution (goods, materials, services) linked to a Donation |
| Contribution | Kontribusi | Either a monetary or in-kind contribution to a Donation |
| Donation Code | Kode Transfer Kampanye | Per-Donation bank transfer reference code entered by ALL donors of the same Donation (e.g. `MAROENS8AGT26`). Set once at Donation creation; never changes. |
| Contribution Code | Kode Kontribusi | The bank transfer reference on a specific `income_transaction` — copied directly from the Donation's `donation_code` at insert time. All donors of the same Donation share the same value. |
| Official Progress | Progres Resmi | Sum of approved monetary contributions linked to the Donation |
| Donation Status | Status Kampanye | `DRAFT`, `ACTIVE`, `COMPLETED`, or `CANCELLED` |

---

## 4. Data Model

### 4.1 New Table: `income_donations`

```sql
CREATE TABLE income_donations (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    rt_id          uuid        NOT NULL,
    name           text        NOT NULL,
    donation_code  text        NOT NULL,
        -- Human-readable bank transfer reference code; 3-20 chars; RT-unique across all Donations
        -- including deleted. Example: MAROENS8AGT26 (RT code + Donation abbreviation + year).
        -- All donors of this Donation write this same code in their bank transfer remark.
    description    text,
    target_amount  bigint,
        -- NULL means open-ended (no target)
    starts_at      date        NOT NULL DEFAULT CURRENT_DATE,
    ends_at        date,
        -- NULL means no deadline; expiry is evaluated lazily (see §7.3)
    status         text        NOT NULL DEFAULT 'DRAFT',
        -- DRAFT | ACTIVE | COMPLETED | CANCELLED
    cancelled_note text,
        -- reason when manually CANCELLED
    created_by     uuid,
    updated_by     uuid,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,
    deleted_by     uuid,

    CONSTRAINT income_donations_pkey
        PRIMARY KEY (id),
    CONSTRAINT income_donations_rt_fk
        FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE,
    CONSTRAINT income_donations_code_rt_unique
        UNIQUE (rt_id, donation_code)
        -- Spans ALL Donations including deleted: a code retires permanently
        -- once used, so historical contribution records remain unambiguous.
);
```

**Status transitions:**

```
DRAFT  → ACTIVE      (publish; begins accepting contributions)
ACTIVE → COMPLETED   (target reached — evaluated synchronously; see §7.2)
ACTIVE → CANCELLED   (explicit administrative action)
DRAFT  → CANCELLED   (discard before activation)

COMPLETED / CANCELLED → read-only (no new contributions accepted)
```

There is **no `EXPIRED` status**. When `ends_at < today`, the Donation is excluded from active lists via a query filter. The `status` column does not change automatically (see §7.3).

**Contribution acceptance window:** a Donation accepts new contributions only when all three conditions hold:

```sql
status = 'ACTIVE'
AND starts_at <= CURRENT_DATE   -- not yet started Donations are published but not open
AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
```

This means an RT_ADMIN can publish (activate) a Donation in advance — it becomes `ACTIVE` in the DB but does not appear in the `IncomeForm` selector or Beranda/Dasbor widgets until `starts_at` is reached. The `POST /api/income` handler must enforce all three conditions server-side.

### 4.2 Alter `income_transactions`

**Prerequisite — extend the `income_category` enum:**

```sql
ALTER TYPE income_category ADD VALUE 'IN_KIND';
-- PostgreSQL enum additions are transactional (PG 12+) and irreversible.
-- Must be the first statement in the migration that references IN_KIND.
```

The existing `income_category` enum in `024_income_tables.sql` defines: `DONATION, GOVERNMENT, EVENT, BAZAAR, RENTAL, SALES, INTEREST, OTHER`. `IN_KIND` is not present and must be added before any `IN_KIND` rows can be inserted.

**Add new columns:**

```sql
ALTER TABLE income_transactions
    ADD COLUMN donation_id           uuid,
    ADD COLUMN contribution_code     text,
        -- nullable; only set for Donation-linked DONATION transactions;
        -- copied from income_donations.donation_code at insert time (same value for all donors)
    ADD COLUMN in_kind_description   text,
        -- free text description; only set when income_category = 'IN_KIND'
    ADD COLUMN in_kind_quantity      numeric,
        -- optional physical quantity (e.g. 5 for "5 sak semen")
    ADD COLUMN in_kind_unit          text,
        -- optional unit of measure (e.g. 'sak', 'kg', 'pcs')
    ADD CONSTRAINT income_transactions_donation_fk
        FOREIGN KEY (donation_id) REFERENCES income_donations(id) ON DELETE RESTRICT;
        -- RESTRICT prevents hard-deleting a Donation that has any income_transactions.
        -- Soft-delete (setting deleted_at) does NOT trigger this constraint.
        -- The application layer independently blocks Donation deletion when contributions exist.

CREATE INDEX idx_income_donation_id
    ON income_transactions (donation_id);
```

**Schema compatibility notes:**

- `donation_id` is nullable — all existing `income_transactions` rows are unaffected.
- `contribution_code` is nullable — only set for `income_category = 'DONATION'` with `donation_id` set. Copied directly from `income_donations.donation_code` at insert time; **never editable after creation** (see §4.6). Because all donors of the same Donation share the same code, there is no uniqueness constraint on this column.
- `in_kind_*` columns are nullable — only set for `income_category = 'IN_KIND'`. In-kind contributions do **not** increase monetary Donation progress.
- `amount bigint NOT NULL` is **not altered**. The existing constraint is preserved. For in-kind contributions, `amount` carries the operator's estimated IDR value, or `0` if no estimate is available. This avoids an ALTER to an existing NOT NULL column and keeps all existing SUM queries safe (see note below).

**Impact on existing SUM queries:**

Existing queries that sum `income_transactions.amount` (e.g., ledger totals, income reports) will include in-kind estimated values when `amount > 0`. This is correct: an in-kind item with an estimated value IS a form of income. If `amount = 0`, it contributes nothing to totals. No existing query needs to change. Donation progress queries already filter `income_category = 'DONATION'` (see §7.5), so in-kind rows are naturally excluded from progress calculation.

**In-kind ledger behavior:**

When an in-kind contribution is approved, a ledger entry (type=pemasukan, source=income) is created **only if `amount > 0`**. If `amount = 0`, no ledger entry is created. This mirrors how zero-amount transactions would behave in the existing approval handler.

### 4.3 Entity Relationship

```
rt
 │  maker_checker_enabled  boolean NOT NULL DEFAULT TRUE
 │
 ├── income_donations
 │       id (uuid, PK)
 │       rt_id          FK → rt.id
 │       donation_code  (text, RT-unique; bank transfer reference for all donors)
 │       name, description, target_amount
 │       starts_at, ends_at, status
 │       …audit columns…
 │
 └── income_transactions  (existing table, extended)
         id (uuid, PK)
         rt_id          FK → rt.id
         donation_id    nullable FK → income_donations.id
         contribution_code   nullable text; = donation_code when set (same for all donors)
         income_category     (DONATION | IN_KIND | existing categories)
         amount              bigint, IDR
         status              pending | approved | rejected
         in_kind_description, in_kind_quantity, in_kind_unit  (nullable)
         …existing columns…
```

`income_transaction` is the **single authoritative financial record**. No separate Donation ledger exists. The `donation_id` FK on `income_transactions` is the only link between the two tables.

### 4.4 Migration Placement

Migration: **`031_income_donations.sql`**

Contents (order matters — enum extension must be first):
1. `ALTER TYPE income_category ADD VALUE 'IN_KIND'` — extends existing enum from `024_income_tables.sql`.
2. Creates `income_donations` table (with `donation_code` column).
3. Alters `income_transactions` (adds `donation_id`, `contribution_code`, `in_kind_*` columns, FK, index).
4. Alters `rt` table — adds `maker_checker_enabled boolean NOT NULL DEFAULT TRUE`.
5. Enables RLS on `income_donations` and creates policies (see §4.5).
6. Seeds permission records (see §5).

### 4.5 RLS Policies

```sql
ALTER TABLE income_donations ENABLE ROW LEVEL SECURITY;

-- All authenticated RT members can see Donations for their RT (enables Beranda/Dasbor widget)
CREATE POLICY "Donation: view"
    ON income_donations FOR SELECT TO authenticated
    USING (
        rt_id IN (SELECT rt_id FROM memberships WHERE user_id = auth.uid())
        AND deleted_at IS NULL
    );

CREATE POLICY "Donation: create"
    ON income_donations FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'income.donation.create'));

CREATE POLICY "Donation: update"
    ON income_donations FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'income.donation.update') AND deleted_at IS NULL)
    WITH CHECK (has_permission(rt_id, 'income.donation.update'));

CREATE POLICY "Donation: delete"
    ON income_donations FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'income.donation.delete'));
```

The view policy is intentionally broader than `income.view`: all RT members (including RESIDENT) can see their RT's Donations. Cross-RT access is prevented by the RT membership check — a resident or staff member of RT A cannot see RT B's Donations.

### 4.6 Donation Code and Contribution Code

**Donation Code (`donation_code`)** is a per-Donation bank transfer reference code set once at Donation creation. All donors of the same Donation use the same code as the bank transfer remark. It is a human-readable, concise string derived by Treasurer intuition from the RT name and Donation name:

```
Examples:
  MAROENS8AGT26    ← RT "MAROENS8" + Donation "Agustusan 2026"
  MAROENS8BENCANA  ← RT "MAROENS8" + Donation "Sumbangan Bencana Alam NTT"
```

**Properties:**

- Set by the creating user at Donation creation; stored in `income_donations.donation_code`.
- 3–20 characters; uppercased and whitespace-stripped on save.
- RT-unique across all Donations including deleted. A code that was ever used for any Donation in the RT cannot be reused.
- **Locked after creation** — the field cannot be changed once the Donation record exists.
- Bank transfer remark length limits (some banks: 15 chars, no special characters) are the user's responsibility when choosing a code.

**`contribution_code` on `income_transactions`:**

When a monetary (`DONATION`) contribution is inserted for a Donation, the server copies `Donation.donation_code` directly into `income_transactions.contribution_code`. There is no sequence generation, no sequential suffix, and no uniqueness constraint — all donors of the same Donation share the same `contribution_code` value.

**Donation tracking/verification without a unique code:**

The Treasurer identifies a specific bank transfer by matching **code + payer name + amount + date** against the `income_transactions` list. Since most donors of a Donation have different names and amounts, this triple match is sufficient for manual reconciliation without requiring a per-donation unique code.

**Immutability:**

> Once stored, `contribution_code` on a transaction MUST NOT be changed.

If a contribution must be corrected, use the existing **cancellation/reversal** semantics and create a new transaction.

**Contribution code is NOT set for in-kind contributions.** In-kind contributions have no bank reconciliation use case.

---

## 5. Permissions

### 5.1 New Permission Codes

A separate `income.donation.view` permission is **not introduced** for MVP. Donation visibility for all RT members is enforced directly by the RLS policy in §4.5 (RT membership check). The Income module's Donation tab (staff-facing management view) follows the existing `income.view` permission.

| Code | Description |
|---|---|
| `income.donation.create`   | Create a fundraising Donation (status: DRAFT) |
| `income.donation.update`   | Edit Donation metadata (name, dates, target) |
| `income.donation.activate` | Activate (DRAFT→ACTIVE) or cancel/reject a Donation — RT Chair only |
| `income.donation.delete`   | Soft-delete a DRAFT or CANCELLED Donation with zero contributions |

### 5.2 Role Matrix

| Capability | RT_ADMIN | RT_CHAIR | TREASURER | SECRETARY | RESIDENT |
|---|:---:|:---:|:---:|:---:|:---:|
| See Donations on Beranda/Dasbor (RLS) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Donation list in Income tab (`income.view`) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `income.donation.create` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `income.donation.update` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `income.donation.activate` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `income.donation.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve/reject contributions (`income.approve`) | ✅ | ✅ | ✅ | ❌ | ❌ |

SUPER_ADMIN is not assigned an rt_members membership and therefore has no RT-scoped Donation visibility through this RLS policy.

### 5.3 `lib/auth/types.ts` additions

```typescript
// Income — Donations
INCOME_DONATION_CREATE:   'income.donation.create',
INCOME_DONATION_UPDATE:   'income.donation.update',
INCOME_DONATION_DELETE:   'income.donation.delete',
INCOME_DONATION_ACTIVATE: 'income.donation.activate',
```

---

## 6. API Design

Follows `docs/api/API_CONVENTION.md`.

### 6.1 Donation Endpoints

#### `GET /api/income/Donations`
Paginated Donation list. Query params: `page`, `pageSize`, `status` (`DRAFT|ACTIVE|COMPLETED|CANCELLED|all`), `search` (name ilike). Response: `PageResult<DonationRow>` with computed `approved_amount`, `pending_amount`, `donor_count`. Permission: `income.view`.

#### `POST /api/income/Donations`
Creates a Donation (status defaults to `DRAFT`). Body:

```json
{
  "name": "Renovasi Balai RT",
  "donation_code": "MAROENS8RBR26",
  "description": "...",
  "target_amount": 20000000,
  "starts_at": "2026-08-01",
  "ends_at": "2026-10-31"
}
```

Server validates:
- `donation_code`: 3–20 characters; uppercased and whitespace-stripped.
- Code must not exist in the RT, including soft-deleted or cancelled Donations (code retires permanently).

Permission: `income.donation.create`. Activity log: `donation_create`.

**Post-create notification:** All active ADMIN and TREASURER members receive a notification (`type: donation_pending`) prompting them to review the Donation, so Treasurer can prepare before activation. RT_CHAIR receives a separate notification to activate.

#### `GET /api/income/Donations/active`
Lightweight, unpaginated list of Donations that are currently accepting contributions:

```sql
WHERE status = 'ACTIVE'
  AND starts_at <= CURRENT_DATE
  AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
```

Used by Beranda/Dasbor widget and `IncomeForm` selector. No explicit permission check — RLS (RT membership) enforces scope.

#### `GET /api/income/Donations/[id]`
Single Donation with `approved_amount`, `pending_amount`, monetary contribution list (each row includes `contribution_code`), and in-kind contribution list. Permission: `income.view` for staff; RT membership RLS for all.

#### `PUT /api/income/Donations/[id]`
Updates `name`, `description`, `target_amount`, `starts_at`, `ends_at` for `DRAFT` or `ACTIVE` Donations. `donation_code` is locked after creation and cannot be updated via this endpoint. Permission: `income.donation.update`. Activity log: `donation_update`.

#### `POST /api/income/Donations/[id]/activate`
`DRAFT` → `ACTIVE`. Permission: `income.donation.activate` (RT_CHAIR only). Activity log: `donation_activate`.

#### `POST /api/income/Donations/[id]/cancel`
`ACTIVE` or `DRAFT` → `CANCELLED`. Body: `{ "cancelled_note": "..." }` (optional). Existing pending contributions continue through the approval flow unchanged. Permission: `income.donation.activate` (RT_CHAIR only — acts as rejection for DRAFT, cancellation for ACTIVE). Activity log: `donation_cancel`.

#### `DELETE /api/income/Donations/[id]`
Soft-deletes a `DRAFT` or `CANCELLED` Donation with zero contributions. Permission: `income.donation.delete`. Activity log: `donation_delete`.

### 6.2 New Endpoints

#### `POST /api/income/Donations/[id]/donate`
Resident-facing donation endpoint. Requires only authentication (no `income.create` permission), allowing residents to donate without staff-level access. Body: same fields as `POST /api/income` (amount, payment_method, received_at, notes, resident_id, payer_name, source_type).

Server:
1. Validates Donation exists, belongs to the resident's RT, status = `ACTIVE`, `starts_at <= today`, `ends_at IS NULL OR ends_at >= today`.
2. Inserts `income_transaction` with `income_category = 'DONATION'`, `status = 'pending'`, `contribution_code = Donation.donation_code`.
3. Fire-and-forget: `POST /api/income/notify` with maker-checker logic (see §12).
4. Returns the inserted row including `contribution_code`.

### 6.3 Modified Endpoints

#### `POST /api/income` (existing — staff use)
Accepts optional `donation_id`. When set, server validates:
- Donation exists, belongs to same RT, has status `ACTIVE`.
- `starts_at <= today` (Donation has started).
- `ends_at IS NULL OR ends_at >= today` (Donation has not ended).
- `income_category = 'DONATION'`.

Server then:
1. Copies `Donation.donation_code` into `contribution_code` on the new `income_transaction`.
2. Returns `contribution_code` in the response body.

After approval (see `POST /api/income/[id]/approve` below), the Donation completion check fires.

#### `POST /api/income/[id]/approve` (existing)
After approving a transaction that has a `donation_id`:
1. Recalculate `approved_amount = SUM(amount) WHERE donation_id = ? AND income_category = 'DONATION' AND status = 'approved'`.
2. If `target_amount IS NOT NULL AND approved_amount >= target_amount`: transition Donation to `COMPLETED` in the same DB transaction; emit `donation_completed` activity log; create notifications.

This check is synchronous and requires no separate job or scheduler.

#### `GET /api/income` (existing)
Accepts optional `donation_id` query param to filter transactions by Donation.

#### Income import template (existing)
Gains optional `donation_name` column. See §10.

### 6.4 API Contract: Contribution Code

- The server **always** sets `contribution_code` by copying `Donation.donation_code`. There is no API parameter for the client to supply one.
- Any endpoint that accepts contribution data (live form or import) must reject a client-supplied `contribution_code` field.
- A `contribution_code`, once stored, is **never modified** by any update endpoint.
- `PUT /api/income/[id]` must explicitly exclude `contribution_code` from its updatable field set.

---

## 7. Business Rules

### 7.1 Contribution Code Is Not Proof of Payment

> A Contribution Code is NOT proof that money has been received by the RT.

It is a **bank transfer reference** that helps the Treasurer match a bank statement line to a pending contribution record. The flow is:

```
Resident records contribution → contribution_code (= donation_code) assigned
         ↓
Resident uses code as bank transfer remark
         ↓
Bank transfer occurs (or may not occur)
         ↓
Treasurer matches: code + payer name + amount + date → pending record
         ↓
Treasurer approves or rejects the contribution
```

Creating a contribution record does not mean funds have entered the RT account. The code links the resident's stated intent to a future bank statement line. The UI must communicate this clearly (see §13 i18n `contributionCode.notProof`).

**Multiple donors, same code:** Because all donors of a Donation share the same `donation_code`, the Treasurer uses the combination of code + donor name + amount + date to disambiguate between pending records. This is sufficient for manual reconciliation at typical RT scale.

### 7.2 Donation Target Completion (Synchronous)

When a monetary contribution approval changes a Donation's approved sum:

```
Approve income_transaction (donation_id = X, income_category = 'DONATION')
         ↓
SELECT SUM(amount) WHERE donation_id = X AND income_category = 'DONATION'
       AND status = 'approved' AND deleted_at IS NULL
         ↓
approved_amount >= target_amount AND target_amount IS NOT NULL AND Donation.status = 'ACTIVE'?
         ↓
YES → UPDATE income_donations SET status = 'COMPLETED' (same DB transaction)
    → INSERT activity log: donation_completed
    → CREATE notifications: RT_ADMIN, RT_CHAIR
```

This fires synchronously in `POST /api/income/[id]/approve`. No scheduler is required.

### 7.3 Contribution Acceptance Window and Deadline Behavior (Lazy Evaluation)

There is **no scheduler or cron job** for Donation expiry in this sprint.

A Donation actively accepts contributions only when all three conditions hold simultaneously:

```
status = 'ACTIVE'
AND starts_at <= CURRENT_DATE     ← Donation has started
AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)  ← Donation has not ended
```

An `ACTIVE` Donation where `starts_at > today` is **published but not yet open**. It does not appear in the selector or widget, and `POST /api/income` will reject a contribution attempt against it.

Laziness rules:
- `GET /api/income/Donations/active` applies all three conditions as SQL `WHERE` filters.
- `POST /api/income` re-validates all three conditions server-side before inserting.
- The Donation's `status` column does **not** change automatically when `ends_at` passes or before `starts_at` is reached.
- Existing pending contributions linked to a Donation that has since expired **continue through the approval flow unchanged**. They are not automatically rejected.
- If a future requirement needs a persisted `EXPIRED` terminal status, implement it as a background job concern in a separate sprint.

### 7.4 Monetary vs. In-Kind Contributions

| Aspect | Monetary (`DONATION`) | In-Kind (`IN_KIND`) |
|---|---|---|
| Has `amount` (IDR) | Yes | Optional (estimated value) |
| Has `contribution_code` | Yes (server-generated) | No |
| Counts toward `approved_amount` | Yes (after approval) | No |
| May be reconciled against bank | Yes (via `contribution_code`) | No |
| Has `in_kind_*` fields | No | Yes |
| Enters approval flow | Yes (existing) | Yes (existing) |

In-kind contributions MUST NOT automatically increase monetary Donation progress. They MUST NOT automatically create a cash `income_transaction`. They are displayed separately in the Donation detail view.

### 7.5 Progress Calculation

```sql
-- Official progress (used for completion check and percentage display)
approved_amount = SUM(amount)
    WHERE donation_id = :id
      AND income_category = 'DONATION'
      AND status = 'approved'
      AND deleted_at IS NULL

-- Informational pending (displayed separately, never used for completion check)
pending_amount = SUM(amount)
    WHERE donation_id = :id
      AND income_category = 'DONATION'
      AND status = 'pending'
      AND deleted_at IS NULL
```

Official progress percentage = `approved_amount / target_amount`.

**NOT** `(approved_amount + pending_amount) / target_amount`.

`pending_amount` is informational only and never triggers status transitions.

---

## 8. UI Design

### 8.1 Navigation

No new top-level nav item. The Income page gains a second tab:

```
[ Transaksi ]   [ Kampanye ]
```

URL: `/income?tab=Donations`. The `Kampanye` tab renders `DonationListView`. Active Donations are also surfaced on Beranda and Dasbor (§8.7).

### 8.2 Donation List View (`/income?tab=Donations`)

`DataTable` with columns: Name, Status badge, Target, Approved Progress, Period, Actions. Edit is an inline row action (gated by `income.donation.update`).

Filters: status select. Search: by Donation name.

`+ Buat Kampanye` button (gated by `income.donation.create`). Row click → `DonationDetailDrawer`.

### 8.3 Donation Detail Drawer

```
┌────────────────────────────────────────┐
│ Renovasi Balai RT                 [X]  │
│ ACTIVE                                 │
│ ──────────────────────────────────     │
│ Target       Rp 20.000.000             │
│ Disetujui    Rp 12.500.000  (62,5%)   │
│ [████████████░░░░░░░░░░░░]             │
│ ▓ Menunggu   Rp  3.000.000             │
│ Sisa         Rp  7.500.000             │
│ ──────────────────────────────────     │
│ Periode: 1 Agu — 31 Okt 2026           │
│ Deskripsi: ...                         │
│ ──────────────────────────────────     │
│ Kontribusi Tunai (12)                  │
│  Budi  Rp 500.000  RBR26-1   1 Agu    │
│  Sari  Rp 200.000  RBR26-2   3 Agu    │
│ ──────────────────────────────────     │
│ Kontribusi Non-Tunai (2)               │
│  Budi  5 sak semen (est. Rp 350.000)  │
│ ──────────────────────────────────     │
│ [Batalkan Kampanye]     [Edit]         │
└────────────────────────────────────────┘
```

Actions gated by `income.donation.update`:
- `[Aktifkan]` — shown for `DRAFT`
- `[Edit]` — shown for `DRAFT` or `ACTIVE`
- `[Batalkan Kampanye]` — shown for `ACTIVE`

### 8.4 Donation Form (Create / Edit)

Fields:
- Nama Kampanye (required)
- Kode Transfer (required, 3–20 chars, uppercased; locked after Donation is created — shown as disabled in edit mode)
- Deskripsi (textarea, optional)
- Target Dana (number, optional — leave blank for no target)
- Tanggal Mulai (date, required, default: today)
- Tanggal Selesai (date, optional — leave blank for no deadline)

### 8.5 Income Form — Donation Selector and Contribution Code

When `income_category = 'DONATION'`, an optional selector appears using active Donations from `GET /api/income/Donations/active`. Hidden entirely if no active Donations exist.

After a Donation-linked monetary contribution is submitted successfully, a toast notification confirms the submission. The form closes immediately. The `contribution_code` is not shown in a success dialog — it is available on the transaction detail drawer at any later time (visible to staff in `IncomeDrawer`).

The `contributionCode` success state and copy-code dialog were removed from `IncomeForm` (Sprint 5.9 post-implementation). Staff can find the code in the Donation's contribution list in `DonationDetailDrawer`.

### 8.6 Progress Display (`DonationProgressBar`)

Reusable component in `components/common/`. Props: `approved: number`, `pending: number`, `target: number | null`.

- If `target = null`: shows `approved` amount only; no bar.
- If `target` is set: stacked bar with two segments:
  - **Approved** (solid primary color) — official progress
  - **Pending** (muted/lighter overlay) — informational

Displayed values:
```
Target        Rp 20.000.000
Disetujui     Rp 12.500.000  (62,5%)
Menunggu       Rp  3.000.000
Sisa           Rp  7.500.000
```

Bar turns green when `approved >= target`. Percentage always reflects `approved / target`.

### 8.7 Donation Cards on Beranda and Dasbor

Active Donations appear for all authenticated RT members on **Beranda** (resident home) and **Dasbor** (staff dashboard).

**RT-scoping**: a resident or staff member sees only their own RT's Donations. This is enforced by the RLS view policy (§4.5). No additional application-layer filter is needed.

**Visibility rule**: the entire section is hidden (returns `null`) when the API returns zero active Donations. Only Donations that satisfy all three conditions appear: `status = 'ACTIVE'`, `starts_at <= today`, `ends_at IS NULL OR ends_at >= today`. DRAFT, COMPLETED, and CANCELLED Donations are never shown.

**Collapsible banner (`ActiveDonationsSection`):**

The Donation cards are wrapped in a collapsible banner component that:
- Sits at the **top of the module** above all existing content on both Beranda and Dasbor.
- Has a header row: megaphone icon + "Kampanye Aktif" label + count badge + chevron toggle.
- Clicking the header toggles expand/collapse; state persists in `localStorage` under a per-module key.
- The banner state on Beranda and Dasbor is **independent**: collapsing one does not affect the other.

| Module | `localStorage` key |
|---|---|
| Beranda | `home-Donations-banner` |
| Dasbor | `dashboard-Donations-banner` |

When collapsed, only the header row is visible. When expanded, cards are shown in a responsive grid (1 / 2 / 3 columns at sm / lg breakpoints).

**Refresh button on each card:**

Each `DonationCard` displays a `refresh-cw` icon button in the top-right corner of the card header. Clicking it triggers `reload()` on the shared `useActiveDonations` hook, which re-fetches all active Donations. Because all cards share the same data source, one refresh reloads the entire list.

Each `DonationCard` shows: Donation name, progress bar (approved + pending), target, deadline, refresh button, `[Donasi Sekarang]` button.

Clicking `[Donasi Sekarang]` opens `IncomeForm` with:
- `income_category` pre-set to `DONATION`, **locked**
- `donation_id` pre-set to this Donation, **locked**
- `resident_id` pre-set to the current user's resident record, **locked**
- `contribution_code`: not shown on the form (generated server-side after submit)
- Amount, method, notes, date: fully editable

---

## 9. Resident Donation Flow

```
Resident opens Beranda or Dasbor
         ↓
Active Donation card(s) visible
(RT-scoped; ends_at >= today or null)
         ↓
Resident clicks "Donasi Sekarang"
         ↓
IncomeForm opens
  - category = DONATION      (locked)
  - Donation = this Donation  (locked)
  - resident = current user   (locked)
         ↓
Resident fills: amount, method, notes (optional), date
         ↓
Resident submits → POST /api/income/Donations/[id]/donate
  (no income.create permission required — residents can donate without staff access)
         ↓
Server:
  1. Validates Donation is ACTIVE and not expired
  2. Creates income_transaction (status: pending)
  3. Sets contribution_code = Donation.donation_code (same code for all donors)
  4. Returns row including contribution_code
  5. Fire-and-forget: notify TREASURER (or CHAIR if submitter is TREASURER
     and rt.maker_checker_enabled = true)
         ↓
UI shows success toast and form closes
         ↓
TREASURER receives notification → reviews and approves or rejects
         ↓
If approved:
  - Donation approved_amount recalculated
  - target check fires synchronously
  - if target reached → Donation → COMPLETED + notification to ADMIN and CHAIR
  - resident receives approval notification
If rejected:
  - resident receives rejection notification
         ↓
Resident can view contribution_code in transaction history at any time
```

**Important:** The contribution does not count toward official Donation progress until approved.

---

## 10. Import Design

The existing income import template gains one optional column: `donation_name` (text).

**Why `donation_name`?**

| Option | Assessment |
|---|---|
| `donation_name` | Human-readable, easy to fill in a spreadsheet. Chosen. |
| `donation_code` | Identifies the bank transfer code, not necessarily the Donation name — less human-friendly for import. |
| `donation_id` | UUID — not operator-friendly. |

Server resolution: `donation_name` → `donation_id` by case-insensitive exact match within the RT against `ACTIVE` Donations. An unresolvable or expired Donation name is a row-level validation error.
Import Donation-linked contributions is intended for active Donations only.

**Contribution code in import:**

- `contribution_code` is **not** an import column.
- For each monetary (`DONATION`) row that resolves to a Donation, the server copies `Donation.donation_code` into `contribution_code` at import-processing time — same as the live form.
- An imported record **must not** supply its own `contribution_code`. Accepting a client-supplied code would violate the server-side assignment invariant. If an imported record must reference an existing contribution, that is a reconciliation operation, not an import operation.

---

## 11. Activity Log

| Action | Trigger |
|---|---|
| `donation_create` | New Donation created |
| `donation_activate` | `DRAFT` → `ACTIVE` |
| `donation_update` | Metadata edited |
| `donation_cancel` | Status → `CANCELLED` |
| `donation_delete` | Soft-deleted |
| `donation_completed` | `ACTIVE` → `COMPLETED` (target reached on approval) |

All entries: `entity_type: 'Donation'`, `entity_id: Donation.id`.

---

## 12. Notifications

| Trigger | Recipients | Type |
|---|---|---|
| Donation created (DRAFT) | All active ADMIN + TREASURER | `donation_activated` (pending review) |
| Donation activated (DRAFT → ACTIVE) | All active ADMIN + TREASURER | `donation_activated` |
| Donation submitted (pending) | TREASURER (see maker-checker below) | `income_pending` |
| Donation approved | Submitting resident | `income_approved` |
| Donation rejected | Submitting resident | `income_rejected` |
| Target reached (ACTIVE → COMPLETED) | All active ADMIN + CHAIR | `donation_completed` |

**Maker-Checker rules:**

**1. Notification routing** — When a donation is submitted via `POST /api/income/Donations/[id]/donate` or `POST /api/income`, the notification target is resolved by `notifyIncomeReviewer()` in `lib/services/incomeNotification.server.ts`:

1. Read `rt.maker_checker_enabled` for the RT.
2. Look up the submitter's active membership role.
3. If `maker_checker_enabled = true` AND submitter's role = `TREASURER` → notify **CHAIR**.
4. Otherwise → notify **TREASURER**.

> **Implementation note:** The `/donate` route handler calls `notifyIncomeReviewer()` directly (server-side function). It previously used `fetch('/api/income/notify', ...)` with a relative URL which silently failed in server-side context. The HTTP route `/api/income/notify` still exists for the client-side `income.service.ts` path and delegates to the same function.

**2. Self-approval guard** — The `POST /api/income/[id]/approve` and `POST /api/income/[id]/reject` endpoints reject any attempt where `income.created_by === approver_id` with HTTP 409. This applies to all roles regardless of permission. The `IncomeDrawer` also shows a notice ("Pemasukan ini diajukan oleh Anda. Persetujuan dilakukan oleh pengguna lain yang berwenang.") instead of approve/reject buttons when the current user is the submitter.

**3. TREASURER as checker** — TREASURER now holds `income.approve` and `income.reject` permissions (migration 035, seeded via `role_permissions`). This allows TREASURER to approve income submitted by RT_CHAIR (e.g. when RT_CHAIR donates via the Donation card). RT_CHAIR retains approve/reject for income submitted by RT_ADMIN or TREASURER.

`maker_checker_enabled` is stored in the `rt` table (`boolean NOT NULL DEFAULT TRUE`); no admin UI exists in this sprint.

Deadline passing does **not** trigger a notification (no scheduler in this sprint). A future background job may add this separately.

---

## 13. i18n Keys

New namespace `income.Donations` in `messages/id.json`:

```json
"Donations": {
  "tabLabel": "Kampanye",
  "title": "Kampanye Donasi",
  "subtitle": "Kelola kampanye penggalangan dana RT",
  "addButton": "Buat Kampanye",
  "searchPlaceholder": "Cari nama kampanye...",
  "filters": {
    "allStatuses": "Semua Status"
  },
  "status": {
    "DRAFT": "Draf",
    "ACTIVE": "Aktif",
    "COMPLETED": "Selesai",
    "CANCELLED": "Dibatalkan"
  },
  "columns": {
    "name": "Nama Kampanye",
    "status": "Status",
    "donationCode": "Kode Transfer",
    "target": "Target",
    "approved": "Disetujui",
    "pending": "Menunggu",
    "donorCount": "Donatur",
    "period": "Periode"
  },
  "detail": {
    "title": "Detail Kampanye",
    "approved": "Disetujui",
    "pending": "Menunggu",
    "remaining": "Sisa",
    "target": "Target",
    "openEnded": "Tanpa Target",
    "period": "Periode",
    "description": "Deskripsi",
    "monetaryList": "Kontribusi Tunai",
    "inKindList": "Kontribusi Non-Tunai",
    "noDonations": "Belum ada kontribusi."
  },
  "progress": {
    "approvedLabel": "Disetujui",
    "pendingLabel": "Menunggu Persetujuan"
  },
  "form": {
    "createTitle": "Buat Kampanye",
    "editTitle": "Edit Kampanye",
    "name": "Nama Kampanye",
    "namePlaceholder": "contoh: Renovasi Balai RT",
    "donationCode": "Kode Transfer",
    "donationCodeHint": "Kode yang diinput warga pada berita transfer bank, contoh: MAROENS8AGT26",
    "donationCodePlaceholder": "contoh: MAROENS8AGT26",
    "description": "Deskripsi",
    "descriptionPlaceholder": "Tujuan dan informasi kampanye...",
    "targetAmount": "Target Dana",
    "targetAmountPlaceholder": "Kosongkan jika tidak ada target",
    "startsAt": "Tanggal Mulai",
    "endsAt": "Tanggal Selesai",
    "endsAtOptional": "Kosongkan jika tidak ada batas waktu",
    "submit": "Simpan",
    "cancel": "Batal"
  },
  "contributionCode": {
    "successLabel": "Kode Kontribusi",
    "successHint": "Gunakan kode ini sebagai keterangan saat transfer bank.",
    "notProof": "Kode kontribusi bukan bukti penerimaan dana.",
    "copy": "Salin kode",
    "copied": "Disalin!"
  },
  "actions": {
    "activate": "Aktifkan",
    "cancel": "Batalkan Kampanye",
    "cancelNote": "Alasan pembatalan (opsional)",
    "edit": "Edit"
  },
  "selector": {
    "label": "Kampanye",
    "placeholder": "Pilih kampanye (opsional)"
  },
  "card": {
    "sectionTitle": "Kampanye Aktif",
    "donateButton": "Donasi Sekarang",
    "noDeadline": "Tanpa batas waktu",
    "deadline": "Berakhir {date}",
    "approved": "Disetujui",
    "pending": "Menunggu",
    "openEnded": "Tanpa Target"
  }
}
```

---

## 14. Future Bank Reconciliation

The `contribution_code` / `donation_code` is designed as a **first-pass reconciliation filter** for matching bank statement lines to pending contributions. It is **not** an automatic approval trigger, and it is not unique per-donor.

Conceptual future reconciliation flow (separate sprint):

```
Bank statement imported
         ↓
Extract transfer remark/description
         ↓
Search for donation_code pattern (e.g. MAROENS8AGT26) in bank remark
         ↓
Candidate set: all pending contributions for that Donation
         ↓
Narrow by: amount match + approximate date match
         ↓
If single match → high-confidence candidate → Treasurer confirms
If multiple matches → Treasurer selects by payer name
         ↓
Reconciliation decision (human review; no automatic approval)
```

> The `donation_code` is a strong Donation-level filter, but per-donor disambiguation is manual. Final reconciliation policy will be defined by the future banking/reconciliation architecture. This feature does not commit to any automatic approval behavior.

Design choices that support this future without coupling to it:
- `donation_code` is RT-unique and persists even after `COMPLETED` or `CANCELLED` — valid reconciliation filter for all time.
- All `contribution_code` values for a Donation equal `donation_code` — bank remark search is straightforward.
- Code uniqueness spans deleted Donations: no historical ambiguity across the RT's lifetime.

---

## 15. File Structure

New files to create:

```
features/income/
  components/Donations/
    DonationListView.tsx          — DataTable for Donation management (staff)
    DonationDetailDrawer.tsx      — Detail drawer: progress, donation list, in-kind list
    DonationForm.tsx              — Create/Edit modal
    DonationCard.tsx              — Compact card for Beranda/Dasbor
  hooks/
    useDonationData.ts            — Paginated list (pattern: useIncomeData)
    useActiveDonations.ts         — Unpaginated active list for selector + cards
    useDonationActions.ts         — activate, cancel, delete handlers
  services/
    Donation-transform.ts         — mapDonation(): adds progressPct, formattedTarget

app/api/income/Donations/
  route.ts                        — GET (list) + POST (create)
  active/route.ts                 — GET (active, unpaginated)
  [id]/
    route.ts                      — GET (detail) + PUT (update) + DELETE
    activate/route.ts             — POST
    cancel/route.ts               — POST
    donate/route.ts               — POST (resident donation; no income.create required)

lib/repositories/
  incomeDonation.repository.ts

supabase/migrations/
  031_income_donations.sql

components/common/
  DonationProgressBar.tsx         — Props: approved, pending, target
```

Modified files:

```
features/income/IncomeContainer.tsx          — Add tab state; render DonationListView
features/income/IncomeView.tsx               — Add tab UI
features/income/components/forms/IncomeForm.tsx  — Donation selector; contribution code success state
app/api/income/route.ts                      — Accept donation_id filter param
app/api/income/[id]/approve/route.ts         — Synchronous Donation completion check
features/beranda/BerandaView.tsx             — Active Donation cards section
features/dasbor/DasborView.tsx               — Active Donation cards section
lib/auth/types.ts                            — Add INCOME_DONATION_* permissions
messages/id.json                             — Add income.Donations namespace
```

---

## 16. Decisions Locked

All confirmed by product owner (2026-08-22). Do not reopen during implementation.

| # | Topic | Decision |
|---|---|---|
| 1 | Navigation | Tab within Income module — `/income?tab=Donations` |
| 2 | Target completion | Synchronous check in approval handler; same DB transaction |
| 3 | Deadline handling | Lazy evaluation (`ends_at < today` filter); no scheduler |
| 4 | Resident visibility | All RT members (RT-scoped by RLS); Beranda + Dasbor cards |
| 5 | Donation status lifecycle | `DRAFT → ACTIVE → COMPLETED / CANCELLED`; no `EXPIRED`, no `CLOSED` |
| 6 | Donation Code (`donation_code`) | Per-Donation bank transfer reference; human-set at creation; 3–20 chars; RT-unique. All donors of a Donation use the same code. No sequential suffix. |
| 7 | Contribution Code assignment | Server copies `Donation.donation_code` into `income_transactions.contribution_code` at insert. No sequence generation. Not unique per-donor. |
| 8 | Contribution Code immutability | Never modified after storage; correction via reversal only |
| 9 | Contribution Code not proof | Explicitly stated in UI and API contract |
| 10 | In-kind contributions | Recorded on `income_transactions`; do not increase monetary progress |
| 11 | Donation ledger | No separate ledger; `income_transactions` is the sole authoritative financial record |
| 12 | `income.donation.view` permission | Not introduced; visibility via RLS (RT membership); Income tab via `income.view` |
| 13 | Import | `donation_name` column (readable); `contribution_code` server-assigned, not importable |
| 14 | Progress denominator | Approved monetary only; pending shown informational |
| 15 | Progress model | `approved_amount / target_amount`; never includes pending |
| 16 | Contribution acceptance window | `status = 'ACTIVE' AND starts_at <= today AND (ends_at IS NULL OR ends_at >= today)`; all three enforced server-side |
| 17 | `income_category` enum | `IN_KIND` added via `ALTER TYPE ... ADD VALUE`; `amount NOT NULL` preserved; in-kind uses `amount = 0` when no estimate |
| 18 | FK deletion protection | `ON DELETE RESTRICT` on `income_transactions.donation_id`; soft-delete (deleted_at) does not trigger constraint; application layer also blocks deletion of Donations with contributions |
| 19 | Notification routing | Hardcoded-role routing (TREASURER for income/payment, CHAIR for expenses). Not RBAC-driven. Maker-checker escalates to CHAIR when submitter is TREASURER and `rt.maker_checker_enabled = true`. |
| 20 | Resident donation endpoint | Dedicated `POST /api/income/Donations/[id]/donate` — no `income.create` permission required; residents donate without staff access |
| 21 | Maker-checker configurability | `rt.maker_checker_enabled BOOLEAN NOT NULL DEFAULT TRUE`; per-RT; no admin UI in this sprint |
| 22 | Self-approval guard | API-level: `created_by === approver_id` → 409. UI-level: `IncomeDrawer` hides approve/reject buttons for the submitter. Both layers are required; server-side is authoritative. |
| 23 | TREASURER as income checker | TREASURER granted `income.approve` + `income.reject` (migration 035). Enables RT_CHAIR-submits / TREASURER-approves flow. Maker-checker self-approval guard prevents TREASURER from approving their own submissions. |
| 24 | Notification routing server-side | `notifyIncomeReviewer()` in `lib/services/incomeNotification.server.ts` called directly from server-side route handlers. Relative-URL `fetch()` cannot be used from API route handlers (server-side context). HTTP `/api/income/notify` retained for client-side callers. |
| 25 | Resident notification no-op | `income_approved`/`income_rejected` notifications to RESIDENT return `null` from `getNotificationLink()`. Callers skip `router.push`. Widget refresh is handled by Supabase Realtime subscription on `income_transactions`. |
| 26 | Collapsible Donation banner | `ActiveDonationsSection` is a collapsible banner placed at the top of each module. Banner expand/collapse state is persisted in `localStorage` using a per-module `storageKey`. Beranda and Dasbor banner states are fully independent. All cards share one data fetch; one refresh reloads the full list. |
| 27 | Cashflow chart includes approved income | The "Arus Kas" chart (`CashFlowChart`) sums both iuran payment income (`paymentData`) and approved income transactions (`incomeData`) for each month. Without this, approved donations would not appear in the cash flow view. |

---

## 17. Implementation Decisions (Resolved)

All implementation decisions have been resolved during the sprint:

- **Donation code assignment**: `contribution_code = Donation.donation_code` copied at insert time. No sequence infrastructure needed.
- **Migration number**: `031_income_donations.sql` — confirmed against repository.
- **`income_category = 'IN_KIND'`**: Added via `ALTER TYPE income_category ADD VALUE 'IN_KIND'` in migration 035.
- **Beranda/Dasbor slot**: `ActiveDonationsSection` component inserted into both pages.
- **Maker-checker**: `rt.maker_checker_enabled` column added to `rt` table in migration 035 (`BOOLEAN NOT NULL DEFAULT TRUE`).
- **Resident donation**: dedicated `/donate` endpoint, no permission gate beyond authentication.
- **Contribution code success dialog**: removed from `IncomeForm`. Form closes with a success toast; code visible in `DonationDetailDrawer`.
- **TREASURER as checker**: `income.approve` + `income.reject` granted to TREASURER in migration 035.
- **Self-approval guard**: server returns 409 when `created_by === approver_id`. UI hides buttons for self-submissions.
- **Server-side notify**: `notifyIncomeReviewer()` extracted to `lib/services/incomeNotification.server.ts`; called directly from `/donate` handler.
- **Collapsible banner**: `ActiveDonationsSection` wraps cards in a collapsible header. State saved to `localStorage` per `storageKey`. Placed at the top of Beranda (`storageKey="home-Donations-banner"`) and Dasbor (`storageKey="dashboard-Donations-banner"`).
- **Refresh button**: each `DonationCard` renders a `refresh-cw` icon button; click triggers `reload()` on the shared hook, refreshing all cards.
- **Cashflow fix**: `lib/services/dashboard.service.ts` fetches `incomeData` before the cashflow block and adds `incomeTransactionTotal` (approved income per month) to the monthly income sum alongside `paymentIncome`.

---

## 18. Dependencies

| Dependency | Status |
|---|---|
| `income_transactions` table (028_income_tables) | ✅ Live |
| Income RBAC (029_income_permissions) | ✅ Live |
| Import framework (031_import_jobs) | ✅ Live |
| Activity log pattern | ✅ Live |
| Notification pattern | ✅ Live |
| `DataTable` / `useDataTable` | ✅ Live |
| `IncomeForm` extension | ✅ Implemented |
| `031_income_donations.sql` migration | ✅ Implemented |
| Beranda/Dasbor Donation card slot | ✅ Implemented |
| `POST /api/income/Donations/[id]/donate` endpoint | ✅ Implemented |
| Maker-checker (`rt.maker_checker_enabled`) | ✅ Implemented |
| Admin UI for `maker_checker_enabled` | 🔲 Future sprint |
| `lib/services/incomeNotification.server.ts` | ✅ Implemented |
| TREASURER `income.approve` + `income.reject` grants | ✅ Implemented (migration 035) |
| Self-approval guard (API + UI) | ✅ Implemented |
| Notification routing (`getNotificationLink` role-aware) | ✅ Implemented |
| Collapsible banner (`ActiveDonationsSection`) with per-module `localStorage` state | ✅ Implemented |
| Refresh button on each `DonationCard` | ✅ Implemented |
| Cashflow chart includes approved income transactions | ✅ Implemented (`dashboard.service.ts`) |
