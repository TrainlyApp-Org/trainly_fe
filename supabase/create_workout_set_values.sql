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

drop policy if exists "Users can read their workout set values" on public.workout_set_values;
create policy "Users can read their workout set values"
  on public.workout_set_values
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "Users can insert their workout set values" on public.workout_set_values;
create policy "Users can insert their workout set values"
  on public.workout_set_values
  for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "Users can update their workout set values" on public.workout_set_values;
create policy "Users can update their workout set values"
  on public.workout_set_values
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
