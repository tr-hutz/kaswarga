# Financial Income Domain Model

> Project: KasWarga
>
> Version: 1.0
>
> Sprint: 5.9

---

## Purpose

This document defines the Income domain for KasWarga.

Income represents every cash inflow that does **not** originate from resident contribution obligations (iuran). It is the complementary counterpart to the Expense domain: Expense governs cash outflows; Income governs non-mandatory cash inflows.

---

## Distinction From Payment

| Dimension | Payment | Income |
|-----------|---------|--------|
| Obligation | Mandatory monthly dues | Voluntary or operational |
| Origin | Resident iuran cycle | External sources |
| Bills | Generates billing records | Never generates bills |
| Arrears | Tracked per resident | Never generates arrears |
| Approval | Confirmation → Approval | Direct record → Approval |
| Ledger source | `pembayaran` | `income` |

Payment handles the resident dues lifecycle. Income handles everything else.

---

## Distinction From Expense

Expense = cash **outflow** (pengeluaran).
Income = cash **inflow** that is not iuran.

Both share the same approval pattern (pending → approved/rejected) and both create ledger entries on approval. The direction differs: expenses debit the balance; income credits it.

---

## Income Categories

Implemented as a PostgreSQL enum `income_category`. No CRUD UI — categories are version-controlled via migrations.

| Value | Indonesian label | Description |
|-------|-----------------|-------------|
| `DONATION` | Donasi | Voluntary cash donations from individuals or organisations |
| `GOVERNMENT` | Bantuan Pemerintah | Government grants, subsidies, or aid |
| `EVENT` | Acara | Revenue generated from RT-organised events |
| `BAZAAR` | Bazaar | Revenue from bazaar or market activities |
| `RENTAL` | Sewa | Rental income from RT facilities or assets |
| `SALES` | Penjualan | Revenue from the sale of goods |
| `INTEREST` | Bunga | Bank interest or savings returns |
| `OTHER` | Lainnya | Any income that does not fit the categories above |

---

## Source Types

Implemented as a PostgreSQL enum `income_source_type`.

| Value | Description |
|-------|-------------|
| `RESIDENT` | Income from a registered resident — links to `residents.id` |
| `NON_RESIDENT` | Income from a non-registered individual |
| `ORGANIZATION` | Income from an organisation or company |
| `GOVERNMENT` | Income from a government body |
| `ANONYMOUS` | Payer identity is unknown or withheld |

When `source_type = RESIDENT`, a `resident_id` foreign key must be provided.
When `is_anonymous = true`, `payer_name` must be null.

---

## Entity: income_transactions

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| rt_id | uuid | Owning RT — enforces tenant isolation |
| income_category | income_category | Category enum |
| income_name | text | Human-readable name for this income entry |
| resident_id | uuid (nullable) | FK to residents — required when source_type = RESIDENT |
| source_type | income_source_type | Who provided the income |
| payer_name | text (nullable) | Name of payer when not a resident |
| is_anonymous | boolean | True when identity is withheld |
| payment_method | text (nullable) | Cash, transfer, QRIS, etc. |
| reference_number | text (nullable) | Bank reference, receipt number |
| amount | bigint | Amount in IDR (rupiah, no decimals) |
| received_at | date | Date the income was physically received |
| status | text | `pending` / `approved` / `rejected` |
| notes | text (nullable) | Free-form notes |
| attachment_url | text (nullable) | Receipt or document URL |
| created_by | uuid | Membership user who recorded the income |
| approved_by | uuid (nullable) | Membership user who approved |
| approved_at | timestamptz (nullable) | Approval timestamp |
| rejected_at | timestamptz (nullable) | Rejection timestamp |
| rejection_note | text (nullable) | Reason for rejection |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |
| deleted_at | timestamptz (nullable) | Soft delete timestamp |

---

## Approval Workflow

```
TREASURER records income (status = pending)
        ↓
RT_CHAIR or RT_ADMIN reviews
        ↓
    Approve                Reject
        ↓                      ↓
status = approved       status = rejected
        ↓
insert_ledger(
  type    = 'pemasukan',
  source  = 'income',
  ref_id  = income.id
)
```

Key invariants:
- A ledger entry is created **only** on approval, never on creation.
- Rejection does not affect the ledger.
- An approved income record cannot be edited or deleted.
- Approval is irreversible — a new income record must be created to correct an error.

---

## Cashflow Integration

When an income record is approved, `insert_ledger()` is called with:

```sql
type         = 'pemasukan'    -- credit / inflow
source       = 'income'       -- distinguishes from 'pembayaran'
reference_id = income.id
amount       = income.amount
```

The cashflow chart and ledger view automatically include income entries because they query all ledger rows. No changes to the ledger table structure are required.

---

## RBAC

| Permission | Assigned to |
|-----------|-------------|
| income.view | RT_ADMIN, RT_CHAIR, TREASURER, SECRETARY |
| income.create | RT_ADMIN, TREASURER |
| income.update | RT_ADMIN, TREASURER |
| income.delete | RT_ADMIN, TREASURER |
| income.approve | RT_ADMIN, RT_CHAIR |
| income.reject | RT_ADMIN, RT_CHAIR |

RT-level overrides apply as with all other modules.

---

## Business Rules

| Rule | Description |
|------|-------------|
| BR-100 | Income never generates bills or arrears |
| BR-101 | Income requires approval before a ledger entry is created |
| BR-102 | Approved income cannot be edited or deleted |
| BR-103 | Approved income generates exactly one ledger entry (type=pemasukan, source=income) |
| BR-104 | source_type RESIDENT requires a resident_id |
| BR-105 | is_anonymous=true requires payer_name=null |

---

## Out of Scope (Sprint 5.9)

- Recurring income schedules
- Campaign or fund management
- Bank SDK integration
- Automatic reconciliation
- Accounting journal / double-entry

These are planned for a future Financial Reconciliation Engine sprint.

---

*End of document.*
