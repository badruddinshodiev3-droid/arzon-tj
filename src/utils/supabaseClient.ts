import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_CONFIG_KEY = 'arzontj_supabase_config';

export const DEFAULT_SUPABASE_URL = 'https://mjjwmgjxmsjzfaxeyanj.supabase.co';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Detects if a key is a dangerous service_role secret key (must NEVER be used in frontend/Android)
 */
export function isServiceRoleKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const clean = key.trim();
  if (clean.toLowerCase().includes('service_role')) return true;
  try {
    const parts = clean.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      if (parsed.role === 'service_role') {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Retrieves Supabase configuration from Vite environment variables or local storage.
 * Strictly ignores and rejects service_role secret keys to protect security.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL || '').trim();
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (
    envAnonKey &&
    !envAnonKey.includes('your-anon-public-key') &&
    !isServiceRoleKey(envAnonKey)
  ) {
    return { url: envUrl, anonKey: envAnonKey };
  }

  try {
    const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const url = (parsed.url && parsed.url.trim()) || DEFAULT_SUPABASE_URL;
      const anonKey = (parsed.anonKey && parsed.anonKey.trim()) || '';
      if (
        anonKey &&
        !anonKey.includes('your-anon-public-key') &&
        !isServiceRoleKey(anonKey)
      ) {
        return { url, anonKey };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Saves custom Supabase configuration (helpful for testing directly on Android without recompiling)
 */
export function setSupabaseConfig(config: SupabaseConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
    }
  } catch {
    // ignore
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Returns the active Supabase client singleton, or null if not yet configured
 */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  const key = `${config.url}:${config.anonKey}`;
  if (supabaseInstance && currentConfigKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigKey = key;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export const SUPABASE_SQL_SETUP = `-- =========================================================
-- ARZON.TJ: Пойгоҳи додаҳо барои чати зинда ва эълонҳо
-- Лоиҳа: https://mjjwmgjxmsjzfaxeyanj.supabase.co
-- Ин скриптро дар Supabase -> SQL Editor гузошта "Run" кунед.
-- =========================================================

-- 1. Иҷозатҳои асосӣ барои нақшҳои anon ва authenticated
grant usage on schema public to anon, authenticated;

-- 2. Эҷоди ҷадвали суҳбатҳо (Conversations)
create table if not exists public.conversations (
  id text primary key,
  ad_id text not null,
  ad_title text not null,
  ad_price numeric not null,
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

-- 3. Эҷоди ҷадвали паёмҳо (Messages)
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  text text not null default '',
  image_url text,
  timestamp timestamptz default now(),
  is_read boolean default false
);

-- 4. Ҷадвали расмии эълонҳо ва аксҳо (Advertisements & Photos)
create table if not exists public.ads (
  id text primary key,
  title text not null,
  description text default '',
  price numeric not null,
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

-- 5. Ҷадвали профили корбарон (User Profiles)
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

-- 6. Ҷадвали пардохтҳо (Payments)
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

-- 7. Индексҳо барои суръати баланд
create index if not exists idx_conversations_participants on public.conversations(buyer_id, seller_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id, timestamp);
create index if not exists idx_ads_seller on public.ads(seller_id);
create index if not exists idx_ads_city on public.ads(city);
create index if not exists idx_ads_category on public.ads(category);
create index if not exists idx_payments_order on public.payments(order_id);

-- 8. Иҷозатҳои ҷадвалҳо барои нақшҳо
grant all on public.conversations to anon, authenticated;
grant all on public.messages to anon, authenticated;
grant all on public.ads to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.payments to anon, authenticated;

-- 9. Фаъолсозии бехатарии Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ads enable row level security;
alter table public.profiles enable row level security;
alter table public.payments enable row level security;

-- 10. Қоидаҳои RLS барои Conversations
drop policy if exists "Users can access own conversations" on public.conversations;
drop policy if exists "Users can insert own conversations" on public.conversations;
drop policy if exists "Users can update own conversations" on public.conversations;
drop policy if exists "Allow conversations access" on public.conversations;

create policy "Allow conversations access" on public.conversations
  for all using (true) with check (true);

-- 11. Қоидаҳои RLS барои Messages
drop policy if exists "Users can access conversation messages" on public.messages;
drop policy if exists "Users can insert conversation messages" on public.messages;
drop policy if exists "Users can update conversation messages" on public.messages;
drop policy if exists "Allow messages access" on public.messages;

create policy "Allow messages access" on public.messages
  for all using (true) with check (true);

-- 12. Қоидаҳои RLS барои Ads
drop policy if exists "Allow all read ads" on public.ads;
drop policy if exists "Allow insert ads" on public.ads;
drop policy if exists "Allow update own ads" on public.ads;
drop policy if exists "Allow delete own ads" on public.ads;

create policy "Allow all read ads" on public.ads for select using (true);

create policy "Allow insert ads" on public.ads for insert with check (
  length(title) > 0 and price > 0 and length(phone) > 0 and
  (auth.uid() is null or auth.uid()::text = seller_id)
);

create policy "Allow update own ads" on public.ads for update using (
  auth.uid() is null or auth.uid()::text = seller_id
);

create policy "Allow delete own ads" on public.ads for delete using (
  auth.uid() is null or auth.uid()::text = seller_id
);

-- 13. Қоидаҳои RLS барои Profiles
drop policy if exists "Allow all read profiles" on public.profiles;
drop policy if exists "Allow all upsert profiles" on public.profiles;

create policy "Allow all read profiles" on public.profiles for select using (true);
create policy "Allow all upsert profiles" on public.profiles for all using (
  auth.uid() is null or auth.uid()::text = id
) with check (
  auth.uid() is null or auth.uid()::text = id
);

-- 14. Қоидаҳои RLS барои Payments
drop policy if exists "Allow read own payments" on public.payments;
create policy "Allow read own payments" on public.payments for select using (true);

-- 15. Фаъолсозии бехатари Realtime байни ду телефон
alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.ads replica identity full;
alter table public.profiles replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
`;
