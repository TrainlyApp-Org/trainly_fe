-- Trainly Premium / Stripe migration
-- Run this file once from the Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.billing_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  cancel_at_period_end boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.billing_subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

drop policy if exists "Users can read their own billing subscription"
  on public.billing_subscriptions;

create policy "Users can read their own billing subscription"
  on public.billing_subscriptions
  for select
  to authenticated
  using (profile_id = auth.uid());

-- No client-side write policies are intentionally defined. Checkout and
-- webhook updates must pass through the backend using its database role.
