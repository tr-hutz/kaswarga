-- Sprint 5.9 — Income Campaign & Donation Tracking
-- Must be first: enum additions cannot be inside a transaction with table DDL in some PG versions,
-- but PG 12+ allows transactional enum additions. Listed first so it's defined before any column uses it.
ALTER TYPE income_category ADD VALUE IF NOT EXISTS 'IN_KIND';

-- ─── income_campaigns ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS income_campaigns (
    id            uuid        NOT NULL DEFAULT gen_random_uuid(),
    rt_id         uuid        NOT NULL,
    name          text        NOT NULL,
    campaign_code text        NOT NULL,
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

    CONSTRAINT income_campaigns_pkey
        PRIMARY KEY (id),
    CONSTRAINT income_campaigns_rt_fk
        FOREIGN KEY (rt_id) REFERENCES rt(id) ON DELETE CASCADE,
    CONSTRAINT income_campaigns_code_rt_unique
        UNIQUE (rt_id, campaign_code),
    CONSTRAINT income_campaigns_status_check
        CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
);

-- ─── Alter rt ────────────────────────────────────────────────────────────────

ALTER TABLE rt
    ADD COLUMN IF NOT EXISTS maker_checker_enabled boolean NOT NULL DEFAULT TRUE;

-- ─── Alter income_transactions ────────────────────────────────────────────────

ALTER TABLE income_transactions
    ADD COLUMN IF NOT EXISTS campaign_id           uuid,
    ADD COLUMN IF NOT EXISTS contribution_code     text,
    ADD COLUMN IF NOT EXISTS in_kind_description   text,
    ADD COLUMN IF NOT EXISTS in_kind_quantity      numeric,
    ADD COLUMN IF NOT EXISTS in_kind_unit          text;

ALTER TABLE income_transactions
    DROP CONSTRAINT IF EXISTS income_transactions_campaign_fk;
ALTER TABLE income_transactions
    ADD CONSTRAINT income_transactions_campaign_fk
        FOREIGN KEY (campaign_id) REFERENCES income_campaigns(id) ON DELETE RESTRICT;

-- NOTE: contribution_code is NOT unique per-transaction — all donors of the same
-- campaign share the same code (= campaign_code). Only campaign_id index is needed.
DROP INDEX IF EXISTS idx_income_contribution_code_rt;

CREATE INDEX IF NOT EXISTS idx_income_campaign_id
    ON income_transactions (campaign_id);

-- ─── RLS on income_campaigns ─────────────────────────────────────────────────

ALTER TABLE income_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign: view"   ON income_campaigns;
DROP POLICY IF EXISTS "campaign: create" ON income_campaigns;
DROP POLICY IF EXISTS "campaign: update" ON income_campaigns;
DROP POLICY IF EXISTS "campaign: delete" ON income_campaigns;

CREATE POLICY "campaign: view"
    ON income_campaigns FOR SELECT TO authenticated
    USING (
        rt_id IN (SELECT rt_id FROM memberships WHERE user_id = auth.uid())
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

-- ─── Permission seeds ─────────────────────────────────────────────────────────

INSERT INTO permissions (code, name, description, is_system)
VALUES
    ('income.campaign.create',   'Create Campaign',   'Create a new donation campaign (DRAFT)',           true),
    ('income.campaign.update',   'Update Campaign',   'Edit campaign metadata (name, dates, target)',     true),
    ('income.campaign.delete',   'Delete Campaign',   'Delete a draft or cancelled campaign',             true),
    ('income.campaign.activate', 'Activate Campaign', 'Activate or cancel/reject a campaign (RT Chair)',  true)
ON CONFLICT (code) DO NOTHING;

-- RT_ADMIN + TREASURER: create and update campaign metadata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('RT_ADMIN', 'TREASURER')
  AND p.code IN ('income.campaign.create', 'income.campaign.update')
ON CONFLICT DO NOTHING;

-- RT_ADMIN only: delete campaign
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_ADMIN'
  AND p.code = 'income.campaign.delete'
ON CONFLICT DO NOTHING;

-- RT_CHAIR only: activate or reject/cancel campaign
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RT_CHAIR'
  AND p.code = 'income.campaign.activate'
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
