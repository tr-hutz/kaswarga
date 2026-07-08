/*
 * =============================================================================
 * 002_COMMUNICATION
 * Notification and activity log tables.
 * Depends on: 000_foundation (rt)
 * =============================================================================
 */


/* ----------------------------------------------------------------------------
 * TABLE: notifications
 * In-app notifications targeted at a specific user or role within an RT.
 * --------------------------------------------------------------------------- */

create table notifications (
    id             uuid        primary key default gen_random_uuid(),
    rt_id          uuid        not null references rt (id) on delete cascade,
    type           varchar(50) not null,
    title          text        not null,
    message        text,
    entity_type    varchar(50),
    entity_id      uuid,
    target_role    varchar(50),
    target_user_id uuid,
    is_read        boolean     not null default false,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz,
    updated_by     uuid        references users (id),
    deleted_at     timestamptz,
    deleted_by     uuid        references users (id)
);


/* ----------------------------------------------------------------------------
 * TABLE: activity_logs
 * Audit trail of all significant actions performed within an RT.
 * --------------------------------------------------------------------------- */

create table activity_logs (
    id          uuid         primary key default gen_random_uuid(),
    rt_id       uuid         not null references rt (id) on delete cascade,
    actor_id    uuid,
    actor_name  text,
    action      varchar(100) not null,
    entity_type varchar(50)  not null,
    entity_id   uuid,
    description text,
    visibility  varchar(50)  not null default 'internal',
    metadata    jsonb,
    created_at  timestamptz  not null default now()
);
