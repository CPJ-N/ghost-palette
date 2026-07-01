-- Ghost Palette — Supabase schema. Run in the Supabase SQL editor.
-- All rows are scoped by Clerk user_id; the app accesses Supabase with the
-- service-role key server-side and always filters by the session user_id.
-- RLS is enabled on profiles + credit_transactions for defense-in-depth (see
-- the "Row Level Security" section at the end of this file).

-- Per-user profile, credit balance, Stripe linkage.
create table if not exists profiles (
  user_id                text primary key,             -- Clerk user id
  email                  text,
  email_verified         boolean not null default false,
  first_name             text,                         -- synced from Clerk
  last_name              text,
  username               text,
  image_url              text,                         -- Clerk avatar
  credit_balance         integer not null default 0,
  monthly_credits        integer not null default 50,  -- reset target per period (free=50, paid=pack credits)
  plan                   text not null default 'free', -- free | basic | pro | enterprise
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_start   timestamptz,                  -- Stripe billing period start
  current_period_end     timestamptz,                  -- Stripe renewal date
  next_refresh_at        timestamptz default (now() + interval '1 month'), -- monthly credit-reset anchor (cron)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Append-only credit ledger — the source of truth for balance changes.
create table if not exists credit_transactions (
  id            bigint generated always as identity primary key,
  user_id       text not null references profiles(user_id) on delete cascade,
  amount        integer not null,                  -- + grant/purchase, - spend
  reason        text not null,                     -- signup | subscription | refresh | generation | generation_refund | benchmark | benchmark_refund | adjustment
  ref           text,                              -- stripe id / run id / etc.
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index if not exists credit_tx_user_idx on credit_transactions (user_id, created_at desc);
create unique index if not exists credit_tx_starter_unique_idx
  on credit_transactions (user_id)
  where reason = 'signup' and ref = 'starter';
-- Idempotency for Stripe subscription grants: a given (reason, ref) — initial
-- subscription id or renewal invoice id — can be granted at most once, so a
-- re-delivered webhook event cannot double-grant credits.
create unique index if not exists credit_tx_subscription_ref_unique_idx
  on credit_transactions (reason, ref)
  where reason = 'subscription' and ref is not null;
-- Idempotency for the monthly cron refresh: one 'refresh' row per user per period.
create unique index if not exists credit_tx_refresh_unique_idx
  on credit_transactions (user_id, ref)
  where reason = 'refresh' and ref is not null;

-- Atomic credit mutation used by the server-side service-role client.
-- Public/anon clients must not execute this; all credit changes go through API routes.
create or replace function adjust_credits(
  p_user_id text,
  p_amount integer,
  p_reason text,
  p_ref text default null
) returns integer
language plpgsql
as $$
declare
  v_balance integer;
begin
  if p_amount = 0 then
    raise exception 'amount_must_not_be_zero' using errcode = 'P0001';
  end if;

  update profiles
     set credit_balance = credit_balance + p_amount,
         updated_at = now()
   where user_id = p_user_id
     and (p_amount > 0 or credit_balance + p_amount >= 0)
   returning credit_balance into v_balance;

  if v_balance is null then
    if exists (select 1 from profiles where user_id = p_user_id) then
      raise exception 'insufficient_credits' using errcode = 'P0001';
    end if;

    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  insert into credit_transactions (user_id, amount, reason, ref, balance_after)
  values (p_user_id, p_amount, p_reason, p_ref, v_balance);

  return v_balance;
end;
$$;

revoke all on function adjust_credits(text, integer, text, text) from public;
grant execute on function adjust_credits(text, integer, text, text) to service_role;

-- Idempotent reset: SET the balance to a target, log the delta, optionally advance
-- the monthly refresh anchor. A duplicate (reason, ref) INSERT raises 23505 and
-- rolls back the whole function, so a re-delivered webhook never re-resets.
create or replace function set_credits(
  p_user_id text,
  p_target integer,
  p_reason text,
  p_ref text default null,
  p_advance_refresh boolean default false
) returns integer
language plpgsql
as $$
declare
  v_old integer;
begin
  if p_target < 0 then
    raise exception 'target_must_not_be_negative' using errcode = 'P0001';
  end if;

  select credit_balance into v_old from profiles where user_id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  update profiles
     set credit_balance = p_target,
         next_refresh_at = case
           when p_advance_refresh then now() + interval '1 month'
           else next_refresh_at
         end,
         updated_at = now()
   where user_id = p_user_id;

  insert into credit_transactions (user_id, amount, reason, ref, balance_after)
  values (p_user_id, p_target - v_old, p_reason, p_ref, p_target);

  return p_target;
end;
$$;

revoke all on function set_credits(text, integer, text, text, boolean) from public;
grant execute on function set_credits(text, integer, text, text, boolean) to service_role;

-- Monthly reset engine for the Vercel cron: reset every due profile's balance to
-- its monthly_credits, advance next_refresh_at by a month, and log a 'refresh' row.
-- Idempotent via the next_refresh_at gate + the per-period unique index.
create or replace function refresh_due_credits() returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  with due as (
    select user_id, monthly_credits, credit_balance as old_balance
    from profiles
    where next_refresh_at is not null and next_refresh_at <= now()
    for update skip locked
  ),
  upd as (
    update profiles p
       set credit_balance = d.monthly_credits,
           next_refresh_at = now() + interval '1 month',
           updated_at = now()
      from due d
     where p.user_id = d.user_id
    returning p.user_id
  ),
  logged as (
    insert into credit_transactions (user_id, amount, reason, ref, balance_after)
    select d.user_id, d.monthly_credits - d.old_balance, 'refresh',
           to_char(now(), 'YYYY-MM'), d.monthly_credits
    from due d
    on conflict do nothing
    returning 1
  )
  select count(*) into v_count from upd;
  return v_count;
end;
$$;

revoke all on function refresh_due_credits() from public;
grant execute on function refresh_due_credits() to service_role;

-- Fixed-window rate limiter for cost-sensitive routes (generation, benchmark).
-- Built on Postgres rather than an external service (Redis/Upstash) since the
-- app already has a database connection on every request; one row per
-- (user_id, bucket, window_start) — a request increments the current window's
-- counter and the caller checks it against a per-route max.
create table if not exists rate_limits (
  user_id      text not null references profiles(user_id) on delete cascade,
  bucket       text not null,                       -- e.g. "generate", "benchmark"
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (user_id, bucket, window_start)
);
create index if not exists rate_limits_window_idx on rate_limits (window_start);

-- Atomically increments the counter for the current fixed window and returns
-- whether the request is still within the allowed limit. Windows align to
-- p_window_seconds boundaries (e.g. every 60s) rather than a sliding log, so
-- it's one upsert per call — cheap enough to run on every request.
create or replace function check_rate_limit(
  p_user_id text,
  p_bucket text,
  p_window_seconds integer,
  p_max_requests integer
) returns boolean
language plpgsql
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into rate_limits (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
    do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function check_rate_limit(text, text, integer, integer) from public;
grant execute on function check_rate_limit(text, text, integer, integer) to service_role;

-- Bounds table growth. Called from the existing daily cron alongside the
-- monthly credit refresh — no new schedule needed. A day of headroom is far
-- more than any window_seconds this app uses, so nothing due is ever deleted.
create or replace function cleanup_rate_limits() returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  delete from rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function cleanup_rate_limits() from public;
grant execute on function cleanup_rate_limits() to service_role;

-- A generation batch (composer / arena / eval).
create table if not exists runs (
  id         text primary key,
  user_id    text not null references profiles(user_id) on delete cascade,
  mode       text not null,                        -- composer | arena | eval
  prompt     text not null,
  model_ids  jsonb not null,
  seeds      jsonb,
  winner_id  text,                                 -- result id picked as winner (arena / eval)
  created_at timestamptz not null default now()
);
create index if not exists runs_user_idx on runs (user_id, created_at desc);
-- Existing deployments: add the winner column if the table predates it.
alter table runs add column if not exists winner_id text;

-- One generated image.
create table if not exists results (
  id           text primary key,
  run_id       text not null references runs(id) on delete cascade,
  user_id      text not null references profiles(user_id) on delete cascade,
  model_id     text not null,
  prompt       text not null,
  seed         integer,
  status       text not null default 'complete',   -- queued | generating | complete | error
  storage_path text,                               -- path in the Storage 'artifacts' bucket
  width        integer,
  height       integer,
  favorite     boolean not null default false,
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists results_run_idx on results (run_id);
create index if not exists results_fav_idx on results (user_id, favorite);

-- An Evals session.
create table if not exists evals (
  id                  text primary key,
  user_id             text not null references profiles(user_id) on delete cascade,
  run_id              text references runs(id) on delete set null,
  prompt              text not null,
  reference_kind      text not null,               -- upload | result
  reference_path      text not null,               -- Storage path
  reference_result_id text,
  scorer              text not null default 'vision-llm',
  created_at          timestamptz not null default now()
);

-- Per-candidate similarity score.
create table if not exists eval_scores (
  id        bigint generated always as identity primary key,
  eval_id   text not null references evals(id) on delete cascade,
  result_id text not null references results(id) on delete cascade,
  user_id   text not null references profiles(user_id) on delete cascade,
  score     real not null,                         -- 0..1
  raw       jsonb,
  rank      integer,
  created_at timestamptz not null default now()
);
create index if not exists eval_scores_idx on eval_scores (eval_id, score desc);

-- Storage: a public bucket named "artifacts" holds generated + reference images
-- (created via the service-role client; image/* only, 15 MB limit).

-- ImageBench V1 suite runs and grades (public leaderboard source).
-- Prompts from https://github.com/dh7/image-bench-ai (imagebench-v1/challenges.csv).

create table if not exists benchmark_suite_runs (
  id               text primary key,
  user_id          text not null references profiles(user_id) on delete cascade,
  model_id         text not null,
  suite_version    text not null default 'imagebench-v1',
  status           text not null default 'running',  -- running | complete | error
  pass_count       integer not null default 0,
  fail_count       integer not null default 0,
  total_challenges integer not null,
  category_filter  text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index if not exists benchmark_suite_runs_model_idx
  on benchmark_suite_runs (model_id, created_at desc);

create table if not exists benchmark_challenge_results (
  id            text primary key,
  suite_run_id  text not null references benchmark_suite_runs(id) on delete cascade,
  user_id       text not null references profiles(user_id) on delete cascade,
  challenge_id  text not null,
  model_id      text not null,
  category      text not null,
  image_url     text,
  passed        boolean,
  vlm_output    text,
  latency_ms    integer,
  created_at    timestamptz not null default now()
);
create index if not exists benchmark_results_model_idx
  on benchmark_challenge_results (model_id, passed);
create index if not exists benchmark_results_suite_idx
  on benchmark_challenge_results (suite_run_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (defense-in-depth)
--
-- The server accesses Supabase with the service-role key, which BYPASSES RLS, so
-- enabling RLS here does NOT change app behavior. The point is to fail closed for
-- the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY): with RLS on and no policy
-- matching the anon role, the public key can read nothing from these tables.
--
-- user_id holds the Clerk user id, which equals the JWT `sub` claim, so the
-- own-row predicate is `user_id = auth.jwt()->>'sub'` (NOT auth.uid(), which is a
-- Supabase-Auth UUID). These SELECT policies scope reads to the caller's own rows
-- should a Clerk JWT ever be passed from the client.
--
-- Writes are intentionally NOT granted to end users: every profile/credit
-- mutation goes through service-role server routes (and the adjust_credits /
-- set_credits functions). Granting a user self-UPDATE on credit_balance/plan or
-- self-INSERT into the append-only ledger would be a privilege-escalation hole.
--
-- Idempotent: enable-RLS is a no-op if already on; policies are guarded by
-- `drop policy if exists` before each `create policy`.

alter table profiles enable row level security;
alter table credit_transactions enable row level security;

-- profiles: a user may read only their own profile row.
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select to authenticated
  using (user_id = auth.jwt()->>'sub');

-- credit_transactions: a user may read only their own ledger rows.
drop policy if exists credit_tx_select_own on credit_transactions;
create policy credit_tx_select_own on credit_transactions
  for select to authenticated
  using (user_id = auth.jwt()->>'sub');
