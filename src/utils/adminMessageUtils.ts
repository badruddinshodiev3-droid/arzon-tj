import { AdminAnnouncement } from '../types';
import { getSupabase, isSupabaseConfigured, getApiBaseUrl } from './supabaseClient';

const STORAGE_KEY = 'arzontj_admin_announcements';
const READ_KEY_PREFIX = 'arzontj_admin_read_';
export const ADMIN_ANNOUNCEMENTS_EVENT = 'arzontj_admin_announcements_changed';

export const INITIAL_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: 'announcement-welcome',
    title: 'Хуш омадед ба Arzon.tj! 🌟',
    message:
      'Ба бузургтарин майдончаи эълонҳои ройгони Тоҷикистон хуш омадед! Дар ин ҷо метавонед бевосита дар чати зинда бо фурӯшандагон муошират кунед, нархҳоро муқоиса намоед ва эълони худро дар 1 дақиқа ройгон нашр созед.',
    timestamp: '2026-10-25T08:00:00.000Z',
    type: 'info',
    linkUrl: '#catalog',
    linkText: 'Гузариш ба каталог',
    pinned: true,
  },
  {
    id: 'announcement-safety',
    title: 'Огоҳии муҳими амниятӣ: Бехатар харидорӣ кунед! 🛡️',
    message:
      'Ҳеҷ гоҳ пешпардохт накунед ва рақам ё рамзи пинҳонии корти бонкии худро (SMS-код) ба касе нафиристед. Молро ҳатман дар ҷои ҷамъиятӣ шахсан аз назар гузаронида, танҳо пас аз итминон маблағро пардохт намоед.',
    timestamp: '2026-10-25T14:30:00.000Z',
    type: 'security',
    linkUrl: '#safety',
    linkText: 'Қоидаҳои бехатарӣ',
  },
  {
    id: 'announcement-vip',
    title: 'Хизматрасониҳои VIP ва фурӯши босуръат 🚀',
    message:
      'Мехоҳед моли худро 3 маротиба тезтар фурӯшед? Бо хизматрасониҳои VIP, эълони шумо дар сархати сомона ҷойгир шуда, аз ҷониби ҳазорон харидорон дида мешавад.',
    timestamp: '2026-10-26T06:00:00.000Z',
    type: 'promo',
    linkUrl: '#monetize',
    linkText: 'Дидани хизматҳои VIP',
  },
];

export function getStoredAdminAnnouncements(): AdminAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    return parsed;
  } catch (err) {
    console.warn('Error reading admin announcements:', err);
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveStoredAdminAnnouncements(items: AdminAnnouncement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(ADMIN_ANNOUNCEMENTS_EVENT, { detail: items }));
  } catch (err) {
    console.error('Error saving admin announcements:', err);
  }
}

export function getAdminReadIds(userId: string): string[] {
  try {
    const key = `${READ_KEY_PREFIX}${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markAdminAnnouncementsAsRead(userId: string): void {
  try {
    const announcements = getStoredAdminAnnouncements();
    const allIds = announcements.map((a) => a.id);
    const key = `${READ_KEY_PREFIX}${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(allIds));
    window.dispatchEvent(new CustomEvent(ADMIN_ANNOUNCEMENTS_EVENT));
  } catch (err) {
    console.warn('Error marking admin announcements read:', err);
  }
}

export function getAdminUnreadCount(userId: string): number {
  try {
    const announcements = getStoredAdminAnnouncements();
    const readIds = new Set(getAdminReadIds(userId));
    return announcements.filter((a) => !readIds.has(a.id)).length;
  } catch {
    return 0;
  }
}

export async function syncServerAnnouncements(): Promise<void> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/announcements`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
      const local = getStoredAdminAnnouncements();
      const existingIds = new Set(local.map((a) => a.id));
      let hasNew = false;
      const merged = [...local];
      for (const ann of data.announcements) {
        if (!existingIds.has(ann.id)) {
          merged.unshift(ann);
          existingIds.add(ann.id);
          hasNew = true;
        }
      }
      if (hasNew) {
        saveStoredAdminAnnouncements(merged);
      }
    }
  } catch (err) {
    // Quiet fallback
  }
}

export async function addAdminAnnouncement(
  data: Omit<AdminAnnouncement, 'id' | 'timestamp'>
): Promise<AdminAnnouncement> {
  const newAnnouncement: AdminAnnouncement = {
    ...data,
    id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const current = getStoredAdminAnnouncements();
  const updated = [newAnnouncement, ...current];
  saveStoredAdminAnnouncements(updated);

  // Sync to server database
  try {
    fetch(`${getApiBaseUrl()}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newAnnouncement,
        adminPin: '2026',
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // Broadcast via Supabase Realtime if connected
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const channel = supabase.channel('admin_broadcasts');
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'new_announcement',
              payload: newAnnouncement,
            });
          }
        });
      }
    } catch (err) {
      console.warn('Supabase admin broadcast error:', err);
    }
  }

  return newAnnouncement;
}

export function deleteAdminAnnouncement(id: string): void {
  const current = getStoredAdminAnnouncements();
  const updated = current.filter((a) => a.id !== id);
  saveStoredAdminAnnouncements(updated);
}

// Live subscription across devices for admin announcements
export function subscribeToAdminAnnouncements(
  onNew: (announcement: AdminAnnouncement) => void
): () => void {
  // Listen for local tab events
  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<AdminAnnouncement[]>;
    if (custom.detail && custom.detail.length > 0) {
      onNew(custom.detail[0]);
    }
  };
  window.addEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleLocal);

  // Listen for Supabase Realtime broadcast across different devices
  let cleanupSupabase = () => {};
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const channel = supabase.channel('admin_broadcasts');
        channel
          .on('broadcast', { event: 'new_announcement' }, (payload) => {
            if (payload && payload.payload) {
              const incoming = payload.payload as AdminAnnouncement;
              const current = getStoredAdminAnnouncements();
              if (!current.some((a) => a.id === incoming.id)) {
                saveStoredAdminAnnouncements([incoming, ...current]);
                onNew(incoming);
              }
            }
          })
          .subscribe();

        cleanupSupabase = () => {
          supabase.removeChannel(channel);
        };
      }
    } catch (err) {
      console.warn('Admin subscription error:', err);
    }
  }

  return () => {
    window.removeEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleLocal);
    cleanupSupabase();
  };
}
