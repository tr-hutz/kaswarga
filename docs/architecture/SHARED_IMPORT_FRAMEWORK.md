# SHARED_IMPORT_FRAMEWORK.md

> Project: KasWarga
>
> Version: 1.0
>
> Created: August 2026

---

# 1. Purpose

This document captures the audit of the existing import implementation and specifies the target
architecture for the Shared Import Framework.

It is the authoritative design reference for the import sprint.

---

# 2. Current Architecture

## 2.1 Overview

The current import system is a synchronous, dialog-blocking architecture built around a shared
client-side hook (`useImport`) and per-domain route handlers.

```
Browser
    │
    ├── User opens ImportModal
    │       (dialog stays open for the entire import)
    │
    ├── useImport parses Excel/CSV client-side (ExcelJS)
    │
    ├── useImport splits rows into batches (default: 150 rows/batch)
    │
    └── For each batch:
            POST /api/{module}/import
                 ↓
            Synchronous server processing
                 ↓
            Returns { inserted, skipped }
                 ↓
            Client updates local progress counter
```

## 2.2 Shared Components

### `components/common/import/useImport.ts`

The shared client-side hook consumed by all three import features.

Responsibilities:
- File selection and parsing (ExcelJS for XLSX, custom parser for CSV)
- Column alias normalization (flexible header mapping)
- Batch splitting (configurable `batchSize`, default 150)
- Sequential batch dispatch via `fetch`
- Local progress state (`progress`, `processedRows`, `totalRows`)
- Template download (ExcelJS)
- Error state management

Limitations:
- Progress is calculated from local batch counters, NOT from the server
- The browser request must remain open for each batch
- No persistent job record — a page refresh loses all progress state
- No per-row error details returned to the user
- Dialog must stay open while importing

### `components/common/import/ImportModal.tsx`

Shared dialog component used by Payment, Resident, and Income modules.

Responsibilities:
- File drop/select UI
- Preview table (valid/invalid row counts)
- Inline progress bar during import
- Template download button

Limitations:
- The dialog remains open during the entire import
- No global/persistent notification
- User cannot navigate away while importing

## 2.3 Domain-Specific Route Handlers

### Payment Import (`app/api/payments/import/route.ts`)

Business logic specific to payment confirmations:
- RBAC: requires `payment.update` permission
- Groups rows by `block + house_number + year`
- Resident lookup by block + house_number (case-insensitive)
- Dedup: queries existing `confirmation_details` for `resident_id + year + month`
- Inserts `payment_confirmations` (status=`pending`) + `confirmation_details`
- Uploads reconstructed Excel to Supabase Storage (`payment-proof` bucket)
- Records activity log
- **Does NOT notify** — notification is deferred to `/api/payments/import-notify`

### Payment Import Notify (`app/api/payments/import-notify/route.ts`)

Called once by the client after ALL batches complete.
- Sends one notification to all active TREASURERs
- Best-effort (errors are swallowed)

Why separate? The import route is batched (client calls it N times); the notify should fire only once
at the end. The client coordinates this by calling import-notify after the last batch.

### Income Import (`app/api/income/import/route.ts`)

- RBAC: requires `income.import` permission
- Dedup: `income_name (lower) + received_at + amount`
- Status: `pending` (awaiting CHAIR approval)
- Notifies all active CHAIRs inline (one notification per import call — NOT deferred)

Issue: because the hook batches calls, CHAIR may receive multiple notifications for one file.

### Resident Import (`app/api/residents/import/route.ts`)

- RBAC: requires `resident.create` permission
- Dedup: `block (lower) + house_number (lower)`
- No approval needed — rows are inserted immediately as active residents
- Activity log only

## 2.4 Per-Domain Import Hooks

Each module has a thin wrapper over `useImport`:

| Hook | Column Aliases | Endpoint | Template |
|------|---------------|----------|----------|
| `usePaymentImport` | blok, nomor_rumah, tahun, bulan, jumlah | `/api/payments/import` | payment-import-template.xlsx |
| `useResidentImport` | nama, blok, no_rumah, hp | `/api/residents/import` | resident-import-template.xlsx |
| `useIncomeImport` | tanggal, nominal, sumber | `/api/income/import` | income-import-template.xlsx |

## 2.5 Database Structures (Import-Related)

No dedicated import job or result tables exist.

Imports insert directly into the domain tables:
- `payment_confirmations` + `confirmation_details` (status=pending)
- `income_transactions` (status=pending)
- `residents` (active=true)

Import activity is recorded only via `activity_logs`.

## 2.6 RBAC

| Module | Import Permission | Approval Permission |
|--------|------------------|-------------------|
| Payment | `payment.update` (current) | `payment.approve` |
| Resident | `resident.create` | N/A |
| Income | `income.import` | `income.approve` |

Note: Payment import currently uses `payment.update`. The framework will introduce `payment.import`
for clarity (see Task 19).

## 2.7 Existing Tests

- `e2e/payment.spec.ts` — covers payment submission and approval flows, NOT import
- `e2e/resident-management.spec.ts` — covers resident CRUD, NOT import
- `e2e/income.spec.ts` — covers income CRUD, NOT import

No unit or integration tests exist for any import routes or hooks.

---

# 3. Reusable Components

The following are candidates for direct reuse inside the new framework:

| Component | Location | Reusable As-Is |
|-----------|----------|---------------|
| ExcelJS file parser | `useImport.ts` (parseXLSX) | Extract to `lib/import/parser.ts` |
| CSV parser | `useImport.ts` (parseCSV) | Extract to `lib/import/parser.ts` |
| Column alias normalizer | `useImport.ts` (makeNormalizer) | Extract to `lib/import/parser.ts` |
| Template download | `useImport.ts` (downloadTemplate) | Keep in hook or move to helper |
| ImportModal UI | `ImportModal.tsx` | Adapt to show job-based progress |
| Resident dedup Set | resident import route | Extract to ResidentImportDefinition |
| Income dedup Set | income import route | Extract to IncomeImportDefinition |
| Payment dedup Set | payment import route | Extract to PaymentImportDefinition |
| Resident lookup map | payment import route | Extract to PaymentImportDefinition |

---

# 4. Payment-Specific Logic

The following logic belongs ONLY in the Payment Import adapter and must NOT be generalized:

- Grouping rows by `block + house_number + year`
- Resident lookup by block + house_number
- Dedup by `resident_id + year + month` against `confirmation_details`
- Insert into `payment_confirmations` (status=pending) and `confirmation_details`
- Excel file upload to `payment-proof` storage bucket
- Approval lifecycle: pending → approved → inserts into `payments` + `payment_details` + `ledger`

---

# 5. Generic Logic (Framework Responsibility)

The shared framework owns these concerns:

- Import job creation and lifecycle management
- File metadata recording
- Background execution coordination
- Progress tracking (server-side `processed_rows`, `progress_percent`)
- Status transitions (`QUEUED → PROCESSING → VALIDATING → PENDING_APPROVAL / COMPLETED / FAILED`)
- Row-level result collection (`import_job_rows`)
- Error aggregation and error report generation
- Approval lifecycle (where `approvalPolicy = BATCH`)
- Notification of job completion and approval requests
- Audit logging
- RBAC enforcement (importer permission, approver permission)
- RT isolation enforcement
- Retry/idempotency guards
- Realtime progress delivery (Supabase Realtime)

---

# 6. Proposed Target Architecture

## 6.1 Layered Diagram

```
                    Shared Import Framework
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
       Resident Adapter  Payment Adapter  Income Adapter
             │                │                │
             ▼                ▼                ▼
        Residents         Payments          Income
                              │                │
                              └───────┬────────┘
                                      ▼
                                   Cashflow
```

## 6.2 Import Lifecycle

```
Client
    │
    POST /api/import
    │   ↓
    │   Create import_jobs row (status=QUEUED)
    │   Persist file metadata
    │   Return { jobId }
    │
    │   [after() — runs after response is sent]
    │      Process import job:
    │          1. status → PROCESSING
    │          2. Parse rows from saved file
    │          3. status → VALIDATING
    │          4. Run adapter.validateRow() for each row
    │          5. Run adapter.transform() for valid rows
    │          6. Write import_job_rows (valid + invalid)
    │          7. Evaluate approvalPolicy
    │              NONE:  adapter.persist() → status → COMPLETED
    │              BATCH: status → PENDING_APPROVAL
    │
    ↓
    Client subscribes to import_jobs via Supabase Realtime
    Progress notification updates in real-time
    Dialog closes after job creation
    User can navigate freely
```

## 6.3 Background Processing

**Technology**: Next.js `after()` (stable since 15.1, available in 16.x)

```typescript
import { after } from 'next/server'

// In /api/import route:
after(async () => {
    await importEngine.processJob(job.id)
})

return NextResponse.json({ jobId: job.id })
```

`after()` continues execution after the HTTP response is sent.
No external queue, no worker infrastructure, no Kafka.
Compatible with Vercel deployment.

**Threshold**: Configurable via `IMPORT_ASYNC_THRESHOLD` env var (default: 200 rows)
- `≤ threshold`: synchronous processing (dialog waits, fast path)
- `> threshold`: background via `after()`, dialog closes immediately

For the initial implementation, the async background path is used for ALL imports to
simplify the architecture (single code path). The threshold may be revisited.

## 6.4 Progress Tracking

Progress is persisted server-side in `import_jobs`:

```sql
total_rows        integer
processed_rows    integer
success_rows      integer
failed_rows       integer
progress_percent  integer
```

The import engine updates these fields as it processes batches.
Supabase Realtime delivers changes to subscribed clients.

## 6.5 Global Notification UI

A new `ImportJobProvider` at the application shell level:
- Subscribes to `import_jobs` rows for the current user
- Renders a persistent notification panel (floating, survives navigation)
- Shows progress bar, row counts, and status
- On completion: shows summary + "View results" / "Download error report" links
- On approval needed: shows "Pending approval" with link to approval page

## 6.6 Approval Flow (BATCH policy)

```
PENDING_APPROVAL
    │
    ├── Approver sees import batch in the relevant module (e.g., /payments)
    │
    ├── POST /api/import/{id}/approve
    │       ↓ atomic check: status must be PENDING_APPROVAL
    │       ↓ adapter.persist() inside database transaction
    │       ↓ status → APPROVED
    │
    └── POST /api/import/{id}/reject
            ↓ status → REJECTED
```

Approval is idempotent: a second approval attempt returns 409 if already approved.

## 6.7 TypeScript Contract

```typescript
// lib/import/contract.ts

export interface ImportDefinition<T> {
    type:            ImportType
    importPermission: Permission
    approvePermission: Permission
    approvalPolicy:  ApprovalPolicy
    storageKey:      string   // Supabase Storage bucket path prefix

    columns:    ImportColumn[]
    template:   ImportTemplate

    validateRow(row: RawRow): RowValidationResult
    transform(row: RawRow):   T
    persist(rows: T[], jobId: string, rtId: string, userId: string): Promise<void>
}

export type ApprovalPolicy = 'NONE' | 'BATCH'
export type ImportType     = 'RESIDENT' | 'PAYMENT' | 'INCOME'
```

---

# 7. Migration Strategy

## Phase 1 — Foundation (current sprint)

1. Add `import_jobs` and `import_job_rows` tables
2. Implement shared engine, contracts, and adapters
3. Introduce new import routes `/api/import` alongside existing module routes
4. Migrate Payment, Resident, Income adapters
5. Update UI: ImportModal triggers new job-based flow
6. Preserve existing module-specific routes as deprecated fallbacks during transition

## Phase 2 — Cleanup (post-sprint)

1. Remove deprecated per-module import routes
2. Remove duplicate notification logic
3. Update E2E tests to use new import flow

---

# 8. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Vercel function timeout for >500-row imports | Low (RT scale) | Chunk server-side processing; tune batch sizes |
| Supabase Realtime subscription leak | Medium | Cleanup subscriptions on unmount |
| Race condition: double-approve | Low | Database-level status guard (UPDATE WHERE status=PENDING_APPROVAL) |
| `after()` failure silent to user | Low | Job status transitions to FAILED if error caught |
| Income approval notification duplicates | Fixed | Single notification at job completion, not per-batch |

---

# 9. Backward Compatibility

| Concern | Decision |
|---------|----------|
| Existing `/api/payments/import` route | Keep during transition; mark deprecated |
| `useImport` hook | Keep; update to support new job-based flow |
| `ImportModal` | Extend: shows job ID, triggers close-on-submit for large imports |
| Existing `payment_confirmations` (status=pending) | Not affected; adapter inserts same structure |
| Existing E2E tests | Must remain green throughout migration |
| `usePaymentImport` / `useResidentImport` / `useIncomeImport` hooks | Update to use new engine; signature preserved |

---

# 10. New Permissions Required

| Permission | Module | Purpose |
|-----------|--------|---------|
| `payment.import` | Payment | Replaces `payment.update` for import action |
| `payment.import.approve` | Payment | Approve imported payment batch |
| `income.import.approve` | Income | Approve imported income batch |

Existing permissions that remain valid:
- `resident.import` — already exists, no change
- `income.import` — already exists, no change

---

# 11. Storage

Import files are persisted to Supabase Storage bucket:

| Module | Bucket | Path |
|--------|--------|------|
| Payment | `payment-proof` | `imports/{rtId}/{jobId}.xlsx` |
| Resident | `imports` (new) | `resident/{rtId}/{jobId}.xlsx` |
| Income | `imports` (new) | `income/{rtId}/{jobId}.xlsx` |

---

# 12. Database ERD (Import Layer)

```
import_jobs
    │
    ├── id (uuid, PK)
    ├── rt_id (uuid, FK → rt)
    ├── import_type (import_type enum)
    ├── status (import_status enum)
    ├── filename
    ├── file_size
    ├── file_path (storage path)
    ├── total_rows
    ├── processed_rows
    ├── success_rows
    ├── failed_rows
    ├── progress_percent
    ├── created_by (uuid, FK → users)
    ├── approved_by (uuid, FK → users, nullable)
    ├── rejected_by (uuid, FK → users, nullable)
    ├── rejection_reason (text, nullable)
    ├── started_at
    ├── completed_at
    ├── approved_at
    ├── created_at
    └── updated_at

import_job_rows
    │
    ├── id (uuid, PK)
    ├── import_job_id (uuid, FK → import_jobs)
    ├── row_number (integer)
    ├── status (row_status enum: VALID, INVALID, SKIPPED)
    ├── raw_data (jsonb)
    ├── error_code (text, nullable)
    ├── error_message (text, nullable)
    └── created_at
```
