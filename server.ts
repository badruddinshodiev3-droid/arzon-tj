import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Parse JSON bodies
app.use(express.json());

// Direct project backup ZIP download endpoint
app.get('/api/download-latest-zip', (_req: Request, res: Response) => {
  const zipFile = path.resolve(__dirname, 'public/arzon-tj-latest.zip');
  if (fs.existsSync(zipFile)) {
    res.download(zipFile, 'arzon-tj-latest.zip');
  } else {
    res.status(404).send('ZIP file not found');
  }
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

const DATA_DIR = path.resolve(__dirname, '.data');
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
