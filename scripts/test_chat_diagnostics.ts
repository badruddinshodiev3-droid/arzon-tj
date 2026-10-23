import { normalizeUserId, deduplicateMessages, CHAT_BROADCAST_CHANNEL } from '../src/utils/chatUtils';
import {
  DEFAULT_SUPABASE_URL,
  isServiceRoleKey,
  SUPABASE_SQL_SETUP,
  getSupabaseConfig
} from '../src/utils/supabaseClient';

async function runTests() {
  console.log('====================================================');
  console.log('  ARZON.TJ SUPABASE REAL-TIME CHAT DIAGNOSTIC SUITE  ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  // 1. User ID Normalization across 2 phones
  console.log('--- 1. Телефон ва Муайянкунии иштирокчиён (2 Phones Normalization) ---');
  const buyerPhoneRaw = '900112233';
  const buyerPhoneInternational = '+992900112233';
  const buyerPhonePrefixed = 'user-992900112233';

  const sellerPhoneRaw = '928887766';
  const sellerPhoneInternational = '+992928887766';

  const normBuyer1 = normalizeUserId(buyerPhoneRaw);
  const normBuyer2 = normalizeUserId(buyerPhoneInternational);
  const normBuyer3 = normalizeUserId(buyerPhonePrefixed);

  assert(normBuyer1 === 'user-992900112233', '900112233 -> user-992900112233');
  assert(normBuyer2 === 'user-992900112233', '+992900112233 -> user-992900112233');
  assert(normBuyer3 === 'user-992900112233', 'user-992900112233 -> user-992900112233');
  assert(normBuyer1 === normBuyer2 && normBuyer2 === normBuyer3, 'Ҳама намуди рақамҳои телефон ба як ID муттаҳид шуданд');

  const normSeller1 = normalizeUserId(sellerPhoneRaw);
  const normSeller2 = normalizeUserId(sellerPhoneInternational);
  assert(normSeller1 === normSeller2 && normSeller1 === 'user-992928887766', 'Фурӯшанда аз телефони дуюм ба ID мувофиқ табдил ёфт');

  // 2. Security Key Auditing (Anon Key vs Service Role)
  console.log('\n--- 2. Бехатарии калидҳо (Anon Key vs Service Role) ---');
  const fakeServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature';
  const fakeAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature';

  assert(isServiceRoleKey(fakeServiceKey) === true, 'Калиди махфии service_role дуруст маҳдуд ва рад карда мешавад');
  assert(isServiceRoleKey(fakeAnonKey) === false, 'Калиди оммавии anon дуруст қабул карда мешавад');
  assert(isServiceRoleKey('sb_sec_secret_sample_key') === true, 'Калидҳои махфии sb_sec рад карда мешаванд');

  // 3. Message Deduplication & Rapid Debounce Protection
  console.log('\n--- 3. Муҳофизат аз паёмҳои такрорӣ (Message Deduplication) ---');
  const nowIso = new Date().toISOString();
  const rawMsgs: any[] = [
    { id: 'm1', senderId: 'u1', text: 'Салом бародар', timestamp: nowIso },
    { id: 'm1', senderId: 'u1', text: 'Салом бародар', timestamp: nowIso }, // ID duplicate
    { id: 'm2', senderId: 'u1', text: 'Салом бародар', timestamp: new Date(Date.now() + 1000).toISOString() }, // Rapid duplicate
    { id: 'm3', senderId: 'u2', text: 'Ваалайкум салом, мол дар фурӯш ҳаст', timestamp: new Date(Date.now() + 3000).toISOString() },
  ];
  const deduped = deduplicateMessages(rawMsgs);
  assert(deduped.length === 2, `Паёмҳои такрорӣ филтр шуданд (4 паём -> ${deduped.length} паём)`);
  assert(deduped[0].id === 'm1' && deduped[1].id === 'm3', 'Танҳо паёмҳои воқеӣ нигоҳ дошта шуданд');

  // 4. Supabase Setup SQL Validation
  console.log('\n--- 4. Санҷиши сохтори SQL дар Supabase ---');
  assert(SUPABASE_SQL_SETUP.includes('create table if not exists public.conversations'), 'Ҷадвали conversations дар SQL мавҷуд аст');
  assert(SUPABASE_SQL_SETUP.includes('create table if not exists public.messages'), 'Ҷадвали messages бо references conversations дар SQL мавҷуд аст');
  assert(SUPABASE_SQL_SETUP.includes('create or replace function public.current_app_user()'), 'Функсияи current_app_user() барои RLS муайян шудааст');
  assert(SUPABASE_SQL_SETUP.includes('create policy "Participants can view conversations"'), 'Сиёсати RLS барои суҳбатҳо танҳо барои иштирокчиён танзим шудааст');
  assert(SUPABASE_SQL_SETUP.includes('create policy "Participants can read messages"'), 'Сиёсати RLS барои паёмҳо танҳо барои иштирокчиён танзим шудааст');
  assert(SUPABASE_SQL_SETUP.includes('alter publication supabase_realtime add table'), 'Realtime дар ҷадвали messages фаъол шудааст');

  // 5. Supabase Real Endpoint Ping & Reachability
  console.log('\n--- 5. Санҷиши пайвасти шабакавӣ ба сервери Supabase ---');
  console.log(`URL: ${DEFAULT_SUPABASE_URL}`);
  try {
    const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log(`HTTP Status: ${res.status} (${res.statusText})`);
    assert(res.status === 401 || res.status === 200, `Сервери Supabase зинда ва дастрас аст (status: ${res.status})`);
  } catch (err: any) {
    console.error('Хато дар пайвасти шабакавӣ:', err.message);
    assert(false, `Пайвастшавӣ ба сервери Supabase ноком шуд: ${err.message}`);
  }

  // 6. Realtime Channel Specification
  console.log('\n--- 6. Санҷиши Канали Realtime Broadcast ---');
  assert(CHAT_BROADCAST_CHANNEL === 'arzon-chat-live-broadcast', `Канали пахши мустақим дуруст аст (${CHAT_BROADCAST_CHANNEL})`);

  console.log('\n====================================================');
  console.log(`  НАТИҶА: ${passedTests} аз ${totalTests} санҷиш бомуваффақият гузаштанд!  `);
  console.log('====================================================\n');
}

runTests().catch(console.error);
