-- ================================================================
-- stutosed (courses.stutosed.in) — Supabase PostgreSQL Database Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ================================================================

-- 1. PROFILES TABLE (Sync with Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on Auth Signup (Google OAuth / Email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. USER WATCH HISTORY TABLE (Syncs watched lectures across devices)
create table if not exists public.user_watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  lecture_url text not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lecture_url)
);

create index if not exists idx_watch_history_user on public.user_watch_history(user_id);
create index if not exists idx_watch_history_course on public.user_watch_history(course_id);

alter table public.user_watch_history enable row level security;
drop policy if exists "Users can view own watch history." on public.user_watch_history;
create policy "Users can view own watch history." on public.user_watch_history for select using (auth.uid() = user_id);

drop policy if exists "Users can insert/update own watch history." on public.user_watch_history;
create policy "Users can insert/update own watch history." on public.user_watch_history for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own watch history." on public.user_watch_history;
create policy "Users can update own watch history." on public.user_watch_history for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own watch history." on public.user_watch_history;
create policy "Users can delete own watch history." on public.user_watch_history for delete using (auth.uid() = user_id);

-- 3. USER COURSE MEMORY (LAST PLAYED RESUME)
create table if not exists public.user_course_memory (
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  last_tab_id text default 'videos',
  last_lecture_url text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, course_id)
);

create index if not exists idx_course_memory_user on public.user_course_memory(user_id);

alter table public.user_course_memory enable row level security;
drop policy if exists "Users can view own course memory." on public.user_course_memory;
create policy "Users can view own course memory." on public.user_course_memory for select using (auth.uid() = user_id);

drop policy if exists "Users can insert/update own course memory." on public.user_course_memory;
create policy "Users can insert/update own course memory." on public.user_course_memory for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own course memory." on public.user_course_memory;
create policy "Users can update own course memory." on public.user_course_memory for update using (auth.uid() = user_id);

-- 4. USER VIDEO PLAYBACK PROGRESS (TIMESTAMP SECONDS)
create table if not exists public.user_video_progress (
  user_id uuid references auth.users(id) on delete cascade not null,
  lecture_id text not null,
  seconds float not null default 0,
  duration float,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, lecture_id)
);

create index if not exists idx_video_progress_user on public.user_video_progress(user_id);

alter table public.user_video_progress enable row level security;
drop policy if exists "Users can view own video progress." on public.user_video_progress;
create policy "Users can view own video progress." on public.user_video_progress for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own video progress." on public.user_video_progress;
create policy "Users can insert own video progress." on public.user_video_progress for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own video progress." on public.user_video_progress;
create policy "Users can update own video progress." on public.user_video_progress for update using (auth.uid() = user_id);

-- 5. USER BOOKMARKS (BATCHES)
create table if not exists public.user_bookmarks (
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, course_id)
);

create index if not exists idx_bookmarks_user on public.user_bookmarks(user_id);

alter table public.user_bookmarks enable row level security;
drop policy if exists "Users can view own bookmarks." on public.user_bookmarks;
create policy "Users can view own bookmarks." on public.user_bookmarks for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookmarks." on public.user_bookmarks;
create policy "Users can insert own bookmarks." on public.user_bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks." on public.user_bookmarks;
create policy "Users can delete own bookmarks." on public.user_bookmarks for delete using (auth.uid() = user_id);

-- 6. USER SAVED VIDEOS (LIBRARY FOLDERS)
create table if not exists public.user_saved_videos (
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id text not null,
  video_data jsonb not null default '{}'::jsonb,
  saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, video_id)
);

create index if not exists idx_saved_videos_user on public.user_saved_videos(user_id);

alter table public.user_saved_videos enable row level security;
drop policy if exists "Users can view own saved videos." on public.user_saved_videos;
create policy "Users can view own saved videos." on public.user_saved_videos for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved videos." on public.user_saved_videos;
create policy "Users can insert own saved videos." on public.user_saved_videos for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved videos." on public.user_saved_videos;
create policy "Users can update own saved videos." on public.user_saved_videos for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own saved videos." on public.user_saved_videos;
create policy "Users can delete own saved videos." on public.user_saved_videos for delete using (auth.uid() = user_id);
