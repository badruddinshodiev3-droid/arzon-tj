import { ChatMessage, Conversation, ProductAd, UserProfile } from '../types';
import { getSupabase, isSupabaseConfigured, ensureSupabaseAuthSession, getApiBaseUrl } from './supabaseClient';

export const CHAT_STORAGE_KEY = 'arzontj_conversations_v3';
export const CHAT_EVENT_NAME = 'arzontj:chat-update';

// No simulated or fake seller conversations.
const SEED_CONVERSATIONS: Conversation[] = [];

// Module-level in-flight debounce lock to prevent duplicate sends across rapid clicks/events
let lastSentMessageKey = '';
let lastSentMessageTime = 0;

/**
 * Strictly deduplicates messages within a conversation:
 * 1. Drops any messages with identical IDs
 * 2. Drops accidental duplicate submissions (same sender + identical text within 8 seconds)
 * 3. Preserves legitimate messages sent at different times or with different content
 */
export function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  const map = new Map<string, ChatMessage>();
  const clean: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg || (!msg.text?.trim() && !msg.imageUrl)) continue;

    // 1. Strict unique ID check with update preservation
    if (msg.id) {
      const existing = map.get(msg.id);
      if (existing) {
        // If incoming duplicate has newer/updated flags (e.g. isRead: true), update the kept instance
        if (!existing.isRead && msg.isRead) {
          existing.isRead = true;
        }
        if (msg.status && msg.status !== 'sending') {
          existing.status = msg.status;
        }
        continue;
      }
    }

    // 2. Accidental rapid duplicate check (same sender + identical text within 8 seconds)
    const isRapidDuplicate = clean.some((prev) => {
      if (prev.senderId !== msg.senderId) return false;
      if (prev.text?.trim() !== msg.text?.trim()) return false;
      if (prev.imageUrl || msg.imageUrl) return false;
      const t1 = new Date(msg.timestamp).getTime();
      const t2 = new Date(prev.timestamp).getTime();
      return !isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 8000;
    });

    if (isRapidDuplicate) continue;

    if (msg.id) map.set(msg.id, msg);
    clean.push(msg);
  }

  return clean;
}

/**
 * Merges existing messages with incoming updates, strictly preserving read states
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(existing)) existing = [];
  if (!Array.isArray(incoming)) incoming = [];

  const map = new Map<string, ChatMessage>();

  for (const m of existing) {
    if (m && m.id) {
      map.set(m.id, { ...m });
    }
  }

  for (const m of incoming) {
    if (!m || !m.id) continue;
    const prev = map.get(m.id);
    if (prev) {
      map.set(m.id, {
        ...prev,
        ...m,
        // Crucial: Once a message is marked as read anywhere, it stays read!
        isRead: Boolean(prev.isRead || m.isRead),
        status: m.status && m.status !== 'sending' ? m.status : prev.status,
      });
    } else {
      map.set(m.id, { ...m });
    }
  }

  return deduplicateMessages(Array.from(map.values()));
}

/**
 * Gets all saved conversations from localStorage with strict deduplication
 */
export function getStoredConversations(): Conversation[] {
  try {
    let raw = localStorage.getItem(CHAT_STORAGE_KEY);

    // Migrate from v2 or v1 if v3 is not yet populated
    if (!raw) {
      const v2Raw = localStorage.getItem('arzontj_conversations_v2');
      const v1Raw = localStorage.getItem('arzontj_conversations_v1');
      const candidateRaw = v2Raw || v1Raw;

      if (candidateRaw) {
        try {
          const parsedCandidate = JSON.parse(candidateRaw);
          if (Array.isArray(parsedCandidate) && parsedCandidate.length > 0) {
            const cleaned = parsedCandidate
              .filter((c: Conversation) => c && c.id && !c.id.startsWith('conv-demo-'))
              .map((c: Conversation) => ({
                ...c,
                messages: deduplicateMessages(c.messages || []),
                unreadCountForUser:
                  c.unreadCountForUser && typeof c.unreadCountForUser === 'object'
                    ? c.unreadCountForUser
                    : { [c.buyerId || 'guest-buyer']: 0, [c.sellerId || 'seller']: 0 },
                adImage: c.adImage?.includes('unsplash')
                  ? '/images/ad_toyota_camry_1792056773231.jpg'
                  : c.adImage,
              }));

            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
        } catch {
          // ignore
        }
      }
      return SEED_CONVERSATIONS;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return SEED_CONVERSATIONS;
    }

    const deduplicated = parsed
      .filter((c: Conversation) => c && c.id && !c.id.startsWith('conv-demo-'))
      .map((c: Conversation) => ({
        ...c,
        messages: deduplicateMessages(c.messages || []),
        unreadCountForUser:
          c.unreadCountForUser && typeof c.unreadCountForUser === 'object'
            ? c.unreadCountForUser
            : { [c.buyerId || 'guest-buyer']: 0, [c.sellerId || 'seller']: 0 },
      }));

    return deduplicated;
  } catch {
    return SEED_CONVERSATIONS;
  }
}

/**
 * Saves conversations to localStorage and dispatches sync event
 */
export function saveConversations(convs: Conversation[]): void {
  try {
    const cleanedConvs = convs.map((c) => ({
      ...c,
      messages: deduplicateMessages(c.messages || []),
    }));
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanedConvs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHAT_EVENT_NAME, { detail: cleanedConvs }));
    }
  } catch (e) {
    console.error('Failed to save chat conversations', e);
  }
}

/**
 * Generates or retrieves a persistent guest ID for users not yet logged in
 */
export function getDeviceGuestId(): string {
  try {
    if (typeof localStorage === 'undefined') return 'guest-buyer';
    let gid = localStorage.getItem('arzontj_guest_id');
    if (!gid) {
      gid = `guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('arzontj_guest_id', gid);
    }
    return gid;
  } catch {
    return 'guest-buyer';
  }
}

/**
 * Normalizes user and seller IDs consistently across both phones
 */
export function normalizeUserId(rawIdOrPhone?: string | null): string {
  if (!rawIdOrPhone) return getDeviceGuestId();
  const trimmed = String(rawIdOrPhone).trim();
  if (trimmed.startsWith('guest-')) return trimmed;
  if (trimmed === 'guest-buyer') return getDeviceGuestId();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 9) return `user-992${digits}`;
  if (digits.length >= 12 && digits.startsWith('992')) return `user-${digits}`;
  if (digits.length >= 9) return `user-${digits}`;
  return trimmed;
}

/**
 * Synchronizes conversations and messages from backend server relay
 */
export async function syncFromBackendServer(userId: string): Promise<Conversation[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/chat/sync?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.conversations) && data.conversations.length > 0) {
        const local = getStoredConversations();
        const merged: Conversation[] = [...local];

        for (const remote of data.conversations) {
          const idx = merged.findIndex((l) => l.id === remote.id);
          if (idx >= 0) {
            const localMsgs = merged[idx].messages || [];
            const remoteMsgs = remote.messages || [];
            const combined = mergeMessages(localMsgs, remoteMsgs);
            merged[idx] = {
              ...merged[idx],
              ...remote,
              messages: combined,
              lastMessageText: combined[combined.length - 1]?.text || remote.lastMessageText || merged[idx].lastMessageText,
              lastMessageTimestamp: combined[combined.length - 1]?.timestamp || remote.lastMessageTimestamp || merged[idx].lastMessageTimestamp,
              updatedAt: remote.updatedAt || merged[idx].updatedAt,
            };
          } else {
            merged.push({
              ...remote,
              messages: deduplicateMessages(remote.messages || []),
            });
          }
        }
        saveConversations(merged);
        return merged;
      }
    }
  } catch {
    // ignore
  }
  return getStoredConversations();
}

/**
 * Fetches conversations and messages from Supabase shared database (and backend relay)
 */
export async function syncConversationsFromSupabase(userId: string): Promise<Conversation[]> {
  // Always query backend relay as well
  syncFromBackendServer(userId).catch(() => {});

  const normalizedId = normalizeUserId(userId);
  const supabase = getSupabase(normalizedId);
  if (!supabase) return syncFromBackendServer(userId);

  try {
    const cleanDigits = userId.replace(/\D/g, '');
    const candidateIds = Array.from(
      new Set(
        [
          userId,
          normalizedId,
          cleanDigits.length >= 9 ? `user-${cleanDigits}` : null,
          cleanDigits.length >= 9 ? cleanDigits : null,
          cleanDigits.length >= 9 ? `+${cleanDigits}` : null,
        ].filter(Boolean) as string[]
      )
    );

    // Query recent conversations so both buyer & seller devices stay in sync
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (convError || !convData) {
      if (convError && !convError.message?.includes('schema cache') && convError.code !== 'PGRST205') {
        console.warn('Could not fetch conversations from Supabase:', convError);
      }
      return getStoredConversations();
    }

    if (convData.length === 0) {
      return getStoredConversations();
    }

    const convIds = convData.map((c: any) => c.id);

    // Query messages for these conversations
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('timestamp', { ascending: true });

    if (msgError) {
      console.warn('Could not fetch messages from Supabase:', msgError);
    }

    const messagesByConv: Record<string, ChatMessage[]> = {};
    if (msgData) {
      for (const m of msgData) {
        if (!messagesByConv[m.conversation_id]) {
          messagesByConv[m.conversation_id] = [];
        }
        messagesByConv[m.conversation_id].push({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name || 'Корбар',
          text: m.text || m.content || '',
          imageUrl: m.image_url || undefined,
          timestamp: m.timestamp || m.created_at || new Date().toISOString(),
          isRead: Boolean(m.is_read),
          status: 'sent',
        });
      }
    }

    // Merge with local storage
    const local = getStoredConversations();
    const merged: Conversation[] = convData.map((remoteConv: any) => {
      const localMatch = local.find((l) => l.id === remoteConv.id);
      const remoteMsgs = messagesByConv[remoteConv.id] || [];
      const combinedMsgs = mergeMessages(
        localMatch ? localMatch.messages : [],
        remoteMsgs
      );

      return {
        id: remoteConv.id,
        adId: remoteConv.ad_id,
        adTitle: remoteConv.ad_title,
        adPrice: Number(remoteConv.ad_price),
        adImage: remoteConv.ad_image || '',
        buyerId: remoteConv.buyer_id,
        buyerName: remoteConv.buyer_name,
        sellerId: remoteConv.seller_id,
        sellerName: remoteConv.seller_name,
        sellerPhone: remoteConv.seller_phone || undefined,
        messages: combinedMsgs,
        lastMessageText: remoteConv.last_message_text || '',
        lastMessageTimestamp: remoteConv.last_message_timestamp || new Date().toISOString(),
        unreadCountForUser: {
          [remoteConv.buyer_id]: combinedMsgs.filter(
            (m) => normalizeUserId(m.senderId) !== normalizeUserId(remoteConv.buyer_id) && !m.isRead
          ).length,
          [remoteConv.seller_id]: combinedMsgs.filter(
            (m) => normalizeUserId(m.senderId) !== normalizeUserId(remoteConv.seller_id) && !m.isRead
          ).length,
        },
        updatedAt: remoteConv.updated_at || new Date().toISOString(),
      };
    });

    // Add any local-only conversations not yet in Supabase
    for (const l of local) {
      if (!merged.some((m) => m.id === l.id)) {
        merged.push(l);
      }
    }

    saveConversations(merged);
    return merged;
  } catch (err) {
    console.error('Error syncing from Supabase:', err);
    return getStoredConversations();
  }
}

/**
 * Global Realtime broadcast channel name for instant cross-device delivery
 */
export const CHAT_BROADCAST_CHANNEL = 'arzon-chat-live-broadcast';

let activeRealtimeChannel: any = null;

// Registry of active listeners to prevent duplicate subscriptions or leaks
type MessageListener = (msg: ChatMessage, convId: string) => void;
type UpdateListener = () => void;

const activeMessageListeners = new Set<MessageListener>();
const activeUpdateListeners = new Set<UpdateListener>();
let isRealtimeSubscribed = false;

/**
 * Resets the Realtime subscription state so it reconnects with new credentials or clients
 */
export function resetRealtimeSubscription() {
  if (activeRealtimeChannel) {
    try {
      activeRealtimeChannel.unsubscribe();
    } catch {}
    activeRealtimeChannel = null;
  }
  isRealtimeSubscribed = false;
}

/**
 * Returns or creates the singleton shared Realtime channel for live cross-device delivery
 */
export function getSharedRealtimeChannel(supabase: any) {
  if (!activeRealtimeChannel) {
    activeRealtimeChannel = supabase.channel(CHAT_BROADCAST_CHANNEL, {
      config: {
        broadcast: { ack: true, self: false },
      },
    });
  }
  return activeRealtimeChannel;
}

/**
 * Polls & reconciles any recent messages from Supabase (and backend relay) for the active conversation
 */
export async function syncActiveConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  // Always query backend relay in background for cross-device message updates
  syncFromBackendServer(conversationId).catch(() => {});

  const supabase = getSupabase();
  if (!supabase) {
    const convs = getStoredConversations();
    const conv = convs.find((c) => c.id === conversationId);
    return conv ? conv.messages : [];
  }

  try {
    const { data: remoteMsgs, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error || !remoteMsgs || remoteMsgs.length === 0) return [];

    const convs = getStoredConversations();
    const convIndex = convs.findIndex((c) => c.id === conversationId);
    let conv = convIndex >= 0 ? convs[convIndex] : null;
    if (!conv) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (convData) {
        conv = {
          id: convData.id,
          adId: convData.ad_id,
          adTitle: convData.ad_title,
          adPrice: Number(convData.ad_price || 0),
          adImage: convData.ad_image || '',
          buyerId: convData.buyer_id,
          buyerName: convData.buyer_name,
          sellerId: convData.seller_id,
          sellerName: convData.seller_name,
          sellerPhone: convData.seller_phone || '',
          messages: [],
          lastMessageText: convData.last_message_text || '',
          lastMessageTimestamp: convData.last_message_timestamp || new Date().toISOString(),
          unreadCountForUser: {},
          updatedAt: convData.updated_at || new Date().toISOString(),
        };
      } else {
        return [];
      }
    }
    const mapped: ChatMessage[] = remoteMsgs.map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name || 'Корбар',
      text: m.text || m.content || '',
      imageUrl: m.image_url || undefined,
      timestamp: m.timestamp || m.created_at || new Date().toISOString(),
      isRead: Boolean(m.is_read),
      status: 'sent',
    }));

    const combined = mergeMessages(conv.messages, mapped);
    const hasChanges =
      combined.length !== conv.messages.length ||
      combined.some((m, idx) => {
        const oldM = conv.messages[idx];
        return !oldM || oldM.status !== m.status || oldM.isRead !== m.isRead || oldM.id !== m.id;
      });

    if (hasChanges) {
      const updated: Conversation = {
        ...conv,
        messages: combined,
        lastMessageText: combined[combined.length - 1]?.text || conv.lastMessageText,
        lastMessageTimestamp: combined[combined.length - 1]?.timestamp || conv.lastMessageTimestamp,
        updatedAt: new Date().toISOString(),
      };
      const newConvs = [updated, ...convs.filter((c) => c.id !== conversationId)];
      saveConversations(newConvs);
      return combined;
    }
    return conv.messages;
  } catch (err) {
    console.warn('syncActiveConversationMessages error:', err);
    return [];
  }
}

/**
 * Sets up Realtime WebSocket subscription for live cross-device delivery
 * Combines Postgres changes and Supabase Realtime Broadcast for instant delivery.
 */
export function subscribeToLiveChat(
  userId: string,
  onNewMessage: (msg: ChatMessage, convId: string) => void,
  onChatUpdate?: () => void
): () => void {
  const normalizedUserId = normalizeUserId(userId);
  const supabase = getSupabase(normalizedUserId);

  activeMessageListeners.add(onNewMessage);
  if (onChatUpdate) {
    activeUpdateListeners.add(onChatUpdate);
  }

  if (!supabase) {
    return () => {
      activeMessageListeners.delete(onNewMessage);
      if (onChatUpdate) activeUpdateListeners.delete(onChatUpdate);
    };
  }

  try {
    const cleanDigits = userId.replace(/\D/g, '');
    const candidateIds = Array.from(
      new Set(
        [
          userId,
          normalizedUserId,
          cleanDigits.length >= 9 ? `user-${cleanDigits}` : null,
          cleanDigits.length >= 9 ? cleanDigits : null,
          cleanDigits.length >= 9 ? `+${cleanDigits}` : null,
          'guest-buyer',
        ].filter(Boolean) as string[]
      )
    );

    const isUserParticipant = (buyerId?: string, sellerId?: string, senderId?: string): boolean => {
      if (!buyerId && !sellerId) return true;
      return candidateIds.some(
        (id) =>
          (buyerId && normalizeUserId(buyerId) === id) ||
          (sellerId && normalizeUserId(sellerId) === id) ||
          (senderId && normalizeUserId(senderId) === id) ||
          buyerId === id ||
          sellerId === id ||
          senderId === id
      );
    };

    const processIncomingChatMessage = async (
      chatMsg: ChatMessage,
      conversationId: string,
      fallbackConvData?: any
    ) => {
      const convs = getStoredConversations();
      const convIndex = convs.findIndex((c) => c.id === conversationId);

      if (convIndex >= 0) {
        const conv = convs[convIndex];
        const existingMsgIndex = conv.messages.findIndex((m) => m.id === chatMsg.id);
        let updatedMessages: ChatMessage[];
        if (existingMsgIndex >= 0) {
          const prevMsg = conv.messages[existingMsgIndex];
          updatedMessages = [...conv.messages];
          updatedMessages[existingMsgIndex] = {
            ...prevMsg,
            ...chatMsg,
            isRead: Boolean(prevMsg.isRead || chatMsg.isRead),
          };
        } else {
          updatedMessages = mergeMessages(conv.messages, [chatMsg]);
        }

        const isIncoming = normalizeUserId(chatMsg.senderId) !== normalizedUserId;
        const currentUnread = (conv.unreadCountForUser && conv.unreadCountForUser[normalizedUserId]) || 0;

        const updated: Conversation = {
          ...conv,
          messages: updatedMessages,
          lastMessageText: chatMsg.imageUrl && !chatMsg.text ? '📷 Сурат / Фото' : (chatMsg.text || conv.lastMessageText),
          lastMessageTimestamp: chatMsg.timestamp,
          unreadCountForUser: {
            ...conv.unreadCountForUser,
            [normalizedUserId]: isIncoming && !chatMsg.isRead && existingMsgIndex < 0 ? currentUnread + 1 : currentUnread,
          },
          updatedAt: chatMsg.timestamp,
        };

        const newConvs = [updated, ...convs.filter((c) => c.id !== conversationId)];
        saveConversations(newConvs);
      } else {
        // Conversation not found locally - fetch from Supabase or use fallback
        let remoteConv = fallbackConvData;
        if (!remoteConv || !remoteConv.buyerId) {
          const { data } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .maybeSingle();
          if (data) {
            remoteConv = data;
          }
        }

        if (remoteConv) {
          const freshConvs = getStoredConversations();
          const existingIdx = freshConvs.findIndex((c) => c.id === (remoteConv.id || conversationId));
          const buyerId = remoteConv.buyer_id || remoteConv.buyerId || 'buyer';
          const sellerId = remoteConv.seller_id || remoteConv.sellerId || 'seller';
          const builtConv: Conversation = {
            id: remoteConv.id || conversationId,
            adId: remoteConv.ad_id || remoteConv.adId || 'ad',
            adTitle: remoteConv.ad_title || remoteConv.adTitle || 'Эълон',
            adPrice: Number(remoteConv.ad_price || remoteConv.adPrice || 0),
            adImage: remoteConv.ad_image || remoteConv.adImage || '',
            buyerId,
            buyerName: remoteConv.buyer_name || remoteConv.buyerName || 'Харидор',
            sellerId,
            sellerName: remoteConv.seller_name || remoteConv.sellerName || 'Фурӯшанда',
            sellerPhone: remoteConv.seller_phone || remoteConv.sellerPhone || undefined,
            messages: [chatMsg],
            lastMessageText: chatMsg.imageUrl && !chatMsg.text ? '📷 Сурат / Фото' : (chatMsg.text || remoteConv.last_message_text || ''),
            lastMessageTimestamp: chatMsg.timestamp,
            unreadCountForUser: {
              [buyerId]: normalizeUserId(chatMsg.senderId) === normalizeUserId(buyerId) ? 0 : 1,
              [sellerId]: normalizeUserId(chatMsg.senderId) === normalizeUserId(sellerId) ? 0 : 1,
            },
            updatedAt: chatMsg.timestamp,
          };

          if (existingIdx >= 0) {
            freshConvs[existingIdx] = builtConv;
          } else {
            freshConvs.unshift(builtConv);
          }
          saveConversations(freshConvs);
        } else {
          await syncConversationsFromSupabase(userId);
        }
      }

      for (const cb of activeMessageListeners) {
        try {
          cb(chatMsg, conversationId);
        } catch {
          // ignore
        }
      }

      for (const cb of activeUpdateListeners) {
        try {
          cb();
        } catch {
          // ignore
        }
      }
    };

    // Initialize Realtime subscription once on shared singleton channel
    if (!isRealtimeSubscribed) {
      const channel = getSharedRealtimeChannel(supabase);

      // 1. Fast Realtime Broadcast listener (sub-50ms cross-device delivery)
      channel.on('broadcast', { event: 'new_message' }, async (payload: any) => {
        const data = payload?.payload;
        if (!data || !data.message || !data.conversationId) return;

        await processIncomingChatMessage(data.message, data.conversationId, data);
      });

      // 2. Realtime Broadcast listener for read receipts (instant second checkmark)
      channel.on('broadcast', { event: 'messages_read' }, (payload: any) => {
        const data = payload?.payload;
        if (!data || !data.conversationId) return;

        const convs = getStoredConversations();
        const convIndex = convs.findIndex((c) => c.id === data.conversationId);
        if (convIndex >= 0) {
          const conv = convs[convIndex];
          let updatedAny = false;
          const updatedMessages = conv.messages.map((m) => {
            if (normalizeUserId(m.senderId) !== normalizeUserId(data.readerId) && !m.isRead) {
              updatedAny = true;
              return { ...m, isRead: true };
            }
            return m;
          });

          if (updatedAny) {
            const updatedConv = { ...conv, messages: updatedMessages };
            const newConvs = [...convs];
            newConvs[convIndex] = updatedConv;
            saveConversations(newConvs);

            for (const cb of activeUpdateListeners) {
              try {
                cb();
              } catch {
                // ignore
              }
            }
          }
        }
      });

      // 3. Postgres changes listener on messages table (handling both INSERT and UPDATE)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as any;
            if (!updatedRow || !updatedRow.id || !updatedRow.conversation_id) return;

            const convs = getStoredConversations();
            const convIndex = convs.findIndex((c) => c.id === updatedRow.conversation_id);
            if (convIndex >= 0) {
              const conv = convs[convIndex];
              const msgIndex = conv.messages.findIndex((m) => m.id === updatedRow.id);
              if (msgIndex >= 0) {
                const prev = conv.messages[msgIndex];
                const newIsRead = Boolean(updatedRow.is_read);
                if (prev.isRead !== newIsRead) {
                  const updatedMessages = [...conv.messages];
                  updatedMessages[msgIndex] = {
                    ...prev,
                    isRead: newIsRead,
                  };
                  const updatedConv = { ...conv, messages: updatedMessages };
                  const newConvs = [...convs];
                  newConvs[convIndex] = updatedConv;
                  saveConversations(newConvs);

                  for (const cb of activeUpdateListeners) {
                    try {
                      cb();
                    } catch {
                      // ignore
                    }
                  }
                }
              }
            }
          } else if (payload.eventType === 'INSERT') {
            const newMsgRow = payload.new as any;
            if (!newMsgRow || !newMsgRow.id) return;

            const chatMsg: ChatMessage = {
              id: newMsgRow.id,
              senderId: newMsgRow.sender_id,
              senderName: newMsgRow.sender_name || 'Корбар',
              text: newMsgRow.text || newMsgRow.content || '',
              imageUrl: newMsgRow.image_url || undefined,
              timestamp: newMsgRow.timestamp || newMsgRow.created_at || new Date().toISOString(),
              isRead: Boolean(newMsgRow.is_read),
              status: 'sent',
            };

            await processIncomingChatMessage(chatMsg, newMsgRow.conversation_id);
          }
        }
      );

      // 3. Postgres changes listener on conversations table
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          syncConversationsFromSupabase(userId).then(() => {
            for (const cb of activeUpdateListeners) {
              try {
                cb();
              } catch {
                // ignore
              }
            }
          });
        }
      );

      channel.subscribe((status: string, err?: any) => {
        if (status === 'SUBSCRIBED') {
          // Connected successfully to Realtime
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime] Channel subscription error/timeout:', status, err);
          resetRealtimeSubscription();
        }
      });
      isRealtimeSubscribed = true;
    }

    return () => {
      activeMessageListeners.delete(onNewMessage);
      if (onChatUpdate) activeUpdateListeners.delete(onChatUpdate);
    };
  } catch (err) {
    console.warn('Realtime subscription failed:', err);
    return () => {
      activeMessageListeners.delete(onNewMessage);
      if (onChatUpdate) activeUpdateListeners.delete(onChatUpdate);
    };
  }
}

/**
 * Finds or creates a new conversation between buyer and seller for an ad
 */
export function getOrCreateConversation(
  ad: ProductAd,
  currentUser: UserProfile | null
): Conversation {
  const currentUserId = normalizeUserId(currentUser?.id || getDeviceGuestId());
  const currentUserName = currentUser?.name || 'Шумо (Харидор)';
  const sellerId = normalizeUserId(
    ad.sellerId ||
    (ad.phone ? `user-${ad.phone.replace(/\D/g, '')}` : `seller-${ad.id}`)
  );
  const sellerName = ad.sellerName || 'Фурӯшанда';

  const convs = getStoredConversations();

  // 1. Find existing conversation for this ad and participant pair
  let existing = convs.find(
    (c) =>
      c.adId === ad.id &&
      ((normalizeUserId(c.buyerId) === currentUserId && normalizeUserId(c.sellerId) === sellerId) ||
        (normalizeUserId(c.buyerId) === sellerId && normalizeUserId(c.sellerId) === currentUserId))
  );

  // 2. If logged in and previous conversation was created as guest for this ad, adopt it
  if (!existing && !currentUserId.startsWith('guest-') && currentUserId !== 'guest-buyer') {
    existing = convs.find(
      (c) =>
        c.adId === ad.id &&
        (c.buyerId === 'guest-buyer' || c.buyerId.startsWith('guest-')) &&
        normalizeUserId(c.sellerId) === sellerId
    );
    if (existing) {
      existing.buyerId = currentUserId;
      existing.buyerName = currentUserName;
      saveConversations(convs);
      return existing;
    }
  }

  if (existing) {
    return existing;
  }

  // Create new conversation with deterministic ID so both buyer and seller map to the identical thread
  const cleanAdId = String(ad.id || 'ad').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanBuyerId = String(currentUserId || 'buyer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const deterministicId = `conv_${cleanAdId}_${cleanBuyerId}`;

  const newConv: Conversation = {
    id: deterministicId,
    adId: ad.id,
    adTitle: ad.title,
    adPrice: ad.price,
    adImage: ad.images && ad.images.length > 0 ? ad.images[0] : '',
    buyerId: currentUserId,
    buyerName: currentUserName,
    sellerId: sellerId,
    sellerName: sellerName,
    sellerPhone: ad.phone,
    messages: [],
    lastMessageText: '',
    lastMessageTimestamp: new Date().toISOString(),
    unreadCountForUser: {
      [currentUserId]: 0,
      [sellerId]: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  const updatedConvs = [newConv, ...convs];
  saveConversations(updatedConvs);

  // Asynchronously persist new conversation to Supabase if configured
  const supabase = getSupabase(currentUserId);
  if (supabase) {
    supabase
      .from('conversations')
      .upsert({
        id: newConv.id,
        ad_id: newConv.adId,
        ad_title: newConv.adTitle,
        ad_price: newConv.adPrice,
        ad_image: newConv.adImage,
        buyer_id: newConv.buyerId,
        buyer_name: newConv.buyerName,
        seller_id: newConv.sellerId,
        seller_name: newConv.sellerName,
        seller_phone: newConv.sellerPhone || '',
        last_message_text: newConv.lastMessageText,
        last_message_timestamp: newConv.lastMessageTimestamp,
        updated_at: newConv.updatedAt,
      })
      .then(
        () => {},
        (e: any) => console.warn('Supabase conversation upsert error:', e)
      );
  }

  // Asynchronously relay conversation to backend server
  try {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/api/chat/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConv),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return newConv;
}

/**
 * Sends a message in a conversation with strict deduplication guards,
 * instant local optimistic update, Supabase SQL persistence, and Realtime Broadcast.
 */
export function sendMessage(
  conversationId: string,
  text: string,
  senderUser: { id: string; name: string } | UserProfile | null,
  imageUrl?: string
): Conversation | null {
  const cleanText = text.trim();
  if (!cleanText && !imageUrl) return null;

  const rawSenderId = senderUser?.id || 'guest-buyer';
  const senderId = normalizeUserId(rawSenderId);
  const now = Date.now();
  const sendKey = `${conversationId}:${senderId}:${cleanText || imageUrl}`;

  // Synchronous module debounce: if identical call within 1200ms, ignore duplicate
  if (now - lastSentMessageTime < 1200 && lastSentMessageKey === sendKey) {
    const currentConvs = getStoredConversations();
    return currentConvs.find((c) => c.id === conversationId) || null;
  }

  lastSentMessageKey = sendKey;
  lastSentMessageTime = now;

  const convs = getStoredConversations();
  const index = convs.findIndex((c) => c.id === conversationId);
  if (index === -1) return null;

  const conv = convs[index];
  const senderName = senderUser?.name || 'Шумо';
  const recipientId = senderId === normalizeUserId(conv.buyerId) ? normalizeUserId(conv.sellerId) : normalizeUserId(conv.buyerId);

  // Duplicate check within existing messages in this conversation (prevent double click within 1.5s)
  const isDuplicateMessage = conv.messages.some((m) => {
    if (normalizeUserId(m.senderId) !== senderId) return false;
    if (imageUrl || m.imageUrl) return false;
    if (m.text?.trim() !== cleanText) return false;
    const diff = Math.abs(now - new Date(m.timestamp).getTime());
    return !isNaN(diff) && diff < 1500;
  });

  if (isDuplicateMessage) {
    return conv;
  }

  const newMsg: ChatMessage = {
    id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    senderName,
    text: cleanText,
    imageUrl,
    timestamp: new Date(now).toISOString(),
    isRead: false,
    status: isSupabaseConfigured() ? 'sending' : 'sent',
  };

  const updatedMessages = deduplicateMessages([...conv.messages, newMsg]);
  const prevUnread = conv.unreadCountForUser?.[recipientId] || 0;

  const updatedConv: Conversation = {
    ...conv,
    messages: updatedMessages,
    lastMessageText: imageUrl && !cleanText ? '📷 Сурат / Фото' : cleanText,
    lastMessageTimestamp: newMsg.timestamp,
    unreadCountForUser: {
      ...(conv.unreadCountForUser || {}),
      [recipientId]: prevUnread + 1,
    },
    updatedAt: newMsg.timestamp,
  };

  // Move updated conversation to top locally immediately
  const newConvs = [
    updatedConv,
    ...convs.filter((c) => c.id !== conversationId),
  ];
  saveConversations(newConvs);

  // Relay to backend server for guaranteed multi-device delivery
  try {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: updatedConv, message: newMsg }),
    }).catch(() => {});
  } catch {
    // ignore
  }

  // Send to shared Supabase backend and Realtime broadcast
  const supabase = getSupabase(senderId);
  if (supabase) {
    // Persist to Postgres database first; message transitions to 'sent' only on confirmed success
    (async () => {
      try {
        // 1. Ensure conversation exists in remote table
        const { error: convErr } = await supabase
          .from('conversations')
          .upsert({
            id: updatedConv.id,
            ad_id: updatedConv.adId,
            ad_title: updatedConv.adTitle,
            ad_price: updatedConv.adPrice,
            ad_image: updatedConv.adImage,
            buyer_id: updatedConv.buyerId,
            buyer_name: updatedConv.buyerName,
            seller_id: updatedConv.sellerId,
            seller_name: updatedConv.sellerName,
            seller_phone: updatedConv.sellerPhone || '',
            last_message_text: updatedConv.lastMessageText,
            last_message_timestamp: updatedConv.lastMessageTimestamp,
            updated_at: updatedConv.updatedAt,
          });

        if (convErr) {
          console.warn('Supabase conversation upsert failed:', convErr);
          const freshConvs = getStoredConversations();
          const targetConv = freshConvs.find((c) => c.id === conversationId);
          if (targetConv) {
            targetConv.messages = targetConv.messages.map((m) =>
              m.id === newMsg.id
                ? { ...m, status: 'error', errorMessage: `Хатогӣ дар суҳбат: ${convErr.message}` }
                : m
            );
            saveConversations(freshConvs);
          }
          return;
        }

        // 2. Insert message into messages table with dual columns (text + content, timestamp + created_at)
        const { error: msgErr } = await supabase
          .from('messages')
          .insert({
            id: newMsg.id,
            conversation_id: conversationId,
            sender_id: newMsg.senderId,
            sender_name: newMsg.senderName,
            text: newMsg.text,
            content: newMsg.text,
            image_url: newMsg.imageUrl || null,
            timestamp: newMsg.timestamp,
            created_at: newMsg.timestamp,
            is_read: false,
          });

        const freshConvs = getStoredConversations();
        const targetConv = freshConvs.find((c) => c.id === conversationId);
        if (targetConv) {
          targetConv.messages = targetConv.messages.map((m) => {
            if (m.id === newMsg.id) {
              return {
                ...m,
                status: msgErr ? 'error' : 'sent',
                errorMessage: msgErr ? `Хатогӣ дар сабти паём: ${msgErr.message}` : undefined,
              };
            }
            return m;
          });
          saveConversations(freshConvs);
        }

        // 3. BROADCAST TO OTHER DEVICES ONLY UPON CONFIRMED DATABASE INSERTION
        if (!msgErr) {
          try {
            const broadcastChannel = getSharedRealtimeChannel(supabase);
            await broadcastChannel.send({
              type: 'broadcast',
              event: 'new_message',
              payload: {
                conversationId: updatedConv.id,
                buyerId: updatedConv.buyerId,
                sellerId: updatedConv.sellerId,
                buyerName: updatedConv.buyerName,
                sellerName: updatedConv.sellerName,
                sellerPhone: updatedConv.sellerPhone || '',
                message: { ...newMsg, status: 'sent' },
                adId: updatedConv.adId,
                adTitle: updatedConv.adTitle,
                adPrice: updatedConv.adPrice,
                adImage: updatedConv.adImage,
              },
            });
          } catch (broadcastErr) {
            console.warn('Realtime broadcast error after DB insert:', broadcastErr);
          }
        }
      } catch (err: any) {
        console.warn('Supabase message persist background error:', err);
        const freshConvs = getStoredConversations();
        const targetConv = freshConvs.find((c) => c.id === conversationId);
        if (targetConv) {
          targetConv.messages = targetConv.messages.map((m) =>
            m.id === newMsg.id
              ? { ...m, status: 'error', errorMessage: err?.message || 'Хатогии шабака' }
              : m
          );
          saveConversations(freshConvs);
        }
      }
    })();
  }

  return updatedConv;
}

/**
 * Retries sending a failed message
 */
export function resendFailedMessage(conversationId: string, messageId: string): void {
  const convs = getStoredConversations();
  const conv = convs.find((c) => c.id === conversationId);
  if (!conv) return;

  const msg = conv.messages.find((m) => m.id === messageId);
  if (!msg) return;

  // Remove the old failed message and re-send
  conv.messages = conv.messages.filter((m) => m.id !== messageId);
  saveConversations(convs);

  sendMessage(
    conversationId,
    msg.text,
    { id: msg.senderId, name: msg.senderName },
    msg.imageUrl
  );
}

/**
 * Marks conversation messages as read for a given user
 */
export function markConversationAsRead(
  conversationId: string,
  userId: string
): void {
  const normalizedUserId = normalizeUserId(userId);
  const convs = getStoredConversations();
  let modified = false;

  const updatedConvs = convs.map((c) => {
    if (c.id !== conversationId) return c;

    const currentUnread = (c.unreadCountForUser && c.unreadCountForUser[normalizedUserId]) || 0;
    const hasUnreadMessages = c.messages.some(
      (m) => normalizeUserId(m.senderId) !== normalizedUserId && !m.isRead
    );
    if (currentUnread === 0 && !hasUnreadMessages) return c;

    modified = true;
    const updatedMessages = c.messages.map((m) => {
      if (normalizeUserId(m.senderId) !== normalizedUserId && !m.isRead) {
        return { ...m, isRead: true };
      }
      return m;
    });

    return {
      ...c,
      messages: updatedMessages,
      unreadCountForUser: {
        ...c.unreadCountForUser,
        [normalizedUserId]: 0,
      },
    };
  });

  if (modified) {
    saveConversations(updatedConvs);

    // 1. Update is_read = true in Supabase Postgres table
    const supabase = getSupabase(normalizedUserId);
    if (supabase) {
      (async () => {
        try {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', normalizedUserId);

          // 2. Broadcast messages_read event over Realtime channel so sender's phone updates in real time
          try {
            const broadcastChannel = getSharedRealtimeChannel(supabase);
            await broadcastChannel.send({
              type: 'broadcast',
              event: 'messages_read',
              payload: {
                conversationId,
                readerId: normalizedUserId,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (bErr) {
            console.warn('[Realtime] messages_read broadcast error:', bErr);
          }
        } catch (err) {
          console.warn('[Supabase] markConversationAsRead exception:', err);
        }
      })();
    }

    // 3. Relay to backend server /api/chat/read
    try {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/chat/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, readerId: normalizedUserId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Calculates total unread messages count for current user
 */
export function getTotalUnreadCount(userId: string): number {
  try {
    const convs = getStoredConversations();
    if (!Array.isArray(convs)) return 0;
    return convs.reduce((acc, c) => {
      if (!c) return acc;
      const count =
        c.unreadCountForUser && typeof c.unreadCountForUser === 'object'
          ? c.unreadCountForUser[userId] || 0
          : 0;
      return acc + (typeof count === 'number' && !isNaN(count) ? count : 0);
    }, 0);
  } catch {
    return 0;
  }
}

/**
 * Deletes a conversation
 */
export function deleteConversation(conversationId: string): void {
  const convs = getStoredConversations();
  const updated = convs.filter((c) => c.id !== conversationId);
  saveConversations(updated);

  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
      } catch {
        // ignore
      }
    })();
  }
}

