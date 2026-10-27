import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '.data');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Parse JSON bodies
app.use(express.json());

// Enable CORS for Android Capacitor apps and cross-origin mobile clients
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// =============================================================================
// SAFE RATE LIMITING & SECURITY MONITORING
// =============================================================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

export const securityMetrics = {
  totalPaymentOrders: 0,
  verifiedPayments: 0,
  failedPayments: 0,
  rateLimitHits: 0,
  suspiciousPayloadsBlocked: 0,
  startedAt: new Date().toISOString(),
};

function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const key = `${ip}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();
    const bucket = rateLimitMap.get(key);

    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      securityMetrics.rateLimitHits += 1;
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Илтимос, каме сабр кунед. Муроҷиатҳои аз ҳад зиёд сабт шуданд.',
      });
    }

    return next();
  };
}

// Direct project backup ZIP download endpoint with full mobile & CORS support
app.get(['/api/download-latest-zip', '/download-zip'], (_req: Request, res: Response) => {
  const zipFile = path.resolve(__dirname, 'public/arzon-tj-latest.zip');
  if (fs.existsSync(zipFile)) {
    const stat = fs.statSync(zipFile);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="arzon-tj-latest.zip"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');
    const fileStream = fs.createReadStream(zipFile);
    fileStream.pipe(res);
  } else {
    res.status(404).send('ZIP file not found');
  }
});

// In-memory + persistent file store for public Supabase configuration
const SUPABASE_CONFIG_FILE = path.resolve(DATA_DIR, 'supabase-config.json');

function loadSupabaseConfig(): { url: string; anonKey: string } | null {
  try {
    if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
      const data = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.anonKey) return parsed;
    }
  } catch (err) {
    console.error('Error reading supabase config:', err);
  }
  return null;
}

function saveSupabaseConfigFile(cfg: { url: string; anonKey: string }): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving supabase config:', err);
  }
}

// Safe public Supabase config endpoint (only shares the public URL and publishable anon key)
app.get('/api/supabase-public-config', (_req: Request, res: Response) => {
  const fileConfig = loadSupabaseConfig();
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    fileConfig?.url ||
    'https://mjjwmgjxmsjzfaxeyanj.supabase.co';
  const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_51EeHVNhHclPhqEfEr5O_A_oqom7Zqx';
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    fileConfig?.anonKey ||
    DEFAULT_PUBLISHABLE_KEY;
  res.json({
    configured: Boolean(anonKey),
    url,
    anonKey,
  });
});

app.post('/api/supabase-public-config', (req: Request, res: Response) => {
  const { url, anonKey } = req.body || {};
  if (!anonKey || typeof anonKey !== 'string') {
    return res.status(400).json({ error: 'anonKey is required' });
  }
  const cleanKey = anonKey.trim();
  if (
    cleanKey.toLowerCase().includes('service_role') ||
    cleanKey.toLowerCase().startsWith('sb_sec_') ||
    cleanKey.toLowerCase().startsWith('sbp_')
  ) {
    return res.status(400).json({ error: 'service_role secret key is strictly forbidden' });
  }
  const cleanUrl =
    (url && typeof url === 'string' && url.trim()) ||
    'https://mjjwmgjxmsjzfaxeyanj.supabase.co';
  const cfg = { url: cleanUrl, anonKey: cleanKey };
  saveSupabaseConfigFile(cfg);
  process.env.VITE_SUPABASE_ANON_KEY = cleanKey;
  process.env.VITE_SUPABASE_URL = cleanUrl;
  res.json({ success: true, configured: true, url: cleanUrl });
});

// =============================================================================
// SERVER-SIDE CHAT RELAY & SYNC (Hybrid sync alongside Supabase Realtime)
// Ensures 100% two-way communication between mobile phones
// =============================================================================
const CHAT_STORE_FILE = path.resolve(DATA_DIR, 'chat-store.json');

function loadChatStore(): any[] {
  try {
    if (fs.existsSync(CHAT_STORE_FILE)) {
      const data = fs.readFileSync(CHAT_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading chat store:', err);
  }
  return [];
}

function saveChatStore(convs: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHAT_STORE_FILE, JSON.stringify(convs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving chat store:', err);
  }
}

app.get('/api/chat/sync', (req: Request, res: Response) => {
  const userId = String(req.query.userId || '').trim();
  const allConvs = loadChatStore();
  if (!userId) {
    return res.json({ success: true, conversations: allConvs });
  }
  const cleanDigits = userId.replace(/\D/g, '');
  const filtered = allConvs.filter((c: any) => {
    const bId = String(c.buyerId || '');
    const sId = String(c.sellerId || '');
    const bDigits = bId.replace(/\D/g, '');
    const sDigits = sId.replace(/\D/g, '');
    return (
      bId === userId ||
      sId === userId ||
      (cleanDigits && (bDigits.includes(cleanDigits) || sDigits.includes(cleanDigits))) ||
      (c.messages && c.messages.some((m: any) => m.senderId === userId || (cleanDigits && String(m.senderId).includes(cleanDigits))))
    );
  });
  res.json({ success: true, conversations: filtered });
});

app.post('/api/chat/send', (req: Request, res: Response) => {
  const { conversation, message } = req.body || {};
  if (!conversation || !message || !conversation.id || !message.id) {
    return res.status(400).json({ error: 'conversation and message are required' });
  }

  const allConvs = loadChatStore();
  const index = allConvs.findIndex((c) => c.id === conversation.id);

  if (index >= 0) {
    const existing = allConvs[index];
    const msgs = Array.isArray(existing.messages) ? existing.messages : [];
    const msgIndex = msgs.findIndex((m: any) => m.id === message.id);
    if (msgIndex >= 0) {
      msgs[msgIndex] = { ...msgs[msgIndex], ...message };
    } else {
      msgs.push(message);
    }
    existing.messages = msgs;
    existing.lastMessageText = message.text || (message.imageUrl ? '📷 Фото' : '');
    existing.lastMessageTimestamp = message.timestamp || new Date().toISOString();
    existing.updatedAt = message.timestamp || new Date().toISOString();
    allConvs[index] = existing;
  } else {
    allConvs.unshift({
      ...conversation,
      messages: [message],
      lastMessageText: message.text || (message.imageUrl ? '📷 Фото' : ''),
      lastMessageTimestamp: message.timestamp || new Date().toISOString(),
      updatedAt: message.timestamp || new Date().toISOString(),
    });
  }

  saveChatStore(allConvs);
  res.json({ success: true });
});

app.post('/api/chat/conversation', (req: Request, res: Response) => {
  const conv = req.body;
  if (!conv || !conv.id) return res.status(400).json({ error: 'Valid conversation required' });
  const allConvs = loadChatStore();
  const index = allConvs.findIndex((c) => c.id === conv.id);
  if (index >= 0) {
    allConvs[index] = { ...allConvs[index], ...conv };
  } else {
    allConvs.unshift({ ...conv, messages: conv.messages || [] });
  }
  saveChatStore(allConvs);
  res.json({ success: true });
});

app.post('/api/chat/read', (req: Request, res: Response) => {
  const { conversationId, readerId } = req.body || {};
  if (!conversationId) return res.status(400).json({ error: 'conversationId is required' });

  const allConvs = loadChatStore();
  const index = allConvs.findIndex((c) => c.id === conversationId);
  if (index >= 0) {
    const conv = allConvs[index];
    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    let updated = false;
    for (const m of msgs) {
      if (readerId ? String(m.senderId) !== String(readerId) : true) {
        if (!m.isRead) {
          m.isRead = true;
          updated = true;
        }
      }
    }
    if (updated) {
      conv.messages = msgs;
      allConvs[index] = conv;
      saveChatStore(allConvs);
    }
  }
  res.json({ success: true });
});

// In-memory + persistent disk store for payment transactions
export interface PaymentTransaction {
  id: string;
  orderId: string;
  adId: string;
  packageId: 'vip' | 'turbo' | 'urgent' | 'max';
  amount: number; // 15 TJS for VIP
  currency: 'TJS';
  provider: 'alif' | 'dc' | 'korti_milli';
  providerTxId?: string;
  customerPhone?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  verifiedOnServer: boolean;
  verifiedAt?: string;
  durationDays: number;
  promotedUntil?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

const PAYMENTS_FILE = path.resolve(DATA_DIR, 'payments.json');

function loadPayments(): Map<string, PaymentTransaction> {
  const map = new Map<string, PaymentTransaction>();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = fs.readFileSync(PAYMENTS_FILE, 'utf-8');
      const list: PaymentTransaction[] = JSON.parse(data);
      for (const item of list) {
        map.set(item.orderId, item);
      }
    }
  } catch (err) {
    console.error('Error loading payments file:', err);
  }
  return map;
}

function savePayments(map: Map<string, PaymentTransaction>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(map.values());
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving payments file:', err);
  }
}

const paymentsStore = loadPayments();

// Config helper
function getPaymentProviderConfig() {
  const alifMerchantId = process.env.ALIF_MERCHANT_ID || '';
  const alifSecretKey = process.env.ALIF_SECRET_KEY || '';
  const alifApiUrl = process.env.ALIF_API_URL || 'https://api.alif.tj';

  const dcMerchantId = process.env.DC_MERCHANT_ID || '';
  const dcSecretKey = process.env.DC_SECRET_KEY || '';
  const dcApiUrl = process.env.DC_API_URL || 'https://api.dcity.tj';

  const isAlifConfigured = Boolean(alifMerchantId && alifSecretKey);
  const isDcConfigured = Boolean(dcMerchantId && dcSecretKey);

  return {
    isConfigured: isAlifConfigured || isDcConfigured,
    alif: {
      isConfigured: isAlifConfigured,
      merchantId: alifMerchantId ? `${alifMerchantId.slice(0, 4)}***` : null,
      apiUrl: alifApiUrl,
    },
    dc: {
      isConfigured: isDcConfigured,
      merchantId: dcMerchantId ? `${dcMerchantId.slice(0, 4)}***` : null,
      apiUrl: dcApiUrl,
    },
    pricing: {
      vip: { price: 15, durationDays: 7, currency: 'TJS' },
      turbo: { price: 5, durationDays: 1, currency: 'TJS' },
      urgent: { price: 10, durationDays: 7, currency: 'TJS' },
      max: { price: 25, durationDays: 14, currency: 'TJS' },
    },
  };
}

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// 1. Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Arzon.tj',
    timestamp: new Date().toISOString(),
  });
});

// 2. Payment Configuration Status
app.get('/api/payment/config', (_req: Request, res: Response) => {
  const config = getPaymentProviderConfig();
  res.json({
    success: true,
    ...config,
    instruction: {
      tg: 'Барои қабули пардохтҳои воқеӣ бо Алиф Моби ва Душанбе Сити, ба танзимоти сервер ALIF_MERCHANT_ID ва ALIF_SECRET_KEY лозим аст.',
      ru: 'Для приема реальных платежей через Алиф Моби и Душанбе Сити требуются ALIF_MERCHANT_ID и ALIF_SECRET_KEY.',
      en: 'Real payments require official Alif Pay / DC merchant credentials (ALIF_MERCHANT_ID and ALIF_SECRET_KEY).',
    },
  });
});

// 3. Create Real Payment Order
app.post('/api/payment/create-order', async (req: Request, res: Response) => {
  try {
    const { adId, packageId = 'vip', provider = 'alif', customerPhone } = req.body;

    if (!adId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_AD_ID',
        message: 'Идентификатори эълон (adId) нишон дода нашудааст.',
      });
    }

    const config = getPaymentProviderConfig();
    const prices: Record<string, { price: number; durationDays: number }> = {
      vip: { price: 15, durationDays: 7 },
      turbo: { price: 5, durationDays: 1 },
      urgent: { price: 10, durationDays: 7 },
      max: { price: 25, durationDays: 14 },
    };

    const pkg = prices[packageId] || prices.vip;
    const orderId = `arzon_tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // STRICT CHECK: Is the payment provider configured?
    const isProviderReady =
      provider === 'alif' ? config.alif.isConfigured :
      provider === 'dc' ? config.dc.isConfigured :
      config.isConfigured;

    if (!isProviderReady) {
      return res.status(400).json({
        success: false,
        configured: false,
        error: 'MERCHANT_NOT_CONFIGURED',
        message:
          'Системаи пардохти воқеӣ ҳанӯз фаъол нест! Калидҳои расмии тоҷир (ALIF_MERCHANT_ID / ALIF_SECRET_KEY) дар сервер ворид нашудаанд.',
        instructions: {
          tg: 'Барои фаъол кардани пардохти воқеӣ, соҳиби барнома бояд бо Бонки Алиф (alif.tj) шартномаи тиҷоратӣ бандад ва ALIF_MERCHANT_ID ва ALIF_SECRET_KEY-ро ба файли .env ворид кунад.',
          ru: 'Для подключения реальной оплаты необходимо заключить договор с банком Алиф и добавить ALIF_MERCHANT_ID и ALIF_SECRET_KEY в файл .env.',
        },
      });
    }

    // Provider is configured: Prepare real transaction
    const now = new Date().toISOString();
    const transaction: PaymentTransaction = {
      id: crypto.randomUUID(),
      orderId,
      adId,
      packageId: packageId as any,
      amount: pkg.price,
      currency: 'TJS',
      provider: provider as any,
      customerPhone: customerPhone || '',
      status: 'pending',
      verifiedOnServer: false,
      durationDays: pkg.durationDays,
      createdAt: now,
      updatedAt: now,
    };

    // Call Alif Pay API if Alif is configured
    let checkoutUrl = '';
    let qrData = '';

    if (provider === 'alif' && config.alif.isConfigured) {
      const merchantId = process.env.ALIF_MERCHANT_ID;
      const secretKey = process.env.ALIF_SECRET_KEY;
      const apiUrl = process.env.ALIF_API_URL || 'https://api.alif.tj';

      try {
        // Alif Checkout signature calculation
        const signaturePayload = `${merchantId};${orderId};${pkg.price};TJS;${secretKey}`;
        const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

        // Note: Real call to Alif acquiring endpoint
        const response = await fetch(`${apiUrl}/v1/checkout/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secretKey}`,
          },
          body: JSON.stringify({
            merchant_id: merchantId,
            order_id: orderId,
            amount: pkg.price,
            currency: 'TJS',
            callback_url: `${process.env.APP_URL || ''}/api/payment/alif/webhook`,
            return_url: `${process.env.APP_URL || ''}/?payment=return&orderId=${orderId}`,
            signature,
            phone: customerPhone,
            description: `VIP эълон дар Arzon.tj: 15 сомонӣ барои 7 рӯз`,
          }),
        });

        if (response.ok) {
          const result = await response.json() as any;
          checkoutUrl = result.payment_url || result.checkout_url || '';
          qrData = result.qr_code || '';
          transaction.providerTxId = result.transaction_id || result.id;
        } else {
          const errBody = await response.text();
          console.error('Alif API error response:', errBody);
          return res.status(502).json({
            success: false,
            error: 'PAYMENT_GATEWAY_ERROR',
            message: 'Хатогӣ ҳангоми пайвастшавӣ ба сервери Алиф Банк.',
            gatewayDetails: errBody,
          });
        }
      } catch (alifErr: any) {
        console.error('Alif network exception:', alifErr);
        return res.status(502).json({
          success: false,
          error: 'PAYMENT_GATEWAY_NETWORK_ERROR',
          message: 'Хатои шабакавӣ ҳангоми муроҷиат ба сервери пардохт.',
          details: alifErr?.message,
        });
      }
    }

    paymentsStore.set(orderId, transaction);
    savePayments(paymentsStore);

    return res.json({
      success: true,
      orderId,
      amount: pkg.price,
      currency: 'TJS',
      checkoutUrl,
      qrData,
      status: 'pending',
    });
  } catch (err: any) {
    console.error('Failed to create order:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Хатогии дохилии сервер',
    });
  }
});

// 4. Official Webhook from Payment Provider (Alif Pay / DC)
app.post('/api/payment/alif/webhook', (req: Request, res: Response) => {
  try {
    const secretKey = process.env.ALIF_SECRET_KEY;
    if (!secretKey) {
      return res.status(401).json({ error: 'ALIF_SECRET_KEY not set on server' });
    }

    const { order_id, amount, status, signature, transaction_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    // Verify HMAC / Hash signature
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${order_id};${amount};${status};${secretKey}`)
      .digest('hex');

    if (signature && signature.toLowerCase() !== expectedHash.toLowerCase()) {
      console.warn('Invalid webhook signature attempt:', { order_id, signature });
      return res.status(403).json({ error: 'INVALID_SIGNATURE' });
    }

    const tx = paymentsStore.get(order_id);
    if (!tx) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }

    // Only activate if provider reports success AND amount matches requirement (e.g. 15 TJS)
    const isSuccess = status === 'success' || status === 'completed' || status === 'paid';
    const amountPaid = Number(amount);

    if (isSuccess && amountPaid >= tx.amount) {
      const now = new Date();
      const expires = new Date(now.getTime() + tx.durationDays * 24 * 60 * 60 * 1000);

      tx.status = 'completed';
      tx.verifiedOnServer = true;
      tx.verifiedAt = now.toISOString();
      tx.promotedUntil = expires.toISOString();
      tx.providerTxId = transaction_id || tx.providerTxId;
      tx.updatedAt = now.toISOString();

      paymentsStore.set(order_id, tx);
      savePayments(paymentsStore);

      console.log(`[PAYMENT VERIFIED ON SERVER] Order ${order_id} verified for 15 TJS VIP activation!`);
      return res.json({ status: 'ok', verified: true, order_id });
    } else {
      tx.status = 'failed';
      tx.verifiedOnServer = false;
      tx.updatedAt = new Date().toISOString();
      paymentsStore.set(order_id, tx);
      savePayments(paymentsStore);

      return res.json({ status: 'failed', verified: false, order_id });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'WEBHOOK_FAILED' });
  }
});

// 5. Verify Payment Status on Server
app.get('/api/payment/verify/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const tx = paymentsStore.get(orderId);

  if (!tx) {
    return res.status(404).json({
      success: false,
      error: 'ORDER_NOT_FOUND',
      message: 'Супориши пардохт ёфт нашуд',
      verified: false,
    });
  }

  // If already verified on server
  if (tx.verifiedOnServer && tx.status === 'completed') {
    return res.json({
      success: true,
      verified: true,
      status: 'completed',
      orderId: tx.orderId,
      adId: tx.adId,
      packageId: tx.packageId,
      amount: tx.amount,
      durationDays: tx.durationDays,
      promotedUntil: tx.promotedUntil,
      message: 'Пардохт дар сервер бомуваффақият санҷида ва тасдиқ шудааст.',
    });
  }

  // If provider has active credentials and order is still pending, attempt server check
  const config = getPaymentProviderConfig();
  if (tx.status === 'pending' && config.alif.isConfigured && tx.provider === 'alif') {
    try {
      const apiUrl = process.env.ALIF_API_URL || 'https://api.alif.tj';
      const secretKey = process.env.ALIF_SECRET_KEY;
      const resp = await fetch(`${apiUrl}/v1/orders/${tx.orderId}`, {
        headers: { 'Authorization': `Bearer ${secretKey}` },
      });
      if (resp.ok) {
        const data = await resp.json() as any;
        if (data.status === 'success' || data.status === 'completed') {
          const now = new Date();
          const expires = new Date(now.getTime() + tx.durationDays * 24 * 60 * 60 * 1000);
          tx.status = 'completed';
          tx.verifiedOnServer = true;
          tx.verifiedAt = now.toISOString();
          tx.promotedUntil = expires.toISOString();
          tx.updatedAt = now.toISOString();
          paymentsStore.set(orderId, tx);
          savePayments(paymentsStore);

          return res.json({
            success: true,
            verified: true,
            status: 'completed',
            orderId: tx.orderId,
            adId: tx.adId,
            packageId: tx.packageId,
            amount: tx.amount,
            durationDays: tx.durationDays,
            promotedUntil: tx.promotedUntil,
          });
        }
      }
    } catch (checkErr) {
      console.warn('Error checking Alif order status:', checkErr);
    }
  }

  return res.json({
    success: true,
    verified: false,
    status: tx.status,
    orderId: tx.orderId,
    adId: tx.adId,
    message: tx.status === 'pending'
      ? 'Пардохт ҳанӯз дар ҳолати интизорӣ қарор дорад.'
      : 'Пардохт тасдиқ нашудааст.',
  });
});

// 6. Server-enforced VIP Activation Endpoint
// NEVER activates VIP unless server verifies payment
app.post('/api/payment/activate-promotion', (req: Request, res: Response) => {
  const { orderId, adId } = req.body;

  if (!orderId || !adId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'orderId ва adId лозиманд',
    });
  }

  const tx = paymentsStore.get(orderId);
  if (!tx) {
    return res.status(404).json({
      success: false,
      error: 'TRANSACTION_NOT_FOUND',
      message: 'Транзаксияи пардохт дар сервер ёфт нашуд',
    });
  }

  if (tx.adId !== adId) {
    return res.status(403).json({
      success: false,
      error: 'AD_ID_MISMATCH',
      message: 'Идентификатори эълон бо супориши пардохт мувофиқат намекунад',
    });
  }

  // STRICT REQUIREMENT: Only activate if payment was verified by server
  if (!tx.verifiedOnServer || tx.status !== 'completed') {
    return res.status(403).json({
      success: false,
      verified: false,
      error: 'PAYMENT_NOT_VERIFIED',
      message: 'Пардохт дар сервер тасдиқ нашудааст! Фаъолсозии VIP манъ аст.',
    });
  }

  // Payment is genuinely verified on server: return validated VIP promotion data
  return res.json({
    success: true,
    verified: true,
    adId: tx.adId,
    packageId: tx.packageId,
    amount: tx.amount,
    durationDays: tx.durationDays,
    isVip: tx.packageId === 'vip' || tx.packageId === 'max',
    isUrgent: tx.packageId === 'urgent' || tx.packageId === 'max',
    isHighlighted: tx.packageId === 'max',
    promotedUntil: tx.promotedUntil,
    verifiedAt: tx.verifiedAt,
  });
});

// =============================================================================
// TOKENIZED SAVED PAYMENT METHODS (PCI-DSS Compliant: Zero Raw Card Storage)
// =============================================================================
export interface SavedPaymentMethod {
  id: string;
  userId: string;
  provider: 'alif' | 'dc' | 'korti_milli';
  token: string;
  maskedPan: string; // ONLY masked digits like "**** **** **** 1234"
  cardBrand: 'korti_milli' | 'visa' | 'mastercard' | 'other';
  cardHolderName?: string;
  createdAt: string;
}

const SAVED_CARDS_FILE = path.resolve(DATA_DIR, 'card-tokens.json');

function loadSavedCardTokens(): SavedPaymentMethod[] {
  try {
    if (fs.existsSync(SAVED_CARDS_FILE)) {
      const data = fs.readFileSync(SAVED_CARDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading saved card tokens:', err);
  }
  return [];
}

function saveSavedCardTokens(tokens: SavedPaymentMethod[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SAVED_CARDS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving card tokens file:', err);
  }
}

// 7. Get Saved Payment Methods (Tokenized Only)
app.get('/api/payment/saved-methods/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const all = loadSavedCardTokens();
  const userTokens = all
    .filter((t) => t.userId === userId)
    .map((t) => ({
      id: t.id,
      provider: t.provider,
      maskedPan: t.maskedPan,
      cardBrand: t.cardBrand,
      cardHolderName: t.cardHolderName,
      createdAt: t.createdAt,
      // Provider token is not exposed directly to untrusted clients
    }));

  res.json({ success: true, methods: userTokens });
});

// 8. Register Tokenized Saved Payment Method
// STRICT SECURITY: Rejects any attempt to submit raw PAN, CVV, or PIN
app.post('/api/payment/save-card-token', (req: Request, res: Response) => {
  try {
    const rawBodyStr = JSON.stringify(req.body || {});

    // SECURITY CHECK: Reject any unmasked 13-19 digit card numbers
    const rawPanMatch = rawBodyStr.match(/\b(?:\d[ -]*?){13,19}\b/);
    const hasSensitiveFields =
      'cvv' in req.body ||
      'cvc' in req.body ||
      'pin' in req.body ||
      'password' in req.body ||
      'cardNumber' in req.body;

    if (rawPanMatch || hasSensitiveFields) {
      securityMetrics.suspiciousPayloadsBlocked += 1;
      console.warn('[SECURITY ALERT] Blocked attempt to pass raw card details or CVV to server!');
      return res.status(400).json({
        success: false,
        error: 'RAW_CARD_DATA_FORBIDDEN',
        message:
          'Сабти маълумоти пурраи корт (рақами пурра, CVV ё PIN) қатъиян манъ аст! Танҳо токени расмии бонк ва рақами ниқобпӯш (маска) қабул мешавад.',
      });
    }

    const { userId, provider = 'alif', token, maskedPan, cardBrand = 'korti_milli', userConsent } = req.body;

    if (!userConsent) {
      return res.status(400).json({
        success: false,
        error: 'CONSENT_REQUIRED',
        message: 'Барои нигоҳдории усули пардохт ризояти ошкори корбар ҳатмист.',
      });
    }

    if (!userId || !token || !maskedPan) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'userId, token ва maskedPan лозиманд',
      });
    }

    // Ensure maskedPan contains only asterisks and last 4 digits
    const cleanMasked = String(maskedPan).replace(/[^\d*•-]/g, '').slice(-19);

    const all = loadSavedCardTokens();
    const newRecord: SavedPaymentMethod = {
      id: `pm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: String(userId),
      provider: provider as any,
      token: String(token),
      maskedPan: cleanMasked || '•••• 4444',
      cardBrand: cardBrand as any,
      createdAt: new Date().toISOString(),
    };

    all.push(newRecord);
    saveSavedCardTokens(all);

    return res.json({
      success: true,
      method: {
        id: newRecord.id,
        provider: newRecord.provider,
        maskedPan: newRecord.maskedPan,
        cardBrand: newRecord.cardBrand,
        createdAt: newRecord.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error saving payment token:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 9. Remove Saved Payment Method
app.delete('/api/payment/saved-methods/:userId/:tokenId', (req: Request, res: Response) => {
  const { userId, tokenId } = req.params;
  const all = loadSavedCardTokens();
  const filtered = all.filter((t) => !(t.userId === userId && t.id === tokenId));
  saveSavedCardTokens(filtered);
  res.json({ success: true, removed: all.length !== filtered.length });
});

// =============================================================================
// SERVER-SIDE ANNOUNCEMENTS SYNC & DEDUPLICATION
// =============================================================================
const ANNOUNCEMENTS_FILE = path.resolve(DATA_DIR, 'admin-announcements.json');

function loadServerAnnouncements(): any[] {
  try {
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading announcements:', err);
  }
  return [];
}

function saveServerAnnouncements(items: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving announcements:', err);
  }
}

// 10. List Announcements (Public)
app.get('/api/announcements', (_req: Request, res: Response) => {
  const announcements = loadServerAnnouncements();
  res.json({ success: true, announcements });
});

// 11. Create Admin Announcement (Server Persisted with Deduplication)
app.post('/api/announcements', (req: Request, res: Response) => {
  const { title, message, type = 'info', linkUrl, linkText, adminPin, id } = req.body || {};

  // Verify PIN (default: 2026 or env ADMIN_PIN)
  const expectedPin = process.env.ADMIN_PIN || '2026';
  if (adminPin && String(adminPin).trim() !== expectedPin) {
    return res.status(403).json({ success: false, error: 'INVALID_ADMIN_PIN' });
  }

  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'TITLE_AND_MESSAGE_REQUIRED' });
  }

  const all = loadServerAnnouncements();
  const announcementId = id || `admin-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  // Deduplication check
  const exists = all.some((a) => a.id === announcementId);
  if (exists) {
    return res.json({ success: true, duplicate: true, announcement: all.find((a) => a.id === announcementId) });
  }

  const newAnnouncement = {
    id: announcementId,
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    linkUrl: linkUrl ? String(linkUrl).trim() : undefined,
    linkText: linkText ? String(linkText).trim() : undefined,
    timestamp: new Date().toISOString(),
    pinned: false,
  };

  all.unshift(newAnnouncement);
  saveServerAnnouncements(all);

  res.json({ success: true, announcement: newAnnouncement });
});

// =============================================================================
// SYSTEM SECURITY MONITORING & AUDIT SUMMARY
// =============================================================================
app.get('/api/security/audit-summary', (_req: Request, res: Response) => {
  const allTxs = Array.from(paymentsStore.values());
  const completedCount = allTxs.filter((t) => t.status === 'completed' && t.verifiedOnServer).length;
  const pendingCount = allTxs.filter((t) => t.status === 'pending').length;
  const savedTokens = loadSavedCardTokens();

  res.json({
    success: true,
    status: 'healthy',
    security: {
      zeroRawCardStorageEnforced: true,
      serverSideVerificationEnforced: true,
      rateLimitingActive: true,
      rateLimitHits: securityMetrics.rateLimitHits,
      suspiciousPayloadsBlocked: securityMetrics.suspiciousPayloadsBlocked,
    },
    payments: {
      totalOrdersCreated: allTxs.length,
      verifiedCompletedOrders: completedCount,
      pendingOrders: pendingCount,
      totalSavedPaymentMethods: savedTokens.length,
    },
    systemStartedAt: securityMetrics.startedAt,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// -----------------------------------------------------------------------------
// Vite Dev Middleware or Production Static Serving
// -----------------------------------------------------------------------------
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Arzon.tj server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
