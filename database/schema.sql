-- ==============================================================================
-- stutosed Database Reference Schema (Supabase PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Automatically synced from auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile."
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- 2. User Watched Lectures & Study Progress Table
create table if not exists public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id text not null,
  lecture_url text not null,
  completed boolean default true not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lecture_url)
);

-- Enable RLS for progress
alter table public.user_progress enable row level security;

create policy "Users can manage their own lecture progress."
  on public.user_progress for all
  using (auth.uid() = user_id);

-- 3. Last Played Lecture Memory Table
create table if not exists public.user_last_played (
  user_id uuid references auth.users on delete cascade primary key,
  course_id text not null,
  course_name text not null,
  course_thumb text,
  lecture_title text not null,
  lecture_url text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for last played
alter table public.user_last_played enable row level security;

create policy "Users can view and update their last played lecture."
  on public.user_last_played for all
  using (auth.uid() = user_id);

-- 4. Automatic User Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', 'Student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
