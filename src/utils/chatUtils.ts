import { ChatMessage, Conversation, ProductAd, UserProfile } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

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
  const seenIds = new Set<string>();
  const clean: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg || (!msg.text?.trim() && !msg.imageUrl)) continue;

    // 1. Strict unique ID check
    if (msg.id && seenIds.has(msg.id)) continue;

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

    if (msg.id) seenIds.add(msg.id);
    clean.push(msg);
  }

  return clean;
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
 * Fetches conversations and messages from Supabase shared database
 */
export async function syncConversationsFromSupabase(userId: string): Promise<Conversation[]> {
  const supabase = getSupabase();
  if (!supabase) return getStoredConversations();

  try {
    const cleanDigits = userId.replace(/\D/g, '');
    const candidateIds = Array.from(
      new Set(
        [
          userId,
          cleanDigits.length >= 9 ? `user-${cleanDigits}` : null,
          cleanDigits.length >= 9 ? cleanDigits : null,
          cleanDigits.length >= 9 ? `+${cleanDigits}` : null,
        ].filter(Boolean) as string[]
      )
    );

    const orConditions = candidateIds
      .map((id) => `buyer_id.eq.${id},seller_id.eq.${id}`)
      .join(',');

    // Query conversations where user is buyer or seller
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(orConditions);

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
          senderName: m.sender_name,
          text: m.text,
          imageUrl: m.image_url || undefined,
          timestamp: m.timestamp,
          isRead: Boolean(m.is_read),
        });
      }
    }

    // Merge with local storage
    const local = getStoredConversations();
    const merged: Conversation[] = convData.map((remoteConv: any) => {
      const localMatch = local.find((l) => l.id === remoteConv.id);
      const remoteMsgs = messagesByConv[remoteConv.id] || [];
      const combinedMsgs = deduplicateMessages([
        ...(localMatch ? localMatch.messages : []),
        ...remoteMsgs,
      ]);

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
        unreadCountForUser: localMatch?.unreadCountForUser || {
          [remoteConv.buyer_id]: 0,
          [remoteConv.seller_id]: 0,
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
 * Sets up Realtime WebSocket subscription for live cross-device delivery
 */
export function subscribeToLiveChat(
  userId: string,
  onNewMessage: (msg: ChatMessage, convId: string) => void,
  onChatUpdate?: () => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    // Unique channel per subscriber to avoid collisions when modals unmount
    const channelId = `chat-live-${userId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsgRow = (payload.new || payload.old) as any;
          if (!newMsgRow || !newMsgRow.id) return;

          const chatMsg: ChatMessage = {
            id: newMsgRow.id,
            senderId: newMsgRow.sender_id,
            senderName: newMsgRow.sender_name,
            text: newMsgRow.text || '',
            imageUrl: newMsgRow.image_url || undefined,
            timestamp: newMsgRow.timestamp || new Date().toISOString(),
            isRead: Boolean(newMsgRow.is_read),
          };

          // Update local conversation cache immediately
          const convs = getStoredConversations();
          const conv = convs.find((c) => c.id === newMsgRow.conversation_id);
          if (conv) {
            const existingMsgIndex = conv.messages.findIndex((m) => m.id === chatMsg.id);
            let updatedMessages: ChatMessage[];
            if (existingMsgIndex >= 0) {
              updatedMessages = [...conv.messages];
              updatedMessages[existingMsgIndex] = {
                ...updatedMessages[existingMsgIndex],
                ...chatMsg,
              };
            } else {
              updatedMessages = deduplicateMessages([...conv.messages, chatMsg]);
            }

            const isIncoming = chatMsg.senderId !== userId;
            const currentUnread = (conv.unreadCountForUser && conv.unreadCountForUser[userId]) || 0;

            const updated = {
              ...conv,
              messages: updatedMessages,
              lastMessageText: chatMsg.imageUrl && !chatMsg.text ? '📷 Сурат / Фото' : (chatMsg.text || conv.lastMessageText),
              lastMessageTimestamp: chatMsg.timestamp,
              unreadCountForUser: {
                ...conv.unreadCountForUser,
                [userId]: isIncoming && !chatMsg.isRead && existingMsgIndex < 0 ? currentUnread + 1 : currentUnread,
              },
              updatedAt: chatMsg.timestamp,
            };
            const newConvs = [updated, ...convs.filter((c) => c.id !== conv.id)];
            saveConversations(newConvs);
          } else {
            // New conversation incoming from another phone/account!
            const { data: remoteConv } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', newMsgRow.conversation_id)
              .maybeSingle();

            if (remoteConv) {
              const freshConvs = getStoredConversations();
              const existingIdx = freshConvs.findIndex((c) => c.id === remoteConv.id);
              const builtConv: Conversation = {
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
                messages: [chatMsg],
                lastMessageText: chatMsg.imageUrl && !chatMsg.text ? '📷 Сурат / Фото' : (chatMsg.text || remoteConv.last_message_text || ''),
                lastMessageTimestamp: chatMsg.timestamp,
                unreadCountForUser: {
                  [remoteConv.buyer_id]: chatMsg.senderId === remoteConv.buyer_id ? 0 : 1,
                  [remoteConv.seller_id]: chatMsg.senderId === remoteConv.seller_id ? 0 : 1,
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

          onNewMessage(chatMsg, newMsgRow.conversation_id);
          if (onChatUpdate) onChatUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          syncConversationsFromSupabase(userId).then(() => {
            if (onChatUpdate) onChatUpdate();
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription failed:', err);
    return () => {};
  }
}

/**
 * Finds or creates a new conversation between buyer and seller for an ad
 */
export function getOrCreateConversation(
  ad: ProductAd,
  currentUser: UserProfile | null
): Conversation {
  const currentUserId = currentUser?.id || getDeviceGuestId();
  const currentUserName = currentUser?.name || 'Шумо (Харидор)';
  const sellerId =
    ad.sellerId ||
    (ad.phone ? `user-${ad.phone.replace(/\D/g, '')}` : `seller-${ad.id}`);
  const sellerName = ad.sellerName || 'Фурӯшанда';

  const convs = getStoredConversations();

  // 1. Find existing conversation for this ad and participant pair
  let existing = convs.find(
    (c) =>
      c.adId === ad.id &&
      ((c.buyerId === currentUserId && c.sellerId === sellerId) ||
        (c.buyerId === sellerId && c.sellerId === currentUserId))
  );

  // 2. If logged in and previous conversation was created as guest for this ad, adopt it
  if (!existing && !currentUserId.startsWith('guest-') && currentUserId !== 'guest-buyer') {
    existing = convs.find(
      (c) =>
        c.adId === ad.id &&
        (c.buyerId === 'guest-buyer' || c.buyerId.startsWith('guest-')) &&
        c.sellerId === sellerId
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
    messages: [
      {
        id: `msg-system-${Date.now()}`,
        senderId: 'system',
        senderName: 'Arzon.tj',
        text: `Суҳбат оид ба эълони «${ad.title}» (${new Intl.NumberFormat('ru-RU').format(ad.price)} с.) оғоз ёфт.`,
        timestamp: new Date().toISOString(),
        isRead: true,
      },
    ],
    lastMessageText: `Суҳбат оғоз шуд`,
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
  const supabase = getSupabase();
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

  return newConv;
}

/**
 * Sends a message in a conversation with strict deduplication guards and synchronous debounce.
 */
export function sendMessage(
  conversationId: string,
  text: string,
  senderUser: { id: string; name: string } | UserProfile | null,
  imageUrl?: string
): Conversation | null {
  const cleanText = text.trim();
  if (!cleanText && !imageUrl) return null;

  const senderId = senderUser?.id || 'guest-buyer';
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
  const recipientId = senderId === conv.buyerId ? conv.sellerId : conv.buyerId;

  // Duplicate check within existing messages in this conversation
  const isDuplicateMessage = conv.messages.some((m) => {
    if (m.senderId !== senderId) return false;
    if (imageUrl || m.imageUrl) return false;
    if (m.text?.trim() !== cleanText) return false;
    const diff = Math.abs(now - new Date(m.timestamp).getTime());
    return !isNaN(diff) && diff < 8000;
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

  // Move updated conversation to top locally
  const newConvs = [
    updatedConv,
    ...convs.filter((c) => c.id !== conversationId),
  ];
  saveConversations(newConvs);

  // Asynchronously send to shared Supabase backend if configured
  const supabase = getSupabase();
  if (supabase) {
    (async () => {
      try {
        // 1. Ensure conversation exists in remote table
        const { error: convErr } = await supabase.from('conversations').upsert({
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
          console.error('Supabase conversation upsert failed:', convErr);
        }

        // 2. Insert the message into messages table
        const { error: msgErr } = await supabase.from('messages').insert({
          id: newMsg.id,
          conversation_id: conversationId,
          sender_id: newMsg.senderId,
          sender_name: newMsg.senderName,
          text: newMsg.text,
          image_url: newMsg.imageUrl || null,
          timestamp: newMsg.timestamp,
          is_read: false,
        });

        if (msgErr) {
          console.error('Supabase message insert failed:', msgErr);
        }
      } catch (err: unknown) {
        console.warn('Supabase message sync error:', err);
      }
    })();
  }

  return updatedConv;
}

/**
 * Marks conversation messages as read for a given user
 */
export function markConversationAsRead(
  conversationId: string,
  userId: string
): void {
  const convs = getStoredConversations();
  let modified = false;

  const updatedConvs = convs.map((c) => {
    if (c.id !== conversationId) return c;

    const currentUnread = (c.unreadCountForUser && c.unreadCountForUser[userId]) || 0;
    const hasUnreadMessages = c.messages.some((m) => m.senderId !== userId && !m.isRead);
    if (currentUnread === 0 && !hasUnreadMessages) return c;

    modified = true;
    const updatedMessages = c.messages.map((m) => {
      if (m.senderId !== userId && !m.isRead) {
        return { ...m, isRead: true };
      }
      return m;
    });

    return {
      ...c,
      messages: updatedMessages,
      unreadCountForUser: {
        ...c.unreadCountForUser,
        [userId]: 0,
      },
    };
  });

  if (modified) {
    saveConversations(updatedConvs);

    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);
        } catch {
          // ignore
        }
      })();
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

