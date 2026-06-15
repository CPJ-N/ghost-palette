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
  storage_path text,                               -- path in the Storage 'images' bucket
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

-- After running this, create a Storage bucket named "images" (public) in the
-- Supabase dashboard for generated + reference images.
