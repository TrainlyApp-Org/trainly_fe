-- Trainly Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_premium boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration for profiles created before premium subscriptions were introduced.
alter table public.profiles
  add column if not exists is_premium boolean default false not null;

-- Migration for profiles created before account creation dates were introduced.
alter table public.profiles
  add column if not exists created_at timestamp with time zone;

update public.profiles as profile
set created_at = coalesce(auth_user.created_at, timezone('utc'::text, now()))
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.created_at is null;

update public.profiles
set created_at = timezone('utc'::text, now())
where created_at is null;

alter table public.profiles
  alter column created_at set default timezone('utc'::text, now()),
  alter column created_at set not null;

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Premium status is server-managed and cannot be changed by an authenticated user.
create or replace function public.prevent_self_premium_change()
returns trigger as $$
begin
  if auth.uid() is not null and new.is_premium is distinct from old.is_premium then
    raise exception 'Premium status can only be changed by the server';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists prevent_self_premium_change on public.profiles;
create trigger prevent_self_premium_change
  before update on public.profiles
  for each row execute procedure public.prevent_self_premium_change();

-- Stripe billing state. These tables are written only by the backend after
-- creating a Checkout session or validating a signed Stripe webhook.
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

create policy "Users can read their own billing subscription"
  on public.billing_subscriptions
  for select
  to authenticated
  using (profile_id = auth.uid());

-- 2. Categories Table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  name_it text,
  description text,
  icon text
);

-- RLS for Categories
alter table public.categories enable row level security;

create policy "Categories are viewable by authenticated users" 
  on public.categories for select 
  to authenticated
  using (true);

-- 3. Exercises Table
create table if not exists public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_it text,
  category_id uuid references public.categories(id) on delete cascade not null,
  description text,
  description_it text,
  is_custom boolean default false not null,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Exercises
alter table public.exercises enable row level security;

create policy "Exercises viewable by authenticated users (default or custom created by user)" 
  on public.exercises for select 
  to authenticated
  using (is_custom = false or created_by = auth.uid());

create policy "Users can insert custom exercises" 
  on public.exercises for insert 
  to authenticated
  with check (is_custom = true and created_by = auth.uid());

-- 4. Workout Plans Table
create table if not exists public.workout_plans (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  days jsonb not null default '[]'::jsonb,
  share_id uuid unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration for databases created before multi-day routines were introduced.
alter table public.workout_plans add column if not exists days jsonb not null default '[]'::jsonb;
alter table public.workout_plans add column if not exists share_id uuid unique;

-- RLS for Workout Plans
alter table public.workout_plans enable row level security;

create policy "Users can CRUD their own workout plans" 
  on public.workout_plans 
  for all 
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 5. Workout Plan Exercises Table
create table if not exists public.workout_plan_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_plan_id uuid references public.workout_plans(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sets integer default 3 not null,
  reps text default '10' not null,
  rest_time integer default 60 not null, -- in seconds
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Workout Plan Exercises
alter table public.workout_plan_exercises enable row level security;

create policy "Users can CRUD workout plan exercises belonging to their plans" 
  on public.workout_plan_exercises 
  for all 
  to authenticated
  using (
    exists (
      select 1 from public.workout_plans 
      where id = workout_plan_exercises.workout_plan_id 
      and profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans 
      where id = workout_plan_exercises.workout_plan_id 
      and profile_id = auth.uid()
    )
  );

-- 6. Workout Logs Table
create table if not exists public.workout_logs (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  workout_day_id text,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.workout_logs add column if not exists workout_day_id text;

-- RLS for Workout Logs
alter table public.workout_logs enable row level security;

create policy "Users can CRUD their own workout logs" 
  on public.workout_logs 
  for all 
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 7. Workout Log Details Table
create table if not exists public.workout_log_details (
  id uuid default uuid_generate_v4() primary key,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_index integer not null,
  reps integer not null,
  weight numeric default 0 not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Workout Log Details
alter table public.workout_log_details enable row level security;

create policy "Users can CRUD workout log details belonging to their logs" 
  on public.workout_log_details 
  for all 
  to authenticated
  using (
    exists (
      select 1 from public.workout_logs 
      where id = workout_log_details.workout_log_id 
      and profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_logs 
      where id = workout_log_details.workout_log_id 
      and profile_id = auth.uid()
    )
  );

-- Prevent duplicate writes for the same set in an active workout log.
create unique index if not exists workout_log_details_unique_set
  on public.workout_log_details (workout_log_id, exercise_id, set_index);

-- Values entered from a public shared workout link. These are intentionally
-- separate from authenticated workout logs and are not part of workout history.
create table if not exists public.shared_workout_sets (
  id uuid default uuid_generate_v4() primary key,
  share_id uuid not null,
  workout_day_id uuid not null,
  exercise_id uuid not null,
  set_index integer not null check (set_index >= 0),
  weight numeric not null default 0 check (weight >= 0),
  reps integer not null check (reps >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (share_id, workout_day_id, exercise_id, set_index)
);

alter table public.shared_workout_sets enable row level security;

-- Latest weight and reps selected by an authenticated user for each set.
-- This is intentionally separate from workout history and stores no session,
-- completion status or timestamps.
create table if not exists public.workout_set_values (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  workout_plan_id uuid references public.workout_plans(id) on delete cascade not null,
  workout_day_id uuid not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  set_index integer not null check (set_index >= 0),
  weight numeric not null default 0 check (weight >= 0),
  reps integer not null check (reps >= 0),
  unique (profile_id, workout_plan_id, workout_day_id, exercise_id, set_index)
);

alter table public.workout_set_values enable row level security;

create policy "Users can read their workout set values"
  on public.workout_set_values
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert their workout set values"
  on public.workout_set_values
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Users can update their workout set values"
  on public.workout_set_values
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());


-- Seed Data (Predefined Categories and Exercises)
-- Note: Run these seeds only if the tables are empty

-- Inserts Categories
insert into public.categories (id, name, description, icon) values
  ('d1a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Chest', 'Pectoral muscles exercises', 'Flame'),
  ('d2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Back', 'Dorsal and back muscles exercises', 'Zap'),
  ('d3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Legs', 'Quadriceps, hamstrings, and calves exercises', 'Activity'),
  ('d4a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Shoulders', 'Deltoids and trapezius exercises', 'Award'),
  ('d5a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Arms', 'Biceps and triceps exercises', 'Dumbbell'),
  ('d6a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Core', 'Abdominals and lower back exercises', 'Target')
on conflict (name) do nothing;

-- Inserts Chest Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Panca Piana (Bench Press)', 'd1a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Barbell bench press for overall chest development.', false),
  ('Spinte Panca Inclinata (Incline Dumbbell Press)', 'd1a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Incline dumbbell bench press targeting the upper chest.', false),
  ('Croci ai Cavi (Cable Flyes)', 'd1a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Cable flyes for isolation and inner chest squeeze.', false),
  ('Flessioni (Push-ups)', 'd1a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Classic bodyweight push-ups.', false)
on conflict do nothing;

-- Inserts Back Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Trazioni (Pull-ups)', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Bodyweight pull-ups for lat width.', false),
  ('Lat Machine (Lat Pulldown)', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Lat machine pulldown targeting lats and upper back.', false),
  ('Rematore Bilanciere (Barbell Row)', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Bent over barbell row for back thickness.', false),
  ('Pulley (Seated Cable Row)', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Seated cable rows targeting center back.', false)
on conflict do nothing;

-- Inserts Legs Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Squat con Bilanciere (Barbell Squat)', 'd3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Classic barbell squat for leg power and quad development.', false),
  ('Leg Press', 'd3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Seated leg press machine.', false),
  ('Stacco Rumeno (Romanian Deadlift)', 'd3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Deadlift focusing on hamstrings and glutes.', false),
  ('Leg Extension', 'd3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Isolation exercise targeting quadriceps.', false),
  ('Leg Curl', 'd3a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Isolation exercise targeting hamstrings.', false)
on conflict do nothing;

-- Inserts Shoulders Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Military Press (Overhead Press)', 'd4a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Barbell overhead press for shoulder strength and size.', false),
  ('Alzate Laterali (Lateral Raises)', 'd4a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Dumbbell lateral raises for lateral deltoid isolation.', false),
  ('Spinte con Manubri (Dumbbell Shoulder Press)', 'd4a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Seated dumbbell press.', false),
  ('Alzate Posteriori (Rear Delt Flyes)', 'd4a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Rear deltoid exercises using dumbbells or cables.', false)
on conflict do nothing;

-- Inserts Arms Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Curl con Manubri (Dumbbell Bicep Curl)', 'd5a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Classic bicep curls with dumbbells.', false),
  ('Pushdown Tricipiti (Cable Triceps Pushdown)', 'd5a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Cable attachment pushdowns targeting triceps.', false),
  ('Curl con Bilanciere Sagomato (EZ-Bar Bicep Curl)', 'd5a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Bicep curls using an EZ bar.', false),
  ('Dips alle Parallele (Triceps Dips)', 'd5a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Bodyweight parallel bar dips for triceps and chest.', false)
on conflict do nothing;

-- Inserts Core Exercises
insert into public.exercises (name, category_id, description, is_custom) values
  ('Plank', 'd6a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Core stability plank.', false),
  ('Crunch Addominali (Crunches)', 'd6a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Abdominal crunches.', false),
  ('Alzate Gambe da Appeso (Hanging Leg Raise)', 'd6a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Hanging bar raises targeting lower abs.', false),
  ('Russian Twist', 'd6a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Rotational core exercise.', false)
on conflict do nothing;


-- Trigger to automatically create a profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', substring(new.email from '([^@]+)')),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
