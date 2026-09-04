-- Sprint 6 — Rename income_campaigns to income_donations

-- 1. Rename the table
ALTER TABLE income_campaigns RENAME TO income_donations;

-- 2. Rename campaign_code column on income_donations
ALTER TABLE income_donations RENAME COLUMN campaign_code TO donation_code;

-- 3. Rename campaign_id column on income_transactions
ALTER TABLE income_transactions RENAME COLUMN campaign_id TO donation_id;

-- 4. Rename the index
ALTER INDEX IF EXISTS idx_income_campaign_id RENAME TO idx_income_donation_id;

-- 5. Rename RLS policies on income_donations (formerly income_campaigns)
ALTER POLICY "campaign: view"   ON income_donations RENAME TO "donation: view";
ALTER POLICY "campaign: create" ON income_donations RENAME TO "donation: create";
ALTER POLICY "campaign: update" ON income_donations RENAME TO "donation: update";
ALTER POLICY "campaign: delete" ON income_donations RENAME TO "donation: delete";

-- 6. Update permission codes
UPDATE permissions
SET code = REPLACE(code, 'income.campaign.', 'income.donation.')
WHERE code LIKE 'income.campaign.%';
