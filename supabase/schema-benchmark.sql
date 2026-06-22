
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
