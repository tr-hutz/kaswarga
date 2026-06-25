/*
|--------------------------------------------------------------------------
| ADD NEW ROLES TO ENUM
|--------------------------------------------------------------------------
*/

alter type user_role add value if not exists 'super_admin';
alter type user_role add value if not exists 'ketua';

/*
|--------------------------------------------------------------------------
| SYSTEM RT (virtual RT for super_admin, undeleteable)
|--------------------------------------------------------------------------
*/

insert into rt (id, nama, kode, nominal_iuran, aktif)
values (
    '00000000-0000-0000-0000-000000000001',
    'System',
    'SYS',
    0,
    true
)
on conflict (id) do nothing;

/*
|--------------------------------------------------------------------------
| MAKE rt_id NULLABLE IN user_membership
| super_admin operates at system level, not bound to a specific RT
|--------------------------------------------------------------------------
*/

alter table user_membership
    alter column rt_id drop not null;

/*
|--------------------------------------------------------------------------
| PREVENT DELETION OF SYSTEM RT
|--------------------------------------------------------------------------
*/

create or replace function prevent_system_rt_delete()
returns trigger
language plpgsql
as $$
begin
    if old.id = '00000000-0000-0000-0000-000000000001' then
        raise exception 'System RT cannot be deleted'
            using errcode = 'KW010';
    end if;
    return old;
end;
$$;

create trigger trg_prevent_system_rt_delete
    before delete on rt
    for each row
    execute function prevent_system_rt_delete();
