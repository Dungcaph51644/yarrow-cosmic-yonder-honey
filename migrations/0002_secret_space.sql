create table if not exists secret_photos (
  id uuid primary key,
  user_id text not null,
  file_name text not null,
  content_type text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists secret_photos_user_created_idx
  on secret_photos (user_id, created_at desc);

create table if not exists secret_diary_entries (
  id uuid primary key,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists secret_diary_entries_user_updated_idx
  on secret_diary_entries (user_id, updated_at desc);

create table if not exists secret_diary_drafts (
  user_id text primary key,
  body text not null,
  entry_id uuid,
  updated_at timestamptz not null default now()
);

alter table secret_photos enable row level security;
alter table secret_diary_entries enable row level security;
alter table secret_diary_drafts enable row level security;
