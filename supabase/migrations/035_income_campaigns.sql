-- Sprint 5.9 — Income Donation Tracking
-- Must be first: enum additions cannot be inside a transaction with table DDL in some PG versions,
-- but PG 12+ allows transactional enum additions. Listed first so it's defined before any column uses it.
ALTER TYPE income_category ADD VALUE IF NOT EXISTS 'IN_KIND';

-- ─── income_donations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS income_donations (
    id            uuid        NOT NULL DEFAULT gen_random_uuid(),
    rt_id         uuid        NOT NULL,
    name          text        NOT NULL,
    donation_code text        NOT NULL,
    description   text,
    target_amount bigint,
    starts_at     date        NOT NULL DEFAULT CURRENT_DATE,
    ends_at       date,
    status        text        NOT NULL DEFAULT 'DRAFT',
    cancelled_note text,
    created_by    uuid,
    updated_by    uuid,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    deleted_by    uuid,

    CONSTRAINT income_donations_pkey
        PRIMARY KEY (id),
    CONSTRAINT income_donations_rt_fk
        FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE,
    CONSTRAINT income_donations_code_rt_unique
        UNIQUE (rt_id, donation_code),
    CONSTRAINT income_donations_status_check
        CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
);

-- ─── Alter rt ────────────────────────────────────────────────────────────────

ALTER TABLE rt
    ADD COLUMN IF NOT EXISTS maker_checker_enabled boolean NOT NULL DEFAULT TRUE;

-- ─── Alter income_transactions ────────────────────────────────────────────────

ALTER TABLE income_transactions
    ADD COLUMN IF NOT EXISTS donation_id           uuid,
    ADD COLUMN IF NOT EXISTS contribution_code     text,
    ADD COLUMN IF NOT EXISTS in_kind_description   text,
    ADD COLUMN IF NOT EXISTS in_kind_quantity      numeric,
    ADD COLUMN IF NOT EXISTS in_kind_unit          text;

ALTER TABLE income_transactions
    DROP CONSTRAINT IF EXISTS income_transactions_donation_fk;
ALTER TABLE income_transactions
    ADD CONSTRAINT income_transactions_donation_fk
        FOREIGN KEY (donation_id) REFERENCES income_donations(id) ON DELETE RESTRICT;

-- NOTE: donation_code is NOT unique per-transaction — all donors of the same
-- donation share the same code (= donation_code). Only donation_id index is needed.
DROP INDEX IF EXISTS idx_income_contribution_code_rt;

CREATE INDEX IF NOT EXISTS idx_income_donation_id
    ON income_transactions (donation_id);

-- ─── RLS on income_donations ─────────────────────────────────────────────────

ALTER TABLE income_donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donation: view"   ON income_donations;
DROP POLICY IF EXISTS "donation: create" ON income_donations;
DROP POLICY IF EXISTS "donation: update" ON income_donations;
DROP POLICY IF EXISTS "donation: delete" ON income_donations;

CREATE POLICY "donation: view"
    ON income_donations FOR SELECT TO authenticated
    USING (
        rt_id IN (SELECT rt_id FROM memberships WHERE user_id = auth.uid())
        AND deleted_at IS NULL
    );

CREATE POLICY "donation: create"
    ON income_donations FOR INSERT TO authenticated
    WITH CHECK (has_permission(rt_id, 'income.donation.create'));

CREATE POLICY "donation: update"
    ON income_donations FOR UPDATE TO authenticated
    USING     (has_permission(rt_id, 'income.donation.update') AND deleted_at IS NULL)
    WITH CHECK (has_permission(rt_id, 'income.donation.update'));

CREATE POLICY "donation: delete"
    ON income_donations FOR DELETE TO authenticated
    USING (has_permission(rt_id, 'income.donation.delete'));

-- ─── Permission seeds ─────────────────────────────────────────────────────────

INSERT INTO permissions (code, name, description, is_system)
VALUES
    ('income.donation.create',   'Create Donation',   'Create a new donation (DRAFT)',                   true),
    ('income.donation.update',   'Update Donation',   'Edit donation metadata (name, dates, target)',    true),
    ('income.donation.delete',   'Delete Donation',   'Delete a draft or cancelled donation',            true),
    ('income.donation.activate', 'Activate Donation', 'Activate or cancel/reject a donation (RT Chair)', true)
ON CONFLICT (code) DO NOTHING;

-- RT_ADMIN + TREASURER: create and update donation metadata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('RT_ADMIN', 'TREASURER')
  AND p.code IN ('income.donation.create', 'income.donation.update')
ON CONFLICT DO NOTHING;

-- RT_ADMIN only: delete donation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_ADMIN'
  AND p.code = 'income.donation.delete'
ON CONFLICT DO NOTHING;

-- RT_CHAIR only: activate or reject/cancel donation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_CHAIR'
  AND p.code = 'income.donation.activate'
ON CONFLICT DO NOTHING;

-- TREASURER: approve and reject income transactions
-- Maker-checker: server enforces created_by != approver_id so self-approval is blocked.
INSERT INTO role_permissions (role_id, permission_id, allow)
SELECT r.id, p.id, true
FROM   roles r
CROSS  JOIN permissions p
WHERE  r.code = 'TREASURER'
  AND  p.code IN ('income.approve', 'income.reject')
ON CONFLICT (role_id, permission_id) DO NOTHING;
