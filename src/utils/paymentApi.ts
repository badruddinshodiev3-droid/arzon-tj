/**
 * Arzon.tj Official Payment API Client
 * Interacts with backend server for Alif Pay / Dushanbe City acquiring
 */

export interface PaymentConfigResponse {
  success: boolean;
  isConfigured: boolean;
  alif: {
    isConfigured: boolean;
    merchantId: string | null;
    apiUrl: string;
  };
  dc: {
    isConfigured: boolean;
    merchantId: string | null;
    apiUrl: string;
  };
  pricing: {
    vip: { price: number; durationDays: number; currency: string };
    turbo: { price: number; durationDays: number; currency: string };
    urgent: { price: number; durationDays: number; currency: string };
    max: { price: number; durationDays: number; currency: string };
  };
  instruction?: {
    tg: string;
    ru: string;
    en: string;
  };
}

export interface CreateOrderResult {
  success: boolean;
  configured?: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  checkoutUrl?: string;
  qrData?: string;
  status?: string;
  error?: string;
  message?: string;
  instructions?: {
    tg: string;
    ru: string;
  };
}

export interface VerifyOrderResult {
  success: boolean;
  verified: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  orderId?: string;
  adId?: string;
  packageId?: string;
  amount?: number;
  durationDays?: number;
  promotedUntil?: string;
  message?: string;
}

export interface ActivatePromotionResult {
  success: boolean;
  verified: boolean;
  adId?: string;
  packageId?: string;
  isVip?: boolean;
  isUrgent?: boolean;
  isHighlighted?: boolean;
  promotedUntil?: string;
  error?: string;
  message?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchPaymentConfig(): Promise<PaymentConfigResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/config`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch payment config from server:', err);
    return null;
  }
}

export async function createPaymentOrder(params: {
  adId: string;
  packageId: string;
  provider: 'alif' | 'dc' | 'korti_milli';
  customerPhone?: string;
}): Promise<CreateOrderResult> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err?.message || 'Хатогии шабакавӣ ҳангоми тамос бо сервер',
    };
  }
}

export async function verifyPaymentOrder(orderId: string): Promise<VerifyOrderResult> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/verify/${encodeURIComponent(orderId)}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      status: 'failed',
      message: err?.message || 'Санҷиши ҳолати пардохт ноком шуд',
    };
  }
}

export async function activateServerPromotion(params: {
  orderId: string;
  adId: string;
}): Promise<ActivatePromotionResult> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/activate-promotion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      error: 'NETWORK_ERROR',
      message: err?.message || 'Фаъолсозии эълон ноком шуд',
    };
  }
}
