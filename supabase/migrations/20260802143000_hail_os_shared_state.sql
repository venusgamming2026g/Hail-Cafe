create table if not exists public.hail_os_state (
  scope text primary key,
  revision bigint not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system',
  last_action text not null default 'bootstrap'
);

create table if not exists public.hail_os_state_audit (
  id bigint generated always as identity primary key,
  scope text not null,
  revision bigint not null,
  client_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.hail_os_state enable row level security;
alter table public.hail_os_state_audit enable row level security;

revoke all on public.hail_os_state from anon, authenticated;
revoke all on public.hail_os_state_audit from anon, authenticated;

create or replace function public.hail_os_state_get(p_scope text default 'hail-cafe-main')
returns table(revision bigint, payload jsonb, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_scope <> 'hail-cafe-main' then
    return;
  end if;

  return query
    select s.revision, s.payload, s.updated_at
    from public.hail_os_state as s
    where s.scope = p_scope;
end;
$$;

create or replace function public.hail_os_state_commit(
  p_scope text,
  p_expected_revision bigint,
  p_payload jsonb,
  p_client_id text,
  p_action text
)
returns table(applied boolean, revision bigint, payload jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.hail_os_state%rowtype;
  next_revision bigint;
begin
  if p_scope <> 'hail-cafe-main' then
    raise exception 'invalid scope';
  end if;
  if jsonb_typeof(p_payload) <> 'object'
     or not (p_payload ? 'settings')
     or not (p_payload ? 'orders')
     or not (p_payload ? 'sessions')
     or pg_column_size(p_payload) > 5242880 then
    raise exception 'invalid payload';
  end if;

  select * into current_row
  from public.hail_os_state
  where scope = p_scope
  for update;

  if not found then
    if p_expected_revision <> 0 then
      return;
    end if;
    insert into public.hail_os_state(scope, revision, payload, updated_by, last_action)
    values (p_scope, 1, p_payload, left(coalesce(p_client_id, 'unknown'), 120), left(coalesce(p_action, 'bootstrap'), 120))
    returning * into current_row;
    insert into public.hail_os_state_audit(scope, revision, client_id, action)
    values (p_scope, 1, left(coalesce(p_client_id, 'unknown'), 120), left(coalesce(p_action, 'bootstrap'), 120));
    return query select true, current_row.revision, current_row.payload, current_row.updated_at;
    return;
  end if;

  if current_row.revision <> p_expected_revision then
    return query select false, current_row.revision, current_row.payload, current_row.updated_at;
    return;
  end if;

  next_revision := current_row.revision + 1;
  update public.hail_os_state
  set revision = next_revision,
      payload = p_payload,
      updated_at = now(),
      updated_by = left(coalesce(p_client_id, 'unknown'), 120),
      last_action = left(coalesce(p_action, 'sync'), 120)
  where scope = p_scope
  returning * into current_row;

  insert into public.hail_os_state_audit(scope, revision, client_id, action)
  values (p_scope, next_revision, left(coalesce(p_client_id, 'unknown'), 120), left(coalesce(p_action, 'sync'), 120));

  return query select true, current_row.revision, current_row.payload, current_row.updated_at;
end;
$$;

revoke all on function public.hail_os_state_get(text) from public;
revoke all on function public.hail_os_state_commit(text, bigint, jsonb, text, text) from public;
grant execute on function public.hail_os_state_get(text) to anon, authenticated;
grant execute on function public.hail_os_state_commit(text, bigint, jsonb, text, text) to anon, authenticated;
