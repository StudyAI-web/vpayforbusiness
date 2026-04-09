create table public.ecards (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  card_number text not null,
  card_cvv text not null,
  card_expiry text not null,
  amount integer not null,
  balance integer not null,
  stripe_session_id text unique,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

alter table public.ecards enable row level security;

create policy "Public can view ecards by session"
  on public.ecards for select
  using (true);
