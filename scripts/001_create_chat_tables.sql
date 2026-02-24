-- Chat sessions table
create table if not exists public.chat_sessions (
  id text primary key,
  title text not null default 'New Chat',
  tutorial_id text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Chat messages table
create table if not exists public.chat_messages (
  id text primary key,
  session_id text not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Index for fast message lookup by session
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);

-- Index for ordering sessions
create index if not exists idx_chat_sessions_created_at on public.chat_sessions(created_at desc);

-- PUBLIC access: no auth required, all chats are public
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Allow anyone to read all sessions
create policy "public_read_sessions" on public.chat_sessions for select using (true);
-- Allow anyone to insert sessions
create policy "public_insert_sessions" on public.chat_sessions for insert with check (true);
-- Allow anyone to update sessions
create policy "public_update_sessions" on public.chat_sessions for update using (true);
-- Allow anyone to delete sessions
create policy "public_delete_sessions" on public.chat_sessions for delete using (true);

-- Allow anyone to read all messages
create policy "public_read_messages" on public.chat_messages for select using (true);
-- Allow anyone to insert messages
create policy "public_insert_messages" on public.chat_messages for insert with check (true);
-- Allow anyone to update messages
create policy "public_update_messages" on public.chat_messages for update using (true);
-- Allow anyone to delete messages
create policy "public_delete_messages" on public.chat_messages for delete using (true);
