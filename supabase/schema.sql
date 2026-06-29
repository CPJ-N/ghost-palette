-- Ghost Palette — Supabase schema. Run in the Supabase SQL editor.
-- All rows are scoped by Clerk user_id; the app accesses Supabase with the
-- service-role key server-side and always filters by the session user_id.
-- (Add RLS policies later for defense-in-depth.)

-- Per-user profile, credit balance, Stripe linkage.
create table if not exists profiles (
  user_id            text primary key,             -- Clerk user id
  email              text,
  credit_balance     integer not null default 0,
  plan               text not null default 'free', -- free | basic | pro | enterprise
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Append-only credit ledger — the source of truth for balance changes.
create table if not exists credit_transactions (
  id            bigint generated always as identity primary key,
  user_id       text not null references profiles(user_id) on delete cascade,
  amount        integer not null,                  -- + grant/purchase, - spend
  reason        text not null,                     -- signup | purchase | subscription | generation | refund | adjustment
  ref           text,                              -- stripe id / run id / etc.
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index if not exists credit_tx_user_idx on credit_transactions (user_id, created_at desc);
create unique index if not exists credit_tx_starter_unique_idx
  on credit_transactions (user_id)
  where reason = 'signup' and ref = 'starter';

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

-- A generation batch (composer / arena / eval).
create table if not exists runs (
  id         text primary key,
  user_id    text not null references profiles(user_id) on delete cascade,
  mode       text not null,                        -- composer | arena | eval
  prompt     text not null,
  model_ids  jsonb not null,
  seeds      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists runs_user_idx on runs (user_id, created_at desc);

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
