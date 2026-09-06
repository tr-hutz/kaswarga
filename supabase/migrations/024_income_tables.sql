/*
 * 024_income_tables
 *
 * Income Management — income_transactions table and supporting enums.
 *
 * Dependencies:
 *   000_foundation  (rt, residents)
 *   013_rbac_functions (has_permission)
 */


/* --------------------------------------------------------------------------
 * ENUM: income_category
 * Implemented as enum — no CRUD UI, categories are version-controlled.
 * -------------------------------------------------------------------------- */

CREATE TYPE income_category AS ENUM (
    'DONATION',
    'GOVERNMENT',
    'EVENT',
    'BAZAAR',
    'RENTAL',
    'SALES',
    'INTEREST',
    'OTHER'
);


/* --------------------------------------------------------------------------
 * ENUM: income_source_type
 * -------------------------------------------------------------------------- */

CREATE TYPE income_source_type AS ENUM (
    'RESIDENT',
    'NON_RESIDENT',
    'ORGANIZATION',
    'GOVERNMENT',
    'ANONYMOUS'
);


/* --------------------------------------------------------------------------
 * TABLE: income_transactions
 * Records every cash inflow that does not originate from iuran obligations.
 * Ledger entry (type=pemasukan, source=income) is created on approval only.
 * -------------------------------------------------------------------------- */

CREATE TABLE income_transactions (
    id               uuid                NOT NULL DEFAULT gen_random_uuid(),
    rt_id            uuid                NOT NULL,
    income_category  income_category     NOT NULL,
    income_name      text                NOT NULL,
    resident_id      uuid,
    source_type      income_source_type  NOT NULL DEFAULT 'ANONYMOUS',
    payer_name       text,
    is_anonymous     boolean             NOT NULL DEFAULT false,
    payment_method   text,
    reference_number text,
    amount           bigint              NOT NULL,
    received_at      date                NOT NULL DEFAULT CURRENT_DATE,
    status           text                NOT NULL DEFAULT 'pending',
    notes            text,
    attachment_url   text,
    created_by       uuid,
    approved_by      uuid,
    approved_at      timestamptz,
    rejected_at      timestamptz,
    rejection_note   text,
    created_at       timestamptz         NOT NULL DEFAULT now(),
    updated_at       timestamptz         NOT NULL DEFAULT now(),
    updated_by       uuid,
    deleted_at       timestamptz,
    deleted_by       uuid,

    CONSTRAINT income_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT income_transactions_rt_fk
        FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE,
    CONSTRAINT income_transactions_resident_fk
        FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);


/* --------------------------------------------------------------------------
 * INDEXES
 * -------------------------------------------------------------------------- */

CREATE INDEX idx_income_rt_id    ON income_transactions(rt_id);
CREATE INDEX idx_income_status   ON income_transactions(status);
CREATE INDEX idx_income_category ON income_transactions(income_category);
CREATE INDEX idx_income_received ON income_transactions(received_at DESC);


/* --------------------------------------------------------------------------
 * ROW LEVEL SECURITY
 * -------------------------------------------------------------------------- */

ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income: view"
    ON income_transactions FOR SELECT TO authenticated
    USING (has_permission(rt_id, 'income.view') AND deleted_at IS NULL);

CREATE POLICY "income: create"
    ON income_transactions FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'income.create'));

CREATE POLICY "income: update"
    ON income_transactions FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'income.update') AND deleted_at IS NULL)
    WITH CHECK (has_permission(rt_id, 'income.update'));

CREATE POLICY "income: delete"
    ON income_transactions FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'income.delete'));


/* --------------------------------------------------------------------------
 * STORAGE BUCKET: income-attachments
 * Stores proof-of-payment files for income transactions.
 * -------------------------------------------------------------------------- */

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'income-attachments',
    'income-attachments',
    false,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;
