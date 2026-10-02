-- Jalankan di Supabase: SQL Editor → New query → Run

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type        text not null check (type in ('income','expense')),
  amount      numeric(14,0) not null check (amount > 0),
  category    text not null,
  note        text,
  occurred_on date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

-- Row Level Security: setiap pengguna hanya bisa mengakses datanya sendiri
alter table public.transactions enable row level security;

drop policy if exists "select own" on public.transactions;
drop policy if exists "insert own" on public.transactions;
drop policy if exists "update own" on public.transactions;
drop policy if exists "delete own" on public.transactions;

create policy "select own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "insert own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "update own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "delete own" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);
