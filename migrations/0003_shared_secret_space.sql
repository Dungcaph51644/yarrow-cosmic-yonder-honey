create table if not exists shared_secret_spaces (
  id text primary key,
  created_at timestamptz not null default now()
);

insert into shared_secret_spaces (id)
values ('shared')
on conflict (id) do nothing;

create table if not exists shared_secret_invites (
  token_hash text primary key,
  space_id text not null references shared_secret_spaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists shared_secret_devices (
  token_hash text primary key,
  space_id text not null references shared_secret_spaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists shared_secret_photos (
  space_id text not null references shared_secret_spaces (id) on delete cascade,
  id text not null,
  file_name text not null,
  content_type text not null,
  storage_path text not null unique,
  created_at timestamptz not null,
  primary key (space_id, id)
);

create index if not exists shared_secret_photos_space_created_idx
  on shared_secret_photos (space_id, created_at desc);

create table if not exists shared_secret_diary_entries (
  space_id text not null references shared_secret_spaces (id) on delete cascade,
  id text not null,
  body text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (space_id, id)
);

create index if not exists shared_secret_diary_entries_space_updated_idx
  on shared_secret_diary_entries (space_id, updated_at desc);

create table if not exists shared_secret_diary_drafts (
  space_id text primary key references shared_secret_spaces (id) on delete cascade,
  body text not null,
  entry_id text,
  updated_at timestamptz not null default now()
);

alter table shared_secret_spaces enable row level security;
alter table shared_secret_invites enable row level security;
alter table shared_secret_devices enable row level security;
alter table shared_secret_photos enable row level security;
alter table shared_secret_diary_entries enable row level security;
alter table shared_secret_diary_drafts enable row level security;
