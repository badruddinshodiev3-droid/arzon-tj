-- =============================================================================
-- ARZON.TJ: ТАНЗИМОТИ РАСМИИ ЧАТИ ВОҚЕИИ ДУТАРАФА ДАР SUPABASE
-- =============================================================================
-- Лоиҳа: https://mjjwmgjxmsjzfaxeyanj.supabase.co
-- Ҳадаф: Таъмини иртиботи дутарафаи зинда (Realtime) байни ду телефони гуногун
-- =============================================================================
-- ИН СКРИПТ БЕХАТАР ВА ТАКРОРАН ИҶРОШАВАНДА (IDEMPOTENT) АСТ:
-- Шумо метавонед онро якчанд маротиба иҷро кунед, бе хавфи вайрон шудани маълумот.
-- =============================================================================

-- 1. ИҶОЗАТҲОИ СХЕМА
grant usage on schema public to anon, authenticated;

-- 2. ҶАДВАЛИ СУҲБАТҲО (public.conversations)
create table if not exists public.conversations (
  id text primary key,
  ad_id text not null,
  ad_title text not null,
  ad_price numeric not null default 0,
  ad_image text default '',
  buyer_id text not null,
  buyer_name text not null,
  seller_id text not null,
  seller_name text not null,
  seller_phone text default '',
  last_message_text text default '',
  last_message_timestamp timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ҳамоҳангсозии сутунҳо бо тамоми версияҳои қаблии база
alter table public.conversations add column if not exists ad_id text default '';
alter table public.conversations add column if not exists ad_title text default '';
alter table public.conversations add column if not exists ad_price numeric default 0;
alter table public.conversations add column if not exists ad_image text default '';
alter table public.conversations add column if not exists buyer_id text default '';
alter table public.conversations add column if not exists buyer_name text default '';
alter table public.conversations add column if not exists seller_id text default '';
alter table public.conversations add column if not exists seller_name text default '';
alter table public.conversations add column if not exists seller_phone text default '';
alter table public.conversations add column if not exists last_message_text text default '';
alter table public.conversations add column if not exists last_message_timestamp timestamptz default now();
alter table public.conversations add column if not exists updated_at timestamptz default now();

-- 3. ҶАДВАЛИ ПАЁМҲО (public.messages)
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  text text not null default '',
  content text default '',
  image_url text,
  timestamp timestamptz default now(),
  created_at timestamptz default now(),
  is_read boolean default false
);

-- Ҳамоҳангсозии сутунҳои паём (ҳам text ва ҳам content барои мувофиқати комил)
alter table public.messages add column if not exists text text default '';
alter table public.messages add column if not exists content text default '';
alter table public.messages add column if not exists image_url text;
alter table public.messages add column if not exists timestamp timestamptz default now();
alter table public.messages add column if not exists created_at timestamptz default now();
alter table public.messages add column if not exists is_read boolean default false;

-- 4. ҶАДВАЛҲОИ ЁРИРАСОН (Эълонҳо, Профилҳо ва Пардохтҳо)
create table if not exists public.ads (
  id text primary key,
  title text not null,
  description text default '',
  price numeric not null default 0,
  is_negotiable boolean default true,
  category text not null,
  city text not null,
  district text default '',
  images jsonb default '[]'::jsonb,
  phone text not null,
  seller_id text not null,
  seller_name text not null,
  seller_joined text default '2026',
  views integer default 1,
  condition text default 'used',
  featured boolean default false,
  is_vip boolean default false,
  is_urgent boolean default false,
  is_highlighted boolean default false,
  promoted_until timestamptz,
  specs jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  phone text default '',
  email text default '',
  balance numeric default 0,
  joined_date text default '2026',
  is_verified boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id text primary key,
  order_id text unique not null,
  ad_id text not null,
  user_id text,
  package_id text not null default 'vip',
  amount numeric not null,
  currency text default 'TJS',
  provider text not null default 'alif',
  provider_tx_id text,
  customer_phone text,
  status text not null default 'pending',
  verified_on_server boolean not null default false,
  duration_days integer not null default 7,
  promoted_until timestamptz,
  created_at timestamptz default now(),
  verified_at timestamptz
);

-- 5. ИНДЕКСҲО БАРОИ СУРЪАТИ БАЛАНДИ ҶУСТУҶӮ ВА РАСИДАНИ ФАВРИИ ПАЁМҲО
create index if not exists idx_conversations_participants on public.conversations(buyer_id, seller_id);
create index if not exists idx_conversations_updated on public.conversations(updated_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, timestamp asc);
create index if not exists idx_messages_unread on public.messages(conversation_id, is_read) where is_read = false;
create index if not exists idx_ads_city on public.ads(city);
create index if not exists idx_ads_category on public.ads(category);

-- 6. ҲУҚУҚҲОИ ДАСТРАСӢ БАРОИ НАҚШҲОИ ANON ВА AUTHENTICATED
grant all on public.conversations to anon, authenticated;
grant all on public.messages to anon, authenticated;
grant all on public.ads to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.payments to anon, authenticated;

-- 7. ФАЪОЛСОЗИИ БЕХАТАРИИ ROW LEVEL SECURITY (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ads enable row level security;
alter table public.profiles enable row level security;
alter table public.payments enable row level security;

-- 8. ТОЗАКУНИИ СИЁСАТҲОИ КӮҲНА, КИ REALTIME-РО МАСДУД МЕКАРДАНД
drop policy if exists "Participants can view conversations" on public.conversations;
drop policy if exists "Participants can insert conversations" on public.conversations;
drop policy if exists "Participants can update conversations" on public.conversations;
drop policy if exists "Participants can delete conversations" on public.conversations;
drop policy if exists "Users can access own conversations" on public.conversations;
drop policy if exists "Users can insert own conversations" on public.conversations;
drop policy if exists "Users can update own conversations" on public.conversations;
drop policy if exists "Allow conversations access" on public.conversations;
drop policy if exists "Allow all on conversations" on public.conversations;
drop policy if exists "Allow select conversations" on public.conversations;
drop policy if exists "Allow insert conversations" on public.conversations;
drop policy if exists "Allow update conversations" on public.conversations;
drop policy if exists "Allow delete conversations" on public.conversations;

drop policy if exists "Participants can read messages" on public.messages;
drop policy if exists "Participants can insert messages" on public.messages;
drop policy if exists "Participants can update messages" on public.messages;
drop policy if exists "Participants can delete messages" on public.messages;
drop policy if exists "Users can access conversation messages" on public.messages;
drop policy if exists "Users can insert conversation messages" on public.messages;
drop policy if exists "Users can update conversation messages" on public.messages;
drop policy if exists "Allow messages access" on public.messages;
drop policy if exists "Allow all on messages" on public.messages;
drop policy if exists "Allow select messages" on public.messages;
drop policy if exists "Allow insert messages" on public.messages;
drop policy if exists "Allow update messages" on public.messages;
drop policy if exists "Allow delete messages" on public.messages;

-- 9. СИЁСАТҲОИ НАВИ RLS БАРОИ CONVERSATIONS (СУҲБАТҲО)
-- Талаботи бехатарӣ: мушаххасоти суҳбат, харидор, фурӯшанда ва эълон набояд холӣ бошанд
create policy "Allow select conversations" on public.conversations
  for select to anon, authenticated
  using (
    length(coalesce(id, '')) > 0 and
    length(coalesce(buyer_id, '')) > 0 and
    length(coalesce(seller_id, '')) > 0
  );

create policy "Allow insert conversations" on public.conversations
  for insert to anon, authenticated
  with check (
    length(coalesce(id, '')) > 0 and
    length(coalesce(buyer_id, '')) > 0 and
    length(coalesce(seller_id, '')) > 0 and
    length(coalesce(ad_id, '')) > 0
  );

create policy "Allow update conversations" on public.conversations
  for update to anon, authenticated
  using (
    length(coalesce(id, '')) > 0
  )
  with check (
    length(coalesce(id, '')) > 0
  );

create policy "Allow delete conversations" on public.conversations
  for delete to anon, authenticated
  using (
    length(coalesce(id, '')) > 0
  );

-- 10. СИЁСАТҲОИ НАВИ RLS БАРОИ MESSAGES (ПАЁМҲО)
-- Талаботи бехатарӣ: паём бояд дорои conversation_id, sender_id ва матн ё акс бошад
-- Муҳим барои Realtime: иҷозати хондан (select) барои нақши anon имкон медиҳад, ки телефони 2-юм паёмро фавран қабул кунад
create policy "Allow select messages" on public.messages
  for select to anon, authenticated
  using (
    length(coalesce(conversation_id, '')) > 0
  );

create policy "Allow insert messages" on public.messages
  for insert to anon, authenticated
  with check (
    length(coalesce(conversation_id, '')) > 0 and
    length(coalesce(sender_id, '')) > 0 and
    (
      length(coalesce(text, '')) > 0 or
      length(coalesce(content, '')) > 0 or
      image_url is not null
    )
  );

create policy "Allow update messages" on public.messages
  for update to anon, authenticated
  using (
    length(coalesce(conversation_id, '')) > 0
  )
  with check (
    length(coalesce(conversation_id, '')) > 0
  );

create policy "Allow delete messages" on public.messages
  for delete to anon, authenticated
  using (
    length(coalesce(conversation_id, '')) > 0
  );

-- 11. СИЁСАТҲО БАРОИ ЭЪЛОНҲО, ПРОФИЛҲО ВА ПАРДОХТҲО
drop policy if exists "Allow all read ads" on public.ads;
drop policy if exists "Allow insert ads" on public.ads;
drop policy if exists "Allow update own ads" on public.ads;
drop policy if exists "Allow delete own ads" on public.ads;

create policy "Allow all read ads" on public.ads for select using (true);
create policy "Allow insert ads" on public.ads for insert with check (length(title) > 0 and price >= 0);
create policy "Allow update own ads" on public.ads for update using (true);
create policy "Allow delete own ads" on public.ads for delete using (true);

drop policy if exists "Allow all read profiles" on public.profiles;
drop policy if exists "Allow all upsert profiles" on public.profiles;
create policy "Allow all read profiles" on public.profiles for select using (true);
create policy "Allow all upsert profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Allow read own payments" on public.payments;
create policy "Allow read own payments" on public.payments for select using (true);

-- 12. ФАЪОЛСОЗИИ REALTIME REPLICA ВА PUBLICATION БАРОИ ДУ ТЕЛЕФОН
alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.ads replica identity full;
alter table public.profiles replica identity full;

do $$
begin
  -- Эҷоди нашрия агар мавҷуд набошад
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  -- Иловаи conversations ба Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  -- Иловаи messages ба Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  -- Иловаи ads ба Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;

  -- Иловаи profiles ба Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
