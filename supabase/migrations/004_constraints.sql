/*
 * =============================================================================
 * 004_CONSTRAINTS
 * Check constraints and indexes across all tables.
 * Depends on: 001_financial, 002_communication
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * PAYMENT CONFIRMATIONS
 * --------------------------------------------------------------------------- */

alter table payment_confirmations
    add constraint payment_confirmations_status_check
        check (status in ('pending', 'processing', 'approved', 'rejected'));

alter table payment_confirmations
    add constraint payment_confirmations_total_amount_check
        check (total_amount > 0);

alter table payment_confirmations
    add constraint payment_confirmations_year_check
        check (year >= 2020 and year <= 2100);


/* ----------------------------------------------------------------------------
 * CONFIRMATION DETAILS
 * --------------------------------------------------------------------------- */

alter table confirmation_details
    add constraint confirmation_details_month_check
        check (month between 1 and 12);

alter table confirmation_details
    add constraint confirmation_details_amount_check
        check (amount > 0);

-- NOTE: no unique constraint on (resident_id, year, month) here intentionally.
-- A resident must be able to resubmit after rejection, so drafts are allowed to
-- repeat a month.  The uniqueness constraint on payment_details (approved
-- payments) still prevents double-approval for the same period.


/* ----------------------------------------------------------------------------
 * PAYMENTS
 * --------------------------------------------------------------------------- */

alter table payments
    add constraint payments_total_amount_check
        check (total_amount > 0);

alter table payments
    add constraint payments_year_check
        check (year >= 2020 and year <= 2100);


/* ----------------------------------------------------------------------------
 * PAYMENT DETAILS
 * --------------------------------------------------------------------------- */

alter table payment_details
    add constraint payment_details_month_check
        check (month between 1 and 12);

alter table payment_details
    add constraint payment_details_amount_check
        check (amount >= 0);

alter table payment_details
    add constraint payment_details_unique
        unique (resident_id, year, month);


/* ----------------------------------------------------------------------------
 * EXPENSES
 * --------------------------------------------------------------------------- */

alter table expenses
    add constraint expenses_amount_check
        check (amount > 0);


/* ----------------------------------------------------------------------------
 * INDEXES — LEDGER
 * --------------------------------------------------------------------------- */

create index idx_ledger_rt          on ledger (rt_id);
create index idx_ledger_date        on ledger (date);
create index idx_ledger_source      on ledger (source);
create index idx_ledger_reference   on ledger (reference_id);


/* ----------------------------------------------------------------------------
 * INDEXES — NOTIFICATIONS
 * --------------------------------------------------------------------------- */

create index idx_notifications_rt           on notifications (rt_id);
create index idx_notifications_target_user  on notifications (target_user_id);
create index idx_notifications_unread       on notifications (is_read);
create index idx_notifications_created_at   on notifications (created_at desc);


/* ----------------------------------------------------------------------------
 * INDEXES — RLS query support
 * Each index prevents a full table scan per row evaluated by the RT-scoped
 * RLS policies defined in 007_rls.sql.
 * --------------------------------------------------------------------------- */

-- memberships: RLS helper functions scan by user_id
create index idx_memberships_user_id
    on memberships (user_id);

-- Core data tables: scanned by rt_id in RLS predicates
create index idx_residents_rt_id
    on residents (rt_id);

create index idx_payment_confirmations_rt_id
    on payment_confirmations (rt_id);

create index idx_payments_rt_id
    on payments (rt_id);

create index idx_expenses_rt_id
    on expenses (rt_id);

create index idx_activity_logs_rt_id
    on activity_logs (rt_id);

-- Detail tables: scanned by parent FK in RLS subquery
create index idx_confirmation_details_confirmation_id
    on confirmation_details (confirmation_id);

create index idx_payment_details_payment_id
    on payment_details (payment_id);


/* ----------------------------------------------------------------------------
 * INDEXES — soft delete
 * --------------------------------------------------------------------------- */

create index idx_users_deleted_at              on users              (deleted_at) where deleted_at is null;
create index idx_residents_deleted_at          on residents          (deleted_at) where deleted_at is null;
create index idx_notifications_deleted_at      on notifications      (deleted_at) where deleted_at is null;
create index idx_expenses_deleted_at           on expenses           (deleted_at) where deleted_at is null;
create index idx_expense_categories_deleted_at on expense_categories (deleted_at) where deleted_at is null;
