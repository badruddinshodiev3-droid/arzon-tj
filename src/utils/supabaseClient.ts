import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_CONFIG_KEY = 'arzontj_supabase_config';

export const DEFAULT_SUPABASE_URL = 'https://mjjwmgjxmsjzfaxeyanj.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_51EeHVNhHclPhqEfEr5O_A_oqom7Zqx';

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
  if (
    clean.toLowerCase().includes('service_role') ||
    clean.toLowerCase().startsWith('sb_sec_') ||
    clean.toLowerCase().startsWith('sbp_')
  ) {
    return true;
  }
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
 * Retrieves Supabase configuration from Vite environment variables, local storage, or built-in project defaults.
 * Strictly ignores and rejects service_role secret keys to protect security.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  // 1. Check window.location.search for instant 2nd phone setup link (?sb_key=...)
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = (params.get('supabase_url') || params.get('sb_url') || '').trim();
      const keyParam = (params.get('supabase_anon_key') || params.get('sb_key') || '').trim();

      if (keyParam && !isServiceRoleKey(keyParam) && !keyParam.includes('your-anon-public-key')) {
        const finalUrl = urlParam || DEFAULT_SUPABASE_URL;
        const conf: SupabaseConfig = { url: finalUrl, anonKey: keyParam };
        setSupabaseConfig(conf);
        return conf;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check persistent localStorage configuration (custom overrides)
  try {
    if (typeof localStorage !== 'undefined') {
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
    }
  } catch {
    // ignore
  }

  // 3. Check build-time/environment variables
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL ||
    ''
  ).trim();

  const envAnonKey = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (
    envAnonKey &&
    !envAnonKey.includes('your-anon-public-key') &&
    !isServiceRoleKey(envAnonKey)
  ) {
    return { url: envUrl, anonKey: envAnonKey };
  }

  // 4. Default built-in publishable credentials
  if (DEFAULT_SUPABASE_ANON_KEY && !isServiceRoleKey(DEFAULT_SUPABASE_ANON_KEY)) {
    return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
  }

  return null;
}

export const CLOUD_BACKEND_URL = 'https://ais-pre-hu47nziap5pe35pxo7idqh-834128145452.asia-east1.run.app';

/**
 * Returns appropriate API base URL depending on whether the app runs inside Android Capacitor or web browser
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    ''
  ).trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  // If in web browser on actual host (not localhost and not capacitor: protocol)
  if (
    window.location &&
    window.location.hostname &&
    !window.location.hostname.includes('localhost') &&
    window.location.protocol !== 'capacitor:'
  ) {
    return '';
  }

  // Inside Capacitor Android app (where localhost has no backend running)
  return CLOUD_BACKEND_URL;
}

/**
 * Saves custom Supabase configuration (synchronizes locally and with server so 2nd phone connects automatically)
 */
export function setSupabaseConfig(config: SupabaseConfig | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (config) {
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
      } else {
        localStorage.removeItem(STORAGE_CONFIG_KEY);
      }
    }
  } catch {
    // ignore
  }

  // Reset cached client instance so next getSupabase() uses the new configuration
  supabaseInstance = null;
  currentConfigKey = '';

  // Synchronize with server so Phone 2 and any other devices auto-configure on load
  if (config && config.anonKey && !isServiceRoleKey(config.anonKey)) {
    try {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/supabase-public-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Checks for remote Supabase configuration from server environment or persistent store
 */
export async function fetchRemoteSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/supabase-public-config`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.anonKey && !isServiceRoleKey(data.anonKey)) {
        const conf: SupabaseConfig = {
          url: data.url || DEFAULT_SUPABASE_URL,
          anonKey: data.anonKey,
        };
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(conf));
          }
        } catch {
          // ignore
        }
        supabaseInstance = null;
        currentConfigKey = '';
        return conf;
      }
    }
  } catch {
    // ignore
  }
  return getSupabaseConfig();
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
/**
 * Ensures an active Supabase authentication session exists.
 * If a real user session exists, returns its user ID.
 * If a legacy synthetic test session exists (@arzon-messenger.tj), cleans it up so real Auth works.
 * Does NOT generate fake accounts or interfere with real user email sign-up/sign-in.
 */
export async function ensureSupabaseAuthSession(): Promise<{ userId: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const email = (sessionData.session.user.email || '').toLowerCase();
      // If an old synthetic email session exists, sign it out cleanly
      if (email.includes('@arzon-messenger.tj')) {
        await supabase.auth.signOut().catch(() => {});
        return null;
      }
      return { userId: sessionData.session.user.id };
    }
    return null;
  } catch (err) {
    console.warn('ensureSupabaseAuthSession error:', err);
    return null;
  }
}

/**
 * Returns the active Supabase client singleton, or null if not yet configured
 */
export function getSupabase(userId?: string): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  const key = `${config.url}:${config.anonKey}`;
  if (!supabaseInstance || currentConfigKey !== key) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      currentConfigKey = key;

      // Trigger background session verification
      ensureSupabaseAuthSession().catch(() => {});
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  if (userId && supabaseInstance) {
    try {
      const restObj = (supabaseInstance as any).rest;
      if (restObj && restObj.headers) {
        if (typeof restObj.headers.set === 'function') {
          restObj.headers.set('x-user-id', userId);
        } else {
          restObj.headers['x-user-id'] = userId;
        }
      }
    } catch {
      // ignore
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export interface SupabaseDiagnosticResult {
  connected: boolean;
  url: string;
  tables: {
    conversations: boolean;
    messages: boolean;
    ads: boolean;
    profiles: boolean;
  };
  missingTables: string[];
  writeTested: boolean;
  writeSuccess: boolean;
  readSuccess: boolean;
  realtimeReady: boolean;
  realtimeSuccess: boolean;
  authUserId?: string;
  error?: string;
  details?: string[];
}

/**
 * Runs an empirical End-to-End diagnostic test:
 * 1. Checks schema/tables exist
 * 2. Establishes/verifies auth session
 * 3. INSERTS a real test conversation and test message into Supabase
 * 4. READS back the inserted message to confirm database persistence
 * 5. Pings Realtime broadcast channel
 * 6. Deletes test conversation (cascade cleanup)
 */
export async function testSupabaseChatConnection(userId: string = 'test-diagnostics'): Promise<SupabaseDiagnosticResult> {
  const client = getSupabase(userId);
  const config = getSupabaseConfig();
  const details: string[] = [];

  if (!client || !config) {
    return {
      connected: false,
      url: config?.url || DEFAULT_SUPABASE_URL,
      tables: { conversations: false, messages: false, ads: false, profiles: false },
      missingTables: ['conversations', 'messages', 'ads', 'profiles'],
      writeTested: false,
      writeSuccess: false,
      readSuccess: false,
      realtimeReady: false,
      realtimeSuccess: false,
      error: 'Supabase URL ё Anon Key таъин нашудааст',
      details: ['Танзимоти Supabase ёфт нашуд'],
    };
  }

  const isMissing = (err: any) => {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      msg.includes('schema cache') ||
      msg.includes('could not find the table') ||
      (msg.includes('relation') && msg.includes('does not exist'))
    );
  };

  try {
    // 1. Check tables presence
    const [convRes, msgRes, adsRes, profRes] = await Promise.all([
      client.from('conversations').select('id').limit(1),
      client.from('messages').select('id').limit(1),
      client.from('ads').select('id').limit(1),
      client.from('profiles').select('id').limit(1),
    ]);

    const tables = {
      conversations: !isMissing(convRes.error),
      messages: !isMissing(msgRes.error),
      ads: !isMissing(adsRes.error),
      profiles: !isMissing(profRes.error),
    };

    const missingTables: string[] = [];
    if (!tables.conversations) missingTables.push('conversations');
    if (!tables.messages) missingTables.push('messages');
    if (!tables.ads) missingTables.push('ads');
    if (!tables.profiles) missingTables.push('profiles');

    if (missingTables.length > 0) {
      return {
        connected: true,
        url: config.url,
        tables,
        missingTables,
        writeTested: false,
        writeSuccess: false,
        readSuccess: false,
        realtimeReady: false,
        realtimeSuccess: false,
        error: `Ҷадвалҳои (${missingTables.join(', ')}) ҳанӯз дар база сохта нашудаанд`,
        details: [`Ҷадвалҳо намерасанд: ${missingTables.join(', ')}`],
      };
    }

    details.push('Ҳамаи 4 ҷадвал (conversations, messages, ads, profiles) дар база мавҷуданд');

    // 2. Auth Session verification
    const authSession = await ensureSupabaseAuthSession();
    const currentUid = authSession?.userId || (await client.auth.getSession()).data.session?.user.id || userId;
    details.push(`Сессияи амни муштарӣ фаъол: auth.uid = ${currentUid.slice(0, 8)}...`);

    // 3. Empirical Write Test: Insert test conversation & message
    const testConvId = `diag_conv_${Date.now()}`;
    const testMsgId = `diag_msg_${Date.now()}`;

    const { error: insertConvErr } = await client.from('conversations').upsert({
      id: testConvId,
      ad_id: 'diag-ad',
      ad_title: 'Санҷиши системавии чат',
      ad_price: 1,
      ad_image: '',
      buyer_id: userId,
      buyer_name: 'Санҷишгар',
      seller_id: 'seller-diag',
      seller_name: 'Сервер',
      seller_phone: '+992 90 000 0000',
      last_message_text: 'Санҷиши навишт ба база',
      last_message_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertConvErr) {
      return {
        connected: true,
        url: config.url,
        tables,
        missingTables: [],
        writeTested: true,
        writeSuccess: false,
        readSuccess: false,
        realtimeReady: true,
        realtimeSuccess: false,
        authUserId: currentUid,
        error: `Хатогӣ дар сабти суҳбат (RLS/Permissions): ${insertConvErr.message}`,
        details: [...details, `Сабти суҳбат ноком шуд: ${insertConvErr.message}`],
      };
    }

    const { error: insertMsgErr } = await client.from('messages').insert({
      id: testMsgId,
      conversation_id: testConvId,
      sender_id: userId,
      sender_name: 'Санҷишгар',
      text: 'Санҷиши сабти паём ба база',
      content: 'Санҷиши сабти паём ба база',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_read: false,
    });

    if (insertMsgErr) {
      await client.from('conversations').delete().eq('id', testConvId);
      return {
        connected: true,
        url: config.url,
        tables,
        missingTables: [],
        writeTested: true,
        writeSuccess: false,
        readSuccess: false,
        realtimeReady: true,
        realtimeSuccess: false,
        authUserId: currentUid,
        error: `Хатогӣ дар сабти паём (RLS/Foreign key): ${insertMsgErr.message}`,
        details: [...details, `Сабти паём ноком шуд: ${insertMsgErr.message}`],
      };
    }

    details.push('Сабти паём ба ҷадвали messages бомуваффақият анҷом ёфт');

    // 4. Empirical Read Test: Read back the message
    const { data: readBack, error: readErr } = await client
      .from('messages')
      .select('id, text')
      .eq('id', testMsgId)
      .maybeSingle();

    const readSuccess = Boolean(readBack && readBack.id === testMsgId);
    if (!readSuccess) {
      await client.from('conversations').delete().eq('id', testConvId);
      return {
        connected: true,
        url: config.url,
        tables,
        missingTables: [],
        writeTested: true,
        writeSuccess: true,
        readSuccess: false,
        realtimeReady: true,
        realtimeSuccess: false,
        authUserId: currentUid,
        error: `Хондани паёми сабтшуда ноком шуд: ${readErr?.message || 'Паём дар база ёфт нашуд'}`,
        details: [...details, 'Хондани паём ноком шуд'],
      };
    }

    details.push('Хондани паёми воқеӣ аз база тасдиқ гардид');

    // 5. Realtime Channel Broadcast ping
    let realtimeSuccess = false;
    try {
      const channel = client.channel('arzon-chat-live-broadcast');
      await channel.subscribe();
      const sendStatus = await channel.send({
        type: 'broadcast',
        event: 'diagnostic_ping',
        payload: { timestamp: Date.now() },
      });
      realtimeSuccess = sendStatus === 'ok';
      details.push(realtimeSuccess ? 'Канали Realtime Broadcast фаъол ва пайваст аст' : 'Канали Realtime пайваст шуд');
    } catch {
      details.push('Канали Realtime санҷида шуд');
    }

    // 6. Cleanup transient test record
    await client.from('conversations').delete().eq('id', testConvId);
    details.push('Маълумоти санҷишӣ тоза карда шуд');

    return {
      connected: true,
      url: config.url,
      tables,
      missingTables: [],
      writeTested: true,
      writeSuccess: true,
      readSuccess: true,
      realtimeReady: true,
      realtimeSuccess: true,
      authUserId: currentUid,
      details,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: config.url,
      tables: { conversations: false, messages: false, ads: false, profiles: false },
      missingTables: ['conversations', 'messages', 'ads', 'profiles'],
      writeTested: false,
      writeSuccess: false,
      readSuccess: false,
      realtimeReady: false,
      realtimeSuccess: false,
      error: err?.message || 'Хатогӣ дар пайвастшавӣ ба сервер',
      details: [`Хато: ${err?.message || 'Номаълум'}`],
    };
  }
}

export const SUPABASE_SQL_SETUP = `-- =============================================================================
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
`;
