import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, UserProfile, Language, ProductAd } from '../types';
import { translations } from '../data/translations';
import {
  getStoredConversations,
  sendMessage,
  markConversationAsRead,
  deleteConversation,
  deduplicateMessages,
  syncConversationsFromSupabase,
  subscribeToLiveChat,
  CHAT_EVENT_NAME,
} from '../utils/chatUtils';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { SupabaseSetupModal } from './SupabaseSetupModal';
import { resolveImageUrl, handleImageError, compressAndReadImage } from '../utils/imageUtils';
import {
  X,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  Trash2,
  Search,
  MessageSquare,
  ShieldCheck,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  Phone,
  Database,
  RefreshCw,
} from 'lucide-react';

interface ChatModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onViewAdDetail: (adId: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onViewAdDetail,
}) => {
  const t = translations[language];
  const currentUserId = currentUser?.id || 'guest-buyer';

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getStoredConversations()
  );
  const [inputText, setInputText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync conversations from storage, events, and live Supabase Realtime
  useEffect(() => {
    const handleSync = () => {
      setConversations(getStoredConversations());
    };

    window.addEventListener(CHAT_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);

    // Initial background sync from Supabase if configured
    syncConversationsFromSupabase(currentUserId).then((updated) => {
      setConversations(updated);
    });

    // Subscribe to live Realtime updates across devices
    const unsubscribe = subscribeToLiveChat(
      currentUserId,
      (newMsg, convId) => {
        setConversations(getStoredConversations());
        if (convId === activeConversationId && newMsg.senderId !== currentUserId) {
          markConversationAsRead(convId, currentUserId);
        }
      },
      () => {
        setConversations(getStoredConversations());
      }
    );

    return () => {
      window.removeEventListener(CHAT_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
      unsubscribe();
    };
  }, [currentUserId, activeConversationId]);

  const currentConv = conversations.find((c) => c.id === activeConversationId);

  // Active testing perspective (Buyer or Seller)
  const [activeRoleOverride, setActiveRoleOverride] = useState<'buyer' | 'seller' | null>(null);

  // Reset override whenever switching conversation
  useEffect(() => {
    setActiveRoleOverride(null);
  }, [activeConversationId]);

  const effectiveRole: 'buyer' | 'seller' = activeRoleOverride
    ? activeRoleOverride
    : currentConv && currentConv.sellerId === currentUserId
    ? 'seller'
    : 'buyer';

  const effectiveUserId = currentConv
    ? effectiveRole === 'seller'
      ? currentConv.sellerId
      : currentConv.buyerId
    : currentUserId;

  const effectiveUserName = currentConv
    ? effectiveRole === 'seller'
      ? currentConv.sellerName
      : currentConv.buyerName
    : currentUser?.name || (language === 'tg' ? 'Шумо (Харидор)' : 'Вы (Покупатель)');

  // When active conversation or effective user changes, mark as read
  useEffect(() => {
    if (activeConversationId && effectiveUserId) {
      markConversationAsRead(activeConversationId, effectiveUserId);
      setConversations(getStoredConversations());
    }
  }, [activeConversationId, effectiveUserId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (activeConversationId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversationId, conversations]);

  if (!isOpen) return null;

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Only show conversations where user is buyer or seller
    const isParticipant =
      c.buyerId === effectiveUserId ||
      c.sellerId === effectiveUserId ||
      c.buyerId === currentUserId ||
      c.sellerId === currentUserId ||
      currentUserId === 'guest-buyer';
    if (!isParticipant) return false;

    // Tabs filter
    if (activeTab === 'buying' && c.buyerId !== effectiveUserId && c.buyerId !== currentUserId) return false;
    if (activeTab === 'selling' && c.sellerId !== effectiveUserId && c.sellerId !== currentUserId) return false;

    // Search query
    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      const matchTitle = c.adTitle.toLowerCase().includes(q);
      const matchPerson =
        c.buyerName.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q);
      const matchMsg = c.lastMessageText.toLowerCase().includes(q);
      return matchTitle || matchPerson || matchMsg;
    }
    return true;
  });

  const handleSend = () => {
    if (isSendingRef.current || isSending) return;
    const cleanText = inputText.trim();
    if ((!cleanText && !attachedImage) || !activeConversationId) return;

    isSendingRef.current = true;
    setIsSending(true);

    try {
      sendMessage(
        activeConversationId,
        cleanText,
        { id: effectiveUserId, name: effectiveUserName },
        attachedImage || undefined
      );
      setInputText('');
      setAttachedImage(null);
      setConversations(getStoredConversations());
    } finally {
      setTimeout(() => {
        isSendingRef.current = false;
        setIsSending(false);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendingRef.current && !isSending) {
        handleSend();
      }
    }
  };

  const handleQuickSuggestion = (text: string) => {
    if (isSendingRef.current || isSending || !activeConversationId) return;

    const cleanText = text.trim();
    // Prevent duplicate send if this exact message was already sent by this role in this conversation
    if (
      currentConv &&
      currentConv.messages.some(
        (m) => m.senderId === effectiveUserId && m.text?.trim() === cleanText
      )
    ) {
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);

    try {
      sendMessage(
        activeConversationId,
        cleanText,
        { id: effectiveUserId, name: effectiveUserName }
      );
      setConversations(getStoredConversations());
    } finally {
      setTimeout(() => {
        isSendingRef.current = false;
        setIsSending(false);
      }, 500);
    }
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const compressed = await compressAndReadImage(file);
      setAttachedImage(compressed);
    } catch {
      // ignore
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCurrentChat = (convId: string) => {
    if (
      window.confirm(
        language === 'tg'
          ? 'Оё мехоҳед ин суҳбатро нест кунед?'
          : language === 'ru'
          ? 'Удалить этот чат?'
          : 'Delete this conversation?'
      )
    ) {
      deleteConversation(convId);
      onSelectConversation(null);
      setConversations(getStoredConversations());
    }
  };

  // Quick message presets
  const buyerQuickChips = [
    language === 'tg' ? 'Салом! Мол дар фурӯш ҳаст?' : language === 'ru' ? 'Здравствуйте! Товар ещё продаётся?' : 'Hello! Is this still available?',
    language === 'tg' ? 'Охирин нархаш чанд мешавад?' : language === 'ru' ? 'Какая окончательная цена?' : 'What is your best price?',
    language === 'tg' ? 'Кай дида метавонам?' : language === 'ru' ? 'Когда можно посмотреть?' : 'When can I inspect it?',
    language === 'tg' ? 'Дастрасӣ (доставка) доред?' : language === 'ru' ? 'Есть ли доставка?' : 'Do you offer delivery?',
  ];

  const sellerQuickChips = [
    language === 'tg' ? 'Салом! Бале, мол дар фурӯш ҳаст.' : language === 'ru' ? 'Здравствуйте! Да, товар ещё продаётся.' : 'Hello! Yes, still available.',
    language === 'tg' ? 'Савдо дорад назди мол.' : language === 'ru' ? 'Торг уместен при осмотре.' : 'Price is slightly negotiable.',
    language === 'tg' ? 'Ҳар вақт метавонед занг занед.' : language === 'ru' ? 'Можете звонить в любое время.' : 'Feel free to call anytime.',
    language === 'tg' ? 'Бале, дастрасӣ (доставка) дорем.' : language === 'ru' ? 'Да, доставка возможна.' : 'Yes, delivery is possible.',
  ];

  const quickChips = effectiveRole === 'seller' ? sellerQuickChips : buyerQuickChips;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6 w-full max-w-full box-border animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-slate-200 flex flex-col h-[100dvh] sm:h-[85vh] overflow-hidden relative box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL MAIN LAYOUT: Split into Sidebar (Chats list) + Active Chat Thread */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden w-full h-full">
          {/* ========================================================= */}
          {/* LEFT COLUMN: CONVERSATIONS LIST (Hidden on mobile if chat active) */}
          {/* ========================================================= */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-slate-50/70 shrink-0 h-full ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    {language === 'tg' ? 'Паёмҳо' : language === 'ru' ? 'Сообщения' : 'Messages'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {language === 'tg' ? 'Чати Arzon.tj' : language === 'ru' ? 'Чат Arzon.tj' : 'Arzon.tj Chat'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    isSupabaseConfigured()
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                  title={
                    isSupabaseConfigured()
                      ? 'Supabase Realtime фаъол аст'
                      : 'Пайвасткунии пойгоҳи додаҳо барои ду телефон'
                  }
                >
                  <Database className="w-3 h-3" />
                  <span className="hidden sm:inline">{isSupabaseConfigured() ? 'Онлайн' : 'Пойгоҳ'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder={
                    language === 'tg'
                      ? 'Ҷустуҷӯ дар суҳбатҳо...'
                      : language === 'ru'
                      ? 'Поиск по чатам...'
                      : 'Search conversations...'
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-xl outline-hidden text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mt-2">
                {(['all', 'buying', 'selling'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                      activeTab === tab
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'all'
                      ? language === 'tg' ? 'Ҳама' : language === 'ru' ? 'Все' : 'All'
                      : tab === 'buying'
                      ? language === 'tg' ? 'Харид' : language === 'ru' ? 'Покупки' : 'Buying'
                      : language === 'tg' ? 'Фурӯш' : language === 'ru' ? 'Продажи' : 'Selling'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">
                    {language === 'tg'
                      ? 'Ягон паём ёфт нашуд'
                      : language === 'ru'
                      ? 'Нет сообщений'
                      : 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    {language === 'tg'
                      ? 'Барои оғози суҳбат дар эълони дилхоҳ «Навиштан дар чат»-ро пахш кунед'
                      : language === 'ru'
                      ? 'Нажмите «Написать в чат» в объявлении, чтобы начать переписку'
                      : 'Click «Chat with Seller» in any listing to start messaging'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const unread = (c.unreadCountForUser && c.unreadCountForUser[effectiveUserId]) || 0;
                  const isSelected = c.id === activeConversationId;
                  const isSeller = c.sellerId === effectiveUserId;
                  const otherPartyName = isSeller ? c.buyerName : c.sellerName;

                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectConversation(c.id)}
                      className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                          : unread > 0
                          ? 'bg-white hover:bg-slate-100/80 font-medium'
                          : 'bg-white/60 hover:bg-white'
                      }`}
                    >
                      {/* Ad / User Avatar */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                        <img
                          src={resolveImageUrl(c.adImage)}
                          alt={c.adTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e)}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {otherPartyName}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {new Date(c.lastMessageTimestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-emerald-700 truncate mb-0.5">
                          {c.adTitle}
                        </p>

                        <p
                          className={`text-xs truncate ${
                            unread > 0
                              ? 'text-slate-900 font-bold'
                              : 'text-slate-500 font-normal'
                          }`}
                        >
                          {c.lastMessageText}
                        </p>
                      </div>

                      {/* Unread Pill */}
                      {unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">
                          {unread}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: ACTIVE CHAT THREAD (Or empty state on desktop) */}
          {/* ========================================================= */}
          <div
            className={`flex-1 flex flex-col bg-white h-full overflow-hidden ${
              !activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {currentConv ? (
              <>
                {/* Active Chat Header */}
                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectConversation(null)}
                      className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg md:hidden cursor-pointer"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      {(effectiveRole === 'seller'
                        ? currentConv.buyerName
                        : currentConv.sellerName
                      ).charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {effectiveRole === 'seller'
                            ? currentConv.buyerName
                            : currentConv.sellerName}
                        </h3>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>
                            {effectiveRole === 'seller'
                              ? (language === 'tg' ? 'Харидор' : 'Покупатель')
                              : t.verifiedSeller}
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {currentConv.sellerPhone || 'Arzon.tj User'} •{' '}
                        {isSupabaseConfigured() ? (
                          <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {language === 'tg' ? 'Чат бо сервер пайваст аст' : 'Чат подключен к серверу'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSupabaseModalOpen(true)}
                            className="text-amber-700 hover:underline font-medium cursor-pointer"
                          >
                            {language === 'tg' ? 'Офлайн (Барои 2 телефон танзим кунед)' : 'Офлайн (Настроить для 2 телефонов)'}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrentChat(currentConv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title={language === 'tg' ? 'Нест кардани суҳбат' : 'Удалить чат'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer hidden md:block"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 2-Way Chat Testing & Multi-User Switcher Bar */}
                <div className="px-3.5 sm:px-5 py-2 bg-gradient-to-r from-slate-100 via-emerald-50/40 to-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">
                      {language === 'tg' ? 'Реҷаи санҷиш:' : language === 'ru' ? 'Режим проверки:' : 'Test Mode:'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[11px] shadow-2xs truncate ${
                        effectiveRole === 'seller'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      <span>{effectiveRole === 'seller' ? '🏪 Фурӯшанда' : '👤 Харидор'}</span>
                      <span className="font-normal opacity-75 text-[10px]">({effectiveUserName})</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextRole = effectiveRole === 'seller' ? 'buyer' : 'seller';
                      setActiveRoleOverride(nextRole);
                      const newUserId = nextRole === 'seller' ? currentConv.sellerId : currentConv.buyerId;
                      markConversationAsRead(currentConv.id, newUserId);
                      setConversations(getStoredConversations());
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
                    title={
                      language === 'tg'
                        ? 'Гузаштан ба нақши дигар барои санҷиши чати дутарафа'
                        : 'Переключить роль для тестирования'
                    }
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                    <span>
                      {effectiveRole === 'seller'
                        ? (language === 'tg' ? 'Ба Харидор ➔' : 'К Покупателю ➔')
                        : (language === 'tg' ? 'Ба Фурӯшанда ➔' : 'К Продавцу ➔')}
                    </span>
                  </button>
                </div>

                {/* Ad Mini Strip Bar */}
                <div
                  onClick={() => onViewAdDetail(currentConv.adId)}
                  className="px-3.5 sm:px-5 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      <img
                        src={resolveImageUrl(currentConv.adImage)}
                        alt={currentConv.adTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e)}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {currentConv.adTitle}
                      </h4>
                      <p className="text-xs font-bold text-emerald-700 tabular-nums">
                        {new Intl.NumberFormat('ru-RU').format(currentConv.adPrice)}{' '}
                        {t.currencySymbol}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 shrink-0">
                    <span>{language === 'tg' ? 'Дидани мол' : language === 'ru' ? 'Смотреть' : 'View'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Seller Direct Quick Contact Bar */}
                {currentConv.sellerPhone && (
                  <div className="px-3.5 sm:px-5 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-2 shrink-0 text-xs">
                    <span className="text-[11px] text-emerald-950 font-medium truncate">
                      {language === 'tg'
                        ? `Тамос бо фурӯшанда (${currentConv.sellerName}):`
                        : `Связь с продавцом (${currentConv.sellerName}):`}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${currentConv.sellerPhone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{language === 'tg' ? 'Занг' : 'Звонок'}</span>
                      </a>
                      <a
                        href={`https://wa.me/${currentConv.sellerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Салом! Ман дар Arzon.tj эълони шуморо дидам: ${currentConv.adTitle}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg shadow-2xs transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Messages Stream Scroll Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
                  {deduplicateMessages(currentConv.messages).map((msg) => {
                    const isMe = msg.senderId === effectiveUserId;
                    const isSys = msg.senderId === 'system';

                    if (isSys) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-2xs space-y-1.5 ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                          }`}
                        >
                          {/* Image Attachment if sent */}
                          {msg.imageUrl && (
                            <div className="rounded-xl overflow-hidden mb-1 max-h-60 bg-slate-950/10">
                              <img
                                src={msg.imageUrl}
                                alt="Chat attachment"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.text}
                            </p>
                          )}

                          {/* Timestamp & Honest Delivery Status */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] ${
                              isMe ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span
                                className="inline-flex items-center gap-0.5 ml-1"
                                title={
                                  msg.isRead
                                    ? (language === 'tg'
                                        ? 'Хонда шуд'
                                        : language === 'ru'
                                        ? 'Прочитано'
                                        : 'Read')
                                    : (language === 'tg'
                                        ? 'Фиристода шуд'
                                        : language === 'ru'
                                        ? 'Отправлено'
                                        : 'Sent')
                                }
                              >
                                {msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Chips Row */}
                <div className="px-3 sm:px-4 py-1.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{language === 'tg' ? 'Ҷавоби тез:' : 'Быстрый ответ:'}</span>
                  </span>
                  {quickChips.map((chip, idx) => {
                    const isAlreadySent = Boolean(
                      currentConv?.messages.some(
                        (m) => m.senderId === currentUserId && m.text?.trim() === chip.trim()
                      )
                    );

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isSending || isAlreadySent}
                        onClick={() => handleQuickSuggestion(chip)}
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-medium shrink-0 whitespace-nowrap transition-colors ${
                          isAlreadySent
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-700 cursor-pointer active:scale-95'
                        }`}
                        title={
                          isAlreadySent
                            ? (language === 'tg'
                                ? 'Аллакай фиристода шуд'
                                : language === 'ru'
                                ? 'Уже отправлено'
                                : 'Already sent')
                            : undefined
                        }
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>

                {/* Attached Photo Preview if selected */}
                {attachedImage && (
                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                      <img
                        src={attachedImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      {language === 'tg'
                        ? 'Сурат барои фиристодан омода аст'
                        : 'Фото готово к отправке'}
                    </span>
                  </div>
                )}

                {/* Bottom Input Form */}
                <div className="p-2.5 sm:p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
                  <label
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors shrink-0"
                    title={language === 'tg' ? 'Иловаи сурат' : 'Прикрепить фото'}
                  >
                    {isCompressingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAttachImage}
                      disabled={isCompressingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      effectiveRole === 'seller'
                        ? (language === 'tg'
                            ? `Ҷавоб ба ${currentConv.buyerName} (Фурӯшанда)...`
                            : language === 'ru'
                            ? `Ответить покупателю ${currentConv.buyerName}...`
                            : `Reply to ${currentConv.buyerName} (Seller)...`)
                        : (language === 'tg'
                            ? `Паём ба ${currentConv.sellerName} (Харидор)...`
                            : language === 'ru'
                            ? `Написать продавцу ${currentConv.sellerName}...`
                            : `Message to ${currentConv.sellerName} (Buyer)...`)
                    }
                    className="flex-1 py-2 px-3 text-xs sm:text-sm bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-xl outline-hidden text-slate-900 placeholder:text-slate-400 transition-colors"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending || (!inputText.trim() && !attachedImage)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </>
            ) : (
              /* Desktop Empty State when no conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/40">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  {language === 'tg' ? 'Суҳбатро интихоб кунед' : language === 'ru' ? 'Выберите диалог' : 'Select a conversation'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {language === 'tg'
                    ? 'Аз рӯйхати чап суҳбатро интихоб кунед ё дар эълони дилхоҳ бо пахши «Навиштан дар чат» суҳбати нав оғоз намоед.'
                    : language === 'ru'
                    ? 'Выберите чат из списка слева или начните новый с продавцом любого товара.'
                    : 'Choose a conversation from the left or start messaging with any seller.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supabase Realtime Setup & Status Modal */}
      <SupabaseSetupModal
        language={language}
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
