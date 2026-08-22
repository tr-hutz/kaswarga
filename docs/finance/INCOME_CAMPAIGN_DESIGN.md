# Sprint 5.9 — Income Campaign & Donation Tracking: Design Document

> Status: Final design — ready for implementation sprint.
>
> Last Updated: 2026-08-22

---

## 1. Background

The current Income module (`income_transactions`) records individual cash inflows per transaction. There is no concept of a **fundraising campaign**: a coordinated effort to collect donations from multiple sources toward a specific goal (e.g., "Renovasi Balai RT", "Santunan Anak Yatim Idul Fitri").

Without campaigns:
- Treasurers manually group `DONATION` entries by `income_name` to estimate progress.
- There is no target amount, deadline, or progress visualization.
- Donors have no visibility into what they contributed to or what reference code to use for bank transfers.

Sprint 5.9 introduces a first-class **Campaign** entity that existing `DONATION` income transactions link to, a human-readable **Contribution Code** for each monetary contribution, and a UI to create and monitor campaigns.

---

## 2. Scope

### In scope
- `income_campaigns` table with status lifecycle, target, deadline, and Contribution Code Prefix.
- `contribution_code` field on `income_transactions` for campaign-linked monetary contributions.
- In-kind contribution recording (description, quantity, estimated value) on `income_transactions`.
- RBAC permissions for campaign management.
- Campaign list tab within the Income module.
- Campaign detail drawer showing progress (approved + pending), donation list with contribution codes, and in-kind list.
- `IncomeForm` extended: campaign selector when category = `DONATION`; contribution code shown in success state.
- Campaign cards on Beranda (resident home) and Dasbor (staff dashboard) for all RT members.
- Resident donation flow: pre-filled form from campaign card.
- Activity log entries for campaign lifecycle events.
- Notification when campaign target is reached.
- Income import template: optional `campaign_name` column.

### Out of scope
- Public donation links, QR codes, or crowdfunding pages.
- Recurring campaigns or pledge tracking.
- Resident self-service campaign creation.
- Bank API integration or automatic reconciliation.
- Scheduler/cron infrastructure solely for campaign expiry.
- Donor profiles, rankings, or leaderboards.
- WhatsApp/SMS channels.
- Separate campaign ledger or financial accounting system.

---

## 3. Domain Terminology

All terms follow `docs/development/GLOSSARY.md`. New terms introduced by this sprint:

| Term | Indonesian | Definition |
|---|---|---|
| Campaign | Kampanye Donasi | Named fundraising effort with optional target amount and deadline |
| Monetary Contribution | Donasi Tunai | An `income_transaction` of category `DONATION` linked to a campaign |
| In-Kind Contribution | Donasi Non-Tunai | A non-cash contribution (goods, materials, services) linked to a campaign |
| Contribution | Kontribusi | Either a monetary or in-kind contribution to a campaign |
| Contribution Code Prefix | Prefiks Kode Kontribusi | 2–4 uppercase letters identifying a campaign for code generation (e.g. `AG`) |
| Contribution Code | Kode Kontribusi | Unique human-readable reference for a single monetary contribution (e.g. `AG26-421`) |
| Official Progress | Progres Resmi | Sum of approved monetary contributions linked to the campaign |
| Campaign Status | Status Kampanye | `DRAFT`, `ACTIVE`, `COMPLETED`, or `CANCELLED` |

---

## 4. Data Model

### 4.1 New Table: `income_campaigns`

```sql
CREATE TABLE income_campaigns (
    id                         uuid        NOT NULL DEFAULT gen_random_uuid(),
    rt_id                      uuid        NOT NULL,
    name                       text        NOT NULL,
    contribution_code_prefix   text        NOT NULL,
        -- 2-4 uppercase ASCII letters, RT-unique across all campaigns including deleted
    description                text,
    target_amount              bigint,
        -- NULL means open-ended (no target)
    starts_at                  date        NOT NULL DEFAULT CURRENT_DATE,
    ends_at                    date,
        -- NULL means no deadline; expiry is evaluated lazily (see §7.3)
    status                     text        NOT NULL DEFAULT 'DRAFT',
        -- DRAFT | ACTIVE | COMPLETED | CANCELLED
    cancelled_note             text,
        -- reason when manually CANCELLED
    created_by                 uuid,
    updated_by                 uuid,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    deleted_at                 timestamptz,
    deleted_by                 uuid,

    CONSTRAINT income_campaigns_pkey
        PRIMARY KEY (id),
    CONSTRAINT income_campaigns_rt_fk
        FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE,
    CONSTRAINT income_campaigns_prefix_rt_unique
        UNIQUE (rt_id, contribution_code_prefix)
        -- Spans ALL campaigns including deleted: a prefix retires permanently
        -- once used, so historical contribution codes remain unambiguous.
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

There is **no `EXPIRED` status**. When `ends_at < today`, the campaign is excluded from active lists via a query filter. The `status` column does not change automatically (see §7.3).

**Contribution acceptance window:** a campaign accepts new contributions only when all three conditions hold:

```sql
status = 'ACTIVE'
AND starts_at <= CURRENT_DATE   -- not yet started campaigns are published but not open
AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
```

This means an RT_ADMIN can publish (activate) a campaign in advance — it becomes `ACTIVE` in the DB but does not appear in the `IncomeForm` selector or Beranda/Dasbor widgets until `starts_at` is reached. The `POST /api/income` handler must enforce all three conditions server-side.

### 4.2 Alter `income_transactions`

**Prerequisite — extend the `income_category` enum:**

```sql
ALTER TYPE income_category ADD VALUE 'IN_KIND';
-- PostgreSQL enum additions are transactional (PG 12+) and irreversible.
-- Must be the first statement in the migration that references IN_KIND.
```

The existing `income_category` enum in `028_income_tables.sql` defines: `DONATION, GOVERNMENT, EVENT, BAZAAR, RENTAL, SALES, INTEREST, OTHER`. `IN_KIND` is not present and must be added before any `IN_KIND` rows can be inserted.

**Add new columns:**

```sql
ALTER TABLE income_transactions
    ADD COLUMN campaign_id           uuid,
    ADD COLUMN contribution_code     text,
        -- nullable; only set for campaign-linked DONATION transactions; server-generated
    ADD COLUMN in_kind_description   text,
        -- free text description; only set when income_category = 'IN_KIND'
    ADD COLUMN in_kind_quantity      numeric,
        -- optional physical quantity (e.g. 5 for "5 sak semen")
    ADD COLUMN in_kind_unit          text,
        -- optional unit of measure (e.g. 'sak', 'kg', 'pcs')
    ADD CONSTRAINT income_transactions_campaign_fk
        FOREIGN KEY (campaign_id) REFERENCES income_campaigns(id) ON DELETE RESTRICT;
        -- RESTRICT prevents hard-deleting a campaign that has any income_transactions.
        -- Soft-delete (setting deleted_at) does NOT trigger this constraint.
        -- The application layer independently blocks campaign deletion when contributions exist.

-- Partial unique index: excludes non-campaign rows (where contribution_code IS NULL)
CREATE UNIQUE INDEX idx_income_contribution_code_rt
    ON income_transactions (rt_id, contribution_code)
    WHERE contribution_code IS NOT NULL;

CREATE INDEX idx_income_campaign_id
    ON income_transactions (campaign_id);
```

**Schema compatibility notes:**

- `campaign_id` is nullable — all existing `income_transactions` rows are unaffected.
- `contribution_code` is nullable — only set for `income_category = 'DONATION'` with `campaign_id` set. Generated server-side at insert; **never editable after creation** (see §4.6).
- `in_kind_*` columns are nullable — only set for `income_category = 'IN_KIND'`. In-kind contributions do **not** increase monetary campaign progress.
- `amount bigint NOT NULL` is **not altered**. The existing constraint is preserved. For in-kind contributions, `amount` carries the operator's estimated IDR value, or `0` if no estimate is available. This avoids an ALTER to an existing NOT NULL column and keeps all existing SUM queries safe (see note below).
- A partial unique index is used instead of a table constraint to correctly handle multiple `NULL` values (SQL `NULL` is not equal to another `NULL` in a unique constraint, but a partial index makes intent explicit).

**Impact on existing SUM queries:**

Existing queries that sum `income_transactions.amount` (e.g., ledger totals, income reports) will include in-kind estimated values when `amount > 0`. This is correct: an in-kind item with an estimated value IS a form of income. If `amount = 0`, it contributes nothing to totals. No existing query needs to change. Campaign progress queries already filter `income_category = 'DONATION'` (see §7.5), so in-kind rows are naturally excluded from progress calculation.

**In-kind ledger behavior:**

When an in-kind contribution is approved, a ledger entry (type=pemasukan, source=income) is created **only if `amount > 0`**. If `amount = 0`, no ledger entry is created. This mirrors how zero-amount transactions would behave in the existing approval handler.

### 4.3 Entity Relationship

```
rt
 │
 ├── income_campaigns
 │       id (uuid, PK)
 │       rt_id          FK → rt.id
 │       contribution_code_prefix  (text, RT-unique)
 │       name, description, target_amount
 │       starts_at, ends_at, status
 │       …audit columns…
 │
 └── income_transactions  (existing table, extended)
         id (uuid, PK)
         rt_id          FK → rt.id
         campaign_id    nullable FK → income_campaigns.id
         contribution_code   nullable text, RT-unique when set
         income_category     (DONATION | IN_KIND | existing categories)
         amount              bigint, IDR
         status              pending | approved | rejected
         in_kind_description, in_kind_quantity, in_kind_unit  (nullable)
         …existing columns…
```

`income_transaction` is the **single authoritative financial record**. No separate campaign ledger exists. The `campaign_id` FK on `income_transactions` is the only link between the two tables.

### 4.4 Migration Placement

New migration: **`036_income_campaigns.sql`**

Contents (order matters — enum extension must be first):
1. `ALTER TYPE income_category ADD VALUE 'IN_KIND'` — extends existing enum from `028_income_tables.sql`.
2. Creates `income_campaigns` table.
3. Alters `income_transactions` (adds `campaign_id`, `contribution_code`, `in_kind_*` columns, FK, indexes).
4. Enables RLS on `income_campaigns` and creates policies (see §4.5).
5. Seeds permission records (see §5).

> Migration 035 was deleted in a prior sprint (its content was merged into 033). The current repository has migrations up to 034. Migration **036** is the correct next number. Verify against the `supabase/migrations/` directory before writing the file.

### 4.5 RLS Policies

```sql
ALTER TABLE income_campaigns ENABLE ROW LEVEL SECURITY;

-- All authenticated RT members can see campaigns for their RT (enables Beranda/Dasbor widget)
CREATE POLICY "campaign: view"
    ON income_campaigns FOR SELECT TO authenticated
    USING (
        rt_id IN (SELECT rt_id FROM rt_members WHERE user_id = auth.uid())
        AND deleted_at IS NULL
    );

CREATE POLICY "campaign: create"
    ON income_campaigns FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'income.campaign.create'));

CREATE POLICY "campaign: update"
    ON income_campaigns FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'income.campaign.update') AND deleted_at IS NULL)
    WITH CHECK (has_permission(rt_id, 'income.campaign.update'));

CREATE POLICY "campaign: delete"
    ON income_campaigns FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'income.campaign.delete'));
```

The view policy is intentionally broader than `income.view`: all RT members (including RESIDENT) can see their RT's campaigns. Cross-RT access is prevented by the RT membership check — a resident or staff member of RT A cannot see RT B's campaigns.

### 4.6 Contribution Code

A `contribution_code` uniquely identifies a single monetary contribution within an RT. It is the human-readable reference a resident puts in the bank transfer remark field for future reconciliation.

**Format (display convention — not a database constraint):**

```
{CONTRIBUTION_CODE_PREFIX}{YY}-{N}
```

| Segment | Example | Source |
|---|---|---|
| `PREFIX` | `AG` | `income_campaigns.contribution_code_prefix` |
| `YY` | `26` | Last 2 digits of current year at contribution creation time |
| `N` | `421` | Sequence integer, RT-scoped |

Examples: `AG26-421`, `AG26-422`. Display may zero-pad `N` (e.g., `AG26-00421`) — this is a presentation convention only. The database stores the raw string as generated.

**Generation rules:**

1. Generated **exclusively server-side** in `POST /api/income` when `campaign_id` is set. The client MUST NOT supply, modify, or predict the value.
2. The sequence counter MUST use a **database-level concurrency-safe mechanism** (e.g., a PostgreSQL `SEQUENCE`, an advisory lock, or a row-level lock on a counters table). **`SELECT MAX(sequence) + 1` is explicitly prohibited** — it is unsafe under concurrent inserts and may produce duplicate codes.
3. **Gaps in sequence numbers are acceptable.** The requirement is uniqueness and concurrency safety, not gap-freedom.
4. The database stores `contribution_code` as a `text` column with no length constraint beyond the unique index. There is **no artificial five-digit limit** — the sequence integer grows naturally.
5. The exact sequence scope (per-RT, per-campaign, per-year) is an implementation decision. RT-scoped is recommended for simplicity.

**Immutability:**

> Once generated, a Contribution Code MUST NOT be changed during the normal lifecycle of the contribution.

The code may already have been:
- displayed to the resident in the success screen;
- copied into a bank transfer remark;
- shown in a push notification;
- included in an import result summary;
- referenced in a future reconciliation process.

If a contribution must be corrected, use the existing **cancellation/reversal** semantics and create a new transaction. Do not update the `contribution_code` of the original record.

**Contribution code is NOT generated for in-kind contributions.** In-kind contributions have no bank reconciliation use case.

---

## 5. Permissions

### 5.1 New Permission Codes

A separate `income.campaign.view` permission is **not introduced** for MVP. Campaign visibility for all RT members is enforced directly by the RLS policy in §4.5 (RT membership check). The Income module's campaign tab (staff-facing management view) follows the existing `income.view` permission.

| Code | Description |
|---|---|
| `income.campaign.create` | Create a fundraising campaign |
| `income.campaign.update` | Edit campaign metadata or transition its status |
| `income.campaign.delete` | Soft-delete or cancel a DRAFT campaign |

### 5.2 Role Matrix

| Capability | RT_ADMIN | RT_CHAIR | TREASURER | SECRETARY | RESIDENT |
|---|:---:|:---:|:---:|:---:|:---:|
| See campaigns on Beranda/Dasbor (RLS) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View campaign list in Income tab (`income.view`) | ✅ | ✅ | ✅ | ✅ | ❌ |
| `income.campaign.create` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `income.campaign.update` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `income.campaign.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve/reject contributions (`income.approve`) | ✅ | ✅ | ❌ | ❌ | ❌ |

SUPER_ADMIN is not assigned an rt_members membership and therefore has no RT-scoped campaign visibility through this RLS policy.

### 5.3 `lib/auth/types.ts` additions

```typescript
// Income — Campaigns
INCOME_CAMPAIGN_CREATE: 'income.campaign.create',
INCOME_CAMPAIGN_UPDATE: 'income.campaign.update',
INCOME_CAMPAIGN_DELETE: 'income.campaign.delete',
```

---

## 6. API Design

Follows `docs/api/API_CONVENTION.md`.

### 6.1 Campaign Endpoints

#### `GET /api/income/campaigns`
Paginated campaign list. Query params: `page`, `pageSize`, `status` (`DRAFT|ACTIVE|COMPLETED|CANCELLED|all`), `search` (name ilike). Response: `PageResult<CampaignRow>` with computed `approved_amount`, `pending_amount`, `donor_count`. Permission: `income.view`.

#### `POST /api/income/campaigns`
Creates a campaign (status defaults to `DRAFT`). Body:

```json
{
  "name": "Renovasi Balai RT",
  "contribution_code_prefix": "RBR",
  "description": "...",
  "target_amount": 20000000,
  "starts_at": "2026-08-01",
  "ends_at": "2026-10-31"
}
```

Server validates:
- `contribution_code_prefix`: 2–4 uppercase ASCII letters.
- Prefix must not exist in the RT, including soft-deleted or cancelled campaigns (prefix retires permanently).

Permission: `income.campaign.create`. Activity log: `campaign_create`.

#### `GET /api/income/campaigns/active`
Lightweight, unpaginated list of campaigns that are currently accepting contributions:

```sql
WHERE status = 'ACTIVE'
  AND starts_at <= CURRENT_DATE
  AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)
```

Used by Beranda/Dasbor widget and `IncomeForm` selector. No explicit permission check — RLS (RT membership) enforces scope.

#### `GET /api/income/campaigns/[id]`
Single campaign with `approved_amount`, `pending_amount`, monetary contribution list (each row includes `contribution_code`), and in-kind contribution list. Permission: `income.view` for staff; RT membership RLS for all.

#### `PUT /api/income/campaigns/[id]`
Updates `name`, `description`, `target_amount`, `starts_at`, `ends_at` for `DRAFT` or `ACTIVE` campaigns. Rejects update to `contribution_code_prefix` if any contributions already exist for this campaign. Permission: `income.campaign.update`. Activity log: `campaign_update`.

#### `POST /api/income/campaigns/[id]/activate`
`DRAFT` → `ACTIVE`. Permission: `income.campaign.update`. Activity log: `campaign_activate`.

#### `POST /api/income/campaigns/[id]/cancel`
`ACTIVE` or `DRAFT` → `CANCELLED`. Body: `{ "cancelled_note": "..." }` (optional). Existing pending contributions continue through the approval flow unchanged. Permission: `income.campaign.update`. Activity log: `campaign_cancel`.

#### `DELETE /api/income/campaigns/[id]`
Soft-deletes a `DRAFT` or `CANCELLED` campaign with zero contributions. Permission: `income.campaign.delete`. Activity log: `campaign_delete`.

### 6.2 Modified Endpoints

#### `POST /api/income` (existing)
Accepts optional `campaign_id`. When set, server validates:
- Campaign exists, belongs to same RT, has status `ACTIVE`.
- `starts_at <= today` (campaign has started).
- `ends_at IS NULL OR ends_at >= today` (campaign has not ended).
- `income_category = 'DONATION'`.

Server then:
1. Generates `contribution_code` atomically using a DB-level sequence (see §4.6). `SELECT MAX + 1` is prohibited.
2. Stores `contribution_code` on the new `income_transaction`.
3. Returns `contribution_code` in the response body.

After approval (see `POST /api/income/[id]/approve` below), the campaign completion check fires.

#### `POST /api/income/[id]/approve` (existing)
After approving a transaction that has a `campaign_id`:
1. Recalculate `approved_amount = SUM(amount) WHERE campaign_id = ? AND income_category = 'DONATION' AND status = 'approved'`.
2. If `target_amount IS NOT NULL AND approved_amount >= target_amount`: transition campaign to `COMPLETED` in the same DB transaction; emit `campaign_completed` activity log; create notifications.

This check is synchronous and requires no separate job or scheduler.

#### `GET /api/income` (existing)
Accepts optional `campaign_id` query param to filter transactions by campaign.

#### Income import template (existing)
Gains optional `campaign_name` column. See §10.

### 6.3 API Contract: Contribution Code

- The server **always** generates `contribution_code`. There is no API parameter for the client to supply one.
- Any endpoint that accepts contribution data (live form or import) must reject a client-supplied `contribution_code` field.
- A `contribution_code`, once stored, is **never modified** by any update endpoint.
- `PUT /api/income/[id]` must explicitly exclude `contribution_code` from its updatable field set.

---

## 7. Business Rules

### 7.1 Contribution Code Is Not Proof of Payment

> A Contribution Code is NOT proof that money has been received by the RT.

It is a **correlation reference** that identifies one specific intended contribution. The flow is:

```
Resident records contribution → contribution_code generated
         ↓
Resident uses code as bank transfer remark
         ↓
Bank transfer occurs (or may not occur)
         ↓
Future reconciliation validates actual bank movement
```

Creating a contribution record does not mean funds have entered the RT account. The code links the resident's stated intent to a future bank statement line. The UI must communicate this clearly (see §13 i18n `contributionCode.notProof`).

### 7.2 Campaign Target Completion (Synchronous)

When a monetary contribution approval changes a campaign's approved sum:

```
Approve income_transaction (campaign_id = X, income_category = 'DONATION')
         ↓
SELECT SUM(amount) WHERE campaign_id = X AND income_category = 'DONATION'
       AND status = 'approved' AND deleted_at IS NULL
         ↓
approved_amount >= target_amount AND target_amount IS NOT NULL AND campaign.status = 'ACTIVE'?
         ↓
YES → UPDATE income_campaigns SET status = 'COMPLETED' (same DB transaction)
    → INSERT activity log: campaign_completed
    → CREATE notifications: RT_ADMIN, RT_CHAIR
```

This fires synchronously in `POST /api/income/[id]/approve`. No scheduler is required.

### 7.3 Contribution Acceptance Window and Deadline Behavior (Lazy Evaluation)

There is **no scheduler or cron job** for campaign expiry in this sprint.

A campaign actively accepts contributions only when all three conditions hold simultaneously:

```
status = 'ACTIVE'
AND starts_at <= CURRENT_DATE     ← campaign has started
AND (ends_at IS NULL OR ends_at >= CURRENT_DATE)  ← campaign has not ended
```

An `ACTIVE` campaign where `starts_at > today` is **published but not yet open**. It does not appear in the selector or widget, and `POST /api/income` will reject a contribution attempt against it.

Laziness rules:
- `GET /api/income/campaigns/active` applies all three conditions as SQL `WHERE` filters.
- `POST /api/income` re-validates all three conditions server-side before inserting.
- The campaign's `status` column does **not** change automatically when `ends_at` passes or before `starts_at` is reached.
- Existing pending contributions linked to a campaign that has since expired **continue through the approval flow unchanged**. They are not automatically rejected.
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

In-kind contributions MUST NOT automatically increase monetary campaign progress. They MUST NOT automatically create a cash `income_transaction`. They are displayed separately in the campaign detail view.

### 7.5 Progress Calculation

```sql
-- Official progress (used for completion check and percentage display)
approved_amount = SUM(amount)
    WHERE campaign_id = :id
      AND income_category = 'DONATION'
      AND status = 'approved'
      AND deleted_at IS NULL

-- Informational pending (displayed separately, never used for completion check)
pending_amount = SUM(amount)
    WHERE campaign_id = :id
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

URL: `/income?tab=campaigns`. The `Kampanye` tab renders `CampaignListView`. Active campaigns are also surfaced on Beranda and Dasbor (§8.7).

### 8.2 Campaign List View (`/income?tab=campaigns`)

`DataTable` with columns: Name, Status badge, Contribution Code Prefix, Target, Approved Progress, Donor Count, Period, Actions.

Filters: status select. Search: by campaign name.

`+ Buat Kampanye` button (gated by `income.campaign.create`). Row click → `CampaignDetailDrawer`.

### 8.3 Campaign Detail Drawer

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

Actions gated by `income.campaign.update`:
- `[Aktifkan]` — shown for `DRAFT`
- `[Edit]` — shown for `DRAFT` or `ACTIVE`
- `[Batalkan Kampanye]` — shown for `ACTIVE`

### 8.4 Campaign Form (Create / Edit)

Fields:
- Nama Kampanye (required)
- Prefiks Kode Kontribusi (required, 2–4 uppercase letters; live preview, e.g. `RBR26-1`; locked after first contribution is recorded)
- Deskripsi (textarea, optional)
- Target Dana (number, optional — leave blank for no target)
- Tanggal Mulai (date, required, default: today)
- Tanggal Selesai (date, optional — leave blank for no deadline)

### 8.5 Income Form — Campaign Selector and Contribution Code

When `income_category = 'DONATION'`, an optional selector appears using active campaigns from `GET /api/income/campaigns/active`. Hidden entirely if no active campaigns exist.

After a campaign-linked monetary contribution is submitted successfully, the form's success state prominently displays:

```
Donasi berhasil dicatat.

Kode Kontribusi: RBR26-421
Gunakan kode ini sebagai keterangan saat transfer bank.
Kode kontribusi bukan bukti penerimaan dana.

[Salin Kode]
```

The code is read-only and copyable. It also appears on the transaction detail drawer at any later time.

### 8.6 Progress Display (`CampaignProgressBar`)

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

### 8.7 Campaign Cards on Beranda and Dasbor

Active campaigns appear for all authenticated RT members on **Beranda** (resident home) and **Dasbor** (staff dashboard).

**RT-scoping**: a resident or staff member sees only their own RT's campaigns. This is enforced by the RLS view policy (§4.5). No additional application-layer filter is needed.

**Visibility rule**: section is hidden entirely if no active, non-expired campaigns exist.

Each `CampaignCard` shows: campaign name, progress bar (approved + pending), target, deadline, `[Donasi Sekarang]` button.

Clicking `[Donasi Sekarang]` opens `IncomeForm` with:
- `income_category` pre-set to `DONATION`, **locked**
- `campaign_id` pre-set to this campaign, **locked**
- `resident_id` pre-set to the current user's resident record, **locked**
- `contribution_code`: not shown on the form (generated server-side after submit)
- Amount, method, notes, date: fully editable

---

## 9. Resident Donation Flow

```
Resident opens Beranda or Dasbor
         ↓
Active campaign card(s) visible
(RT-scoped; ends_at >= today or null)
         ↓
Resident clicks "Donasi Sekarang"
         ↓
IncomeForm opens
  - category = DONATION      (locked)
  - campaign = this campaign  (locked)
  - resident = current user   (locked)
         ↓
Resident fills: amount, method, notes (optional), date
         ↓
Resident submits
         ↓
Server:
  1. Validates campaign is ACTIVE and not expired
  2. Creates income_transaction (status: pending)
  3. Generates contribution_code via DB-level sequence (atomic)
  4. Stores contribution_code on the transaction
  5. Returns contribution_code in response
         ↓
UI displays success state:
  "Kode Kontribusi: RBR26-421
   Gunakan kode ini sebagai keterangan saat transfer bank.
   Kode kontribusi bukan bukti penerimaan dana."
  [Salin Kode]
         ↓
Transaction enters existing approval flow
(RT_CHAIR reviews and approves or rejects)
         ↓
If approved:
  - campaign approved_amount recalculated
  - target check fires synchronously
  - if target reached → campaign → COMPLETED + notification
         ↓
Resident can view contribution_code in transaction history at any time
```

**Important:** The contribution does not count toward official campaign progress until approved.

---

## 10. Import Design

The existing income import template gains one optional column: `campaign_name` (text).

**Why `campaign_name`?**

| Option | Assessment |
|---|---|
| `campaign_name` | Human-readable, easy to fill in a spreadsheet. Chosen. |
| `contribution_code_prefix` | Identifies the code namespace, not the campaign — misleading. |
| `campaign_id` | UUID — not operator-friendly. |

Server resolution: `campaign_name` → `campaign_id` by case-insensitive exact match within the RT against `ACTIVE` campaigns. An unresolvable or expired campaign name is a row-level validation error.
Import campaign-linked contributions is intended for active campaigns only.

**Contribution code in import:**

- `contribution_code` is **not** an import column.
- For each monetary (`DONATION`) row that resolves to a campaign, the server generates a `contribution_code` at import-processing time using the same DB-level sequence logic as the live form.
- Generated codes are included in the import result summary so the operator can distribute them to contributors.
- An imported record **must not** supply its own `contribution_code`. Accepting a client-supplied code would violate the server-side generation invariant and could create collisions with live contributions. If an imported record must reference an existing contribution, that is a reconciliation operation, not an import operation.

---

## 11. Activity Log

| Action | Trigger |
|---|---|
| `campaign_create` | New campaign created |
| `campaign_activate` | `DRAFT` → `ACTIVE` |
| `campaign_update` | Metadata edited |
| `campaign_cancel` | Status → `CANCELLED` |
| `campaign_delete` | Soft-deleted |
| `campaign_completed` | `ACTIVE` → `COMPLETED` (target reached on approval) |

All entries: `entity_type: 'campaign'`, `entity_id: campaign.id`.

---

## 12. Notifications

| Trigger | Recipients | Message |
|---|---|---|
| Target reached (`COMPLETED`) | RT_ADMIN, RT_CHAIR | `"Kampanye [name] telah mencapai target Rp X"` |

Deadline passing does **not** trigger a notification (no scheduler in this sprint). A future background job may add this separately.

---

## 13. i18n Keys

New namespace `income.campaigns` in `messages/id.json`:

```json
"campaigns": {
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
    "codePrefix": "Prefiks Kode",
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
    "codePrefix": "Prefiks Kode Kontribusi",
    "codePrefixHint": "2-4 huruf kapital, contoh: RBR untuk Renovasi Balai RT",
    "codePrefixPreview": "Kode kontribusi akan tampak seperti: {preview}",
    "codePrefixLocked": "Prefiks tidak dapat diubah setelah kontribusi pertama dicatat",
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

The `contribution_code` is designed as a **high-confidence reconciliation candidate / matching key**. It is **not** an automatic approval trigger.

Conceptual future reconciliation flow (separate sprint):

```
Bank statement imported
         ↓
Extract transfer remark/description
         ↓
Search for contribution_code pattern (e.g. RBR26-421)
         ↓
Candidate contribution found
         ↓
Validate:
  - code matches an existing contribution_code
  - amount matches (within configurable tolerance?)
  - date is plausible
  - contribution not already reconciled
  - contribution status (pending / approved)
  - no duplicate bank mutation already matched
         ↓
Reconciliation decision
(human review, or future auto-approve policy)
```

> Exact Contribution Code matching is a strong signal, but final reconciliation and auto-approval policy will be defined by the future banking/reconciliation architecture. This feature does not commit to any automatic approval behavior.

Design choices that support this future without coupling to it:
- RT-scoped uniqueness: a `contribution_code` resolves to exactly one transaction, no ambiguity.
- `contribution_code_prefix` differentiates campaigns in raw bank statements (human scannable).
- Codes persist even when campaigns are `COMPLETED` or `CANCELLED` — they remain valid reconciliation keys.
- Prefix uniqueness spans deleted campaigns: no historical ambiguity across the RT's lifetime.

---

## 15. File Structure

New files to create:

```
features/income/
  components/campaigns/
    CampaignListView.tsx          — DataTable for campaign management (staff)
    CampaignDetailDrawer.tsx      — Detail drawer: progress, donation list, in-kind list
    CampaignForm.tsx              — Create/Edit modal
    CampaignCard.tsx              — Compact card for Beranda/Dasbor
  hooks/
    useCampaignData.ts            — Paginated list (pattern: useIncomeData)
    useActiveCampaigns.ts         — Unpaginated active list for selector + cards
    useCampaignActions.ts         — activate, cancel, delete handlers
  services/
    campaign-transform.ts         — mapCampaign(): adds progressPct, formattedTarget

app/api/income/campaigns/
  route.ts                        — GET (list) + POST (create)
  active/route.ts                 — GET (active, unpaginated)
  [id]/
    route.ts                      — GET (detail) + PUT (update) + DELETE
    activate/route.ts             — POST
    cancel/route.ts               — POST

lib/repositories/
  incomeCampaign.repository.ts

supabase/migrations/
  035_income_campaigns.sql

components/common/
  CampaignProgressBar.tsx         — Props: approved, pending, target
```

Modified files:

```
features/income/IncomeContainer.tsx          — Add tab state; render CampaignListView
features/income/IncomeView.tsx               — Add tab UI
features/income/components/forms/IncomeForm.tsx  — Campaign selector; contribution code success state
app/api/income/route.ts                      — Accept campaign_id filter param
app/api/income/[id]/approve/route.ts         — Synchronous campaign completion check
features/beranda/BerandaView.tsx             — Active campaign cards section
features/dasbor/DasborView.tsx               — Active campaign cards section
lib/auth/types.ts                            — Add INCOME_CAMPAIGN_* permissions
messages/id.json                             — Add income.campaigns namespace
```

---

## 16. Decisions Locked

All confirmed by product owner (2026-08-22). Do not reopen during implementation.

| # | Topic | Decision |
|---|---|---|
| 1 | Navigation | Tab within Income module — `/income?tab=campaigns` |
| 2 | Target completion | Synchronous check in approval handler; same DB transaction |
| 3 | Deadline handling | Lazy evaluation (`ends_at < today` filter); no scheduler |
| 4 | Resident visibility | All RT members (RT-scoped by RLS); Beranda + Dasbor cards |
| 5 | Campaign status lifecycle | `DRAFT → ACTIVE → COMPLETED / CANCELLED`; no `EXPIRED`, no `CLOSED` |
| 6 | Contribution Code generation | Server-side only; DB-level sequence; `SELECT MAX+1` prohibited; gaps acceptable |
| 7 | Contribution Code immutability | Never modified after issuance; correction via reversal only |
| 8 | Contribution Code length | No artificial digit limit; display format is a presentation convention |
| 9 | Contribution Code not proof | Explicitly stated in UI and API contract |
| 10 | In-kind contributions | Recorded on `income_transactions`; do not increase monetary progress |
| 11 | Campaign ledger | No separate ledger; `income_transactions` is the sole authoritative financial record |
| 12 | `income.campaign.view` permission | Not introduced; visibility via RLS (RT membership); Income tab via `income.view` |
| 13 | Import | `campaign_name` column (readable); `contribution_code` server-generated, not importable |
| 14 | Progress denominator | Approved monetary only; pending shown informational |
| 15 | Progress model | `approved_amount / target_amount`; never includes pending |
| 16 | Contribution acceptance window | `status = 'ACTIVE' AND starts_at <= today AND (ends_at IS NULL OR ends_at >= today)`; all three enforced server-side |
| 17 | `income_category` enum | `IN_KIND` added via `ALTER TYPE ... ADD VALUE`; `amount NOT NULL` preserved; in-kind uses `amount = 0` when no estimate |
| 18 | FK deletion protection | `ON DELETE RESTRICT` on `income_transactions.campaign_id`; soft-delete (deleted_at) does not trigger constraint; application layer also blocks deletion of campaigns with contributions |

---

## 17. Implementation Decisions (Remaining)

These belong to the implementation sprint and do not need to be resolved now:

- **Sequence mechanism**: exact PostgreSQL implementation (e.g., one `CREATE SEQUENCE` per RT, a shared `rt_contribution_sequence` table with row-level locking, or a Supabase Edge Function counter). Choose the option most consistent with the existing project's migration and architecture patterns.
- **Contribution Code display format**: confirm whether to zero-pad `N` (e.g., `RBR26-00421` vs `RBR26-421`) — a presentation decision, not a schema constraint.
- **Exact migration number**: verify 035 is correct against the current repository's migration directory before writing the file.
- **`income_category = 'IN_KIND'`**: confirm this value is already defined in the existing income category enum/constants, or add it.
- **Beranda/Dasbor slot**: identify the exact component and position in both pages for inserting the campaign card row.
- **Contribution Code in existing notification payloads**: if the notification system sends push/email, include `contribution_code` in the notification payload for future extensibility.

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
| `IncomeForm` extension | 🔲 This sprint |
| `035_income_campaigns.sql` migration | 🔲 This sprint |
| Beranda/Dasbor campaign card slot | 🔲 This sprint |
| DB-level sequence mechanism | 🔲 This sprint |
