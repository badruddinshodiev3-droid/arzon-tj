import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, UserProfile, Language, ProductAd, AdminAnnouncement, AnnouncementType } from '../types';
import { translations } from '../data/translations';
import {
  getStoredConversations,
  sendMessage,
  resendFailedMessage,
  markConversationAsRead,
  deleteConversation,
  deduplicateMessages,
  syncConversationsFromSupabase,
  syncActiveConversationMessages,
  subscribeToLiveChat,
  normalizeUserId,
  getDeviceGuestId,
  CHAT_EVENT_NAME,
} from '../utils/chatUtils';
import {
  getStoredAdminAnnouncements,
  getAdminUnreadCount,
  markAdminAnnouncementsAsRead,
  deleteAdminAnnouncement,
  subscribeToAdminAnnouncements,
  ADMIN_ANNOUNCEMENTS_EVENT,
} from '../utils/adminMessageUtils';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { SupabaseSetupModal } from './SupabaseSetupModal';
import { AdminBroadcastModal } from './AdminBroadcastModal';
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
  AlertCircle,
  Shield,
  Info,
  Plus,
  Bell,
  Bot,
  Zap,
  Flame,
  Smartphone,
} from 'lucide-react';

interface ChatModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onViewAdDetail: (adId: string) => void;
  onOpenSafety?: () => void;
  onOpenMonetization?: () => void;
  onOpenPostAd?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onViewAdDetail,
  onOpenSafety,
  onOpenMonetization,
  onOpenPostAd,
}) => {
  const t = translations[language];
  const currentUserId = currentUser?.id || getDeviceGuestId();

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getStoredConversations()
  );
  const [inputText, setInputText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling' | 'admin'>('all');
  const [adminAnnouncements, setAdminAnnouncements] = useState<AdminAnnouncement[]>(() =>
    getStoredAdminAnnouncements()
  );
  const [adminUnreadCount, setAdminUnreadCount] = useState<number>(() =>
    getAdminUnreadCount(currentUserId)
  );
  const [isAdminBroadcastOpen, setIsAdminBroadcastOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Automated Interactive Admin Robot (Arzon Assistant Bot)
  interface AdminBotMessage {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    timestamp: string;
    actionLabel?: string;
    actionType?: 'post_ad' | 'monetize' | 'safety' | 'play_market';
  }

  const [adminBotMessages, setAdminBotMessages] = useState<AdminBotMessage[]>(() => [
    {
      id: 'bot-welcome',
      sender: 'bot',
      text:
        language === 'tg'
          ? 'Салом! Ман Роботи ёрирасони худкори Arzon.tj мебошам 🤖.\nМан ба шумо барои тезтар фурӯхтани молҳо, ба роҳ мондани таблиғот (VIP ва Турбо), гузоштани эълон ва ҷалби харидорони зиёд кӯмак мерасонам. Яке аз мавзӯъҳои зерро интихоб кунед ё саволи худро нависед:'
          : language === 'ru'
          ? 'Здравствуйте! Я автоматический робот-помощник Arzon.tj 🤖.\nПомогу вам быстро продать товары, запустить рекламу (VIP и Турбо), подать объявление и привлечь покупателей. Выберите тему ниже или задайте вопрос:'
          : 'Hello! I am Arzon.tj automated Assistant Robot 🤖.\nI help you sell faster, promote listings (VIP & Turbo), post ads, and attract buyers. Choose a quick topic below or ask any question:',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [botInputText, setBotInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleSendBotQuestion = (rawQuestion: string) => {
    const q = rawQuestion.trim();
    if (!q) return;

    const userMsg: AdminBotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };

    setAdminBotMessages((prev) => [...prev, userMsg]);
    setBotInputText('');
    setIsBotTyping(true);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply = '';
      let actionLabel: string | undefined;
      let actionType: 'post_ad' | 'monetize' | 'safety' | 'play_market' | undefined;

      if (
        lower.includes('vip') ||
        lower.includes('реклама') ||
        lower.includes('турбо') ||
        lower.includes('продвиж') ||
        lower.includes('пулак') ||
        lower.includes('даромад') ||
        lower.includes('пешбурд') ||
        lower.includes('акция')
      ) {
        reply =
          language === 'tg'
            ? '🚀 Хизматрасониҳои VIP ва Турбо эълони шуморо дар сархати аввали тамоми сомона бо чаҳорчӯбаи тиллоӣ ва тоҷ мегузоранд. Ин теъдоди зангҳо ва муштариёнро то 3 маротиба зиёд мекунад! Нарх: ҳамагӣ 15 сомонӣ барои 7 рӯз.'
            : '🚀 Услуги VIP и Турбо закрепляют ваше объявление на самом верху каталога с золотой рамкой и короной. Это увеличивает просмотры и звонки в 3 раза! Стоимость: всего 15 сомони на 7 дней.';
        actionLabel = language === 'tg' ? 'Дидани хизматҳои VIP' : 'Посмотреть VIP услуги';
        actionType = 'monetize';
      } else if (
        lower.includes('эълон') ||
        lower.includes('подать') ||
        lower.includes('гузоштан') ||
        lower.includes('мондан') ||
        lower.includes('post') ||
        lower.includes('ройгон') ||
        lower.includes('бесплатн')
      ) {
        reply =
          language === 'tg'
            ? '📝 Дар Arzon.tj гузоштани эълон 100% ройгон ва осон аст! Тугмаи сабзи «+ Эълон»-ро пахш намуда, аксҳои равшан, нарх ва тавсифи молро ворид кунед. Эълони шумо фавран барои тамоми Тоҷикистон нашр мешавад.'
            : '📝 Размещение объявлений на Arzon.tj абсолютно бесплатное! Нажмите кнопку «+ Подать», добавьте фото, цену и описание товара. Ваше объявление мгновенно увидят покупатели по всему Таджикистану.';
        actionLabel = language === 'tg' ? 'Гузоштани эълон ҳозир' : 'Подать объявление сейчас';
        actionType = 'post_ad';
      } else if (
        lower.includes('бехатар') ||
        lower.includes('амният') ||
        lower.includes('фиреб') ||
        lower.includes('безопасн') ||
        lower.includes('мошенник') ||
        lower.includes('пешпардохт')
      ) {
        reply =
          language === 'tg'
            ? '🛡️ Қоидаи тиллоии бехатарӣ: Ҳеҷ гоҳ пешпардохт накунед ва рамзҳои пинҳонии SMS ё корти бонкиро ба касе нафиристед! Бо фурӯшанда танҳо дар ҷои ҷамъиятӣ вохӯрда, пас аз санҷидани мол маблағ супоред.'
            : '🛡️ Золотое правило безопасности: Никогда не отправляйте предоплату и никому не сообщайте коды из SMS! Встречайтесь в общественных местах и передавайте оплату только после личной проверки товара.';
        actionLabel = language === 'tg' ? 'Қоидаҳои бехатарӣ' : 'Правила безопасности';
        actionType = 'safety';
      } else if (
        lower.includes('телефон') ||
        lower.includes('насб') ||
        lower.includes('барнома') ||
        lower.includes('установ') ||
        lower.includes('скачат') ||
        lower.includes('боргирӣ') ||
        lower.includes('android') ||
        lower.includes('apk')
      ) {
        reply =
          language === 'tg'
            ? '📱 Барои насби фаврӣ дар телефони Android: Дар браузери Chrome тугмаи «Насб кардан»-ро пахш кунед ё дар кунҷи рости боло 3 нуқта (⋮) ➔ пахши «Добавить на главный экран»-ро интихоб намоед. Барнома фавран дар экрани телефони шумо сабт мешавад!'
            : '📱 Для быстрой установки на Android: В браузере Chrome нажмите «Установить» либо в меню (⋮) выберите «Добавить на главный экран». Приложение появится на рабочем столе смартфона!';
        actionLabel = language === 'tg' ? 'Роҳнамои насб' : 'Руководство по установке';
        actionType = 'play_market';
      } else {
        reply =
          language === 'tg'
            ? `Ташаккур барои муроҷиат! Ман ҳамчун ёрирасони Arzon.tj ҳамеша дар хизмати шумо ҳастам. Шумо метавонед эълони нав гузоред, молҳоро бо нархи арзон харидорӣ намоед ё барои фурӯши босуръат хизмати VIP-ро истифода баред! Агар ба саволи дигар ҷавоб хоҳед, мавзӯъро нависед.`
            : `Спасибо за обращение! Робот-помощник Arzon.tj всегда готов помочь. Вы можете бесплатно опубликовать объявление, найти выгодные товары или ускорить продажу через VIP!`;
      }

      setAdminBotMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toISOString(),
          actionLabel,
          actionType,
        },
      ]);
      setIsBotTyping(false);
    }, 600);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync admin announcements and unread state
  useEffect(() => {
    const handleAdminSync = () => {
      setAdminAnnouncements(getStoredAdminAnnouncements());
      setAdminUnreadCount(getAdminUnreadCount(currentUserId));
    };

    window.addEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleAdminSync);

    const unsubscribeAdmin = subscribeToAdminAnnouncements(() => {
      handleAdminSync();
      if (activeConversationId === 'admin-official-channel') {
        markAdminAnnouncementsAsRead(currentUserId);
        setAdminUnreadCount(0);
      }
    });

    if (activeConversationId === 'admin-official-channel') {
      markAdminAnnouncementsAsRead(currentUserId);
      setAdminUnreadCount(0);
    }

    return () => {
      window.removeEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleAdminSync);
      unsubscribeAdmin();
    };
  }, [currentUserId, activeConversationId]);

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-emerald-700 underline font-semibold hover:text-emerald-800 break-all inline-flex items-center gap-0.5"
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </a>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const handleLinkAction = (url?: string) => {
    if (!url) return;
    if (url === '#catalog') {
      onClose();
      setTimeout(() => {
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (url === '#safety') {
      onClose();
      if (onOpenSafety) onOpenSafety();
    } else if (url === '#monetize') {
      onClose();
      if (onOpenMonetization) onOpenMonetization();
    } else if (url === '#post-ad') {
      onClose();
      if (onOpenPostAd) onOpenPostAd();
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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
        if (convId === activeConversationId) {
          // If active conversation receives a message from another sender, mark as read immediately
          if (normalizeUserId(newMsg.senderId) !== normalizeUserId(currentUserId)) {
            markConversationAsRead(convId, currentUserId);
          }
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

  const isSellerPerspective = Boolean(
    currentConv &&
      (normalizeUserId(currentConv.sellerId) === normalizeUserId(currentUserId) ||
        (currentUser?.phone &&
          currentConv.sellerPhone &&
          normalizeUserId(currentConv.sellerPhone) === normalizeUserId(currentUser.phone)))
  );

  const effectiveRole: 'buyer' | 'seller' = activeRoleOverride
    ? activeRoleOverride
    : isSellerPerspective
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

  // When active conversation or effective user changes, mark as read and sync messages
  useEffect(() => {
    if (activeConversationId && effectiveUserId) {
      markConversationAsRead(activeConversationId, effectiveUserId);
      setConversations(getStoredConversations());
    }

    if (!activeConversationId) return;

    // Immediate sync of messages for this conversation from Supabase
    syncActiveConversationMessages(activeConversationId).then(() => {
      if (effectiveUserId) {
        markConversationAsRead(activeConversationId, effectiveUserId);
      }
      setConversations(getStoredConversations());
    });

    // Reconcile messages every 2.5s while active in this conversation
    const interval = setInterval(() => {
      syncActiveConversationMessages(activeConversationId).then(() => {
        if (effectiveUserId) {
          markConversationAsRead(activeConversationId, effectiveUserId);
        }
        setConversations(getStoredConversations());
      });
    }, 2500);

    return () => clearInterval(interval);
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
    // Tabs filter
    if (activeTab === 'admin') return false;
    const normEffective = normalizeUserId(effectiveUserId);
    const normCurrent = normalizeUserId(currentUserId);
    if (activeTab === 'buying' && normalizeUserId(c.buyerId) !== normEffective && normalizeUserId(c.buyerId) !== normCurrent) return false;
    if (activeTab === 'selling' && normalizeUserId(c.sellerId) !== normEffective && normalizeUserId(c.sellerId) !== normCurrent) return false;

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
                {(['all', 'buying', 'selling', 'admin'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === 'admin') {
                        onSelectConversation('admin-official-channel');
                      }
                    }}
                    className={`flex-1 py-1 text-[10px] sm:text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center relative ${
                      activeTab === tab
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>
                      {tab === 'all'
                        ? language === 'tg' ? 'Ҳама' : language === 'ru' ? 'Все' : 'All'
                        : tab === 'buying'
                        ? language === 'tg' ? 'Харид' : language === 'ru' ? 'Покупки' : 'Buying'
                        : tab === 'selling'
                        ? language === 'tg' ? 'Фурӯш' : language === 'ru' ? 'Продажи' : 'Selling'
                        : t.adminTab || (language === 'tg' ? 'Маъмурият' : 'Админ')}
                    </span>
                    {tab === 'admin' && adminUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-0.5 min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1 ring-white">
                        {adminUnreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {/* Pinned Official Administration Channel (Somon.tj style) */}
              {(activeTab === 'all' || activeTab === 'admin') && (
                <div
                  onClick={() => onSelectConversation('admin-official-channel')}
                  className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer select-none border-b border-emerald-100/70 ${
                    activeConversationId === 'admin-official-channel'
                      ? 'bg-emerald-50/90 border-l-4 border-emerald-600'
                      : adminUnreadCount > 0
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/70 font-semibold'
                      : 'bg-slate-50/60 hover:bg-slate-100/70'
                  }`}
                >
                  {/* Official Emblem Avatar */}
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm border border-emerald-200">
                    <Shield className="w-6 h-6 text-emerald-50" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {t.adminChannelTitle || 'Маъмурияти Arzon.tj'}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-wider shrink-0">
                          РАСМӢ
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {adminAnnouncements[0]
                          ? new Date(adminAnnouncements[0].timestamp).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Ҳозир'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate font-medium">
                      {adminAnnouncements[0]?.title || 'Канали расмии иттилоот ва огоҳиномаҳо'}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-emerald-700 font-semibold truncate text-[10px]">
                        {t.adminChannelSubtitle || 'Огоҳиномаҳо ва хабарҳо'}
                      </span>
                      {adminUnreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-full shrink-0 shadow-xs">
                          {adminUnreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {filteredConversations.length === 0 && activeTab !== 'all' && activeTab !== 'admin' ? (
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
            {activeConversationId === 'admin-official-channel' ? (
              <div className="flex-1 flex flex-col h-full bg-slate-50/60 overflow-hidden">
                {/* Admin Channel Header */}
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

                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-5 h-5 text-emerald-100" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {t.adminChannelTitle || 'Маъмурияти Arzon.tj'}
                        </h3>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{language === 'tg' ? 'Тасдиқшуда' : 'Официальный'}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate font-medium">
                        {t.adminChannelSubtitle || 'Канали расмии иттилоот ва огоҳиномаҳо'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAdminBroadcastOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      title={t.adminSendBroadcast || 'Ирсоли паёми нав'}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden sm:inline">{language === 'tg' ? 'Ирсоли паём' : 'Написать'}</span>
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

                {/* Admin Subheader Notice */}
                <div className="px-3.5 sm:px-5 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100/70 flex items-center justify-between gap-2 shrink-0 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Bell className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-950 truncate">
                      {language === 'tg'
                        ? 'Огоҳиномаҳо, қоидаҳои амниятӣ ва хабарҳои муҳими сомона'
                        : 'Официальные уведомления, правила безопасности и новости платформы'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-white/80 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200">
                    {adminAnnouncements.length} {language === 'tg' ? 'паём' : 'сообщений'}
                  </span>
                </div>

                {/* Announcements Stream */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
                  {adminAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 space-y-2">
                      <Shield className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-700">
                        {language === 'tg' ? 'Ягон паёми маъмурият нест' : 'Нет сообщений'}
                      </p>
                    </div>
                  ) : (
                    adminAnnouncements.map((ann) => {
                      const type = ann.type || 'info';
                      const isSecurity = type === 'security';
                      const isPromo = type === 'promo';
                      const isUpdate = type === 'update';

                      const badgeLabel =
                        isSecurity
                          ? (language === 'tg' ? 'Бехатарӣ' : 'Безопасность')
                          : isPromo
                          ? (language === 'tg' ? 'Пешниҳод' : 'Акция')
                          : isUpdate
                          ? (language === 'tg' ? 'Навсозӣ' : 'Обновление')
                          : (language === 'tg' ? 'Иттилоот' : 'Информация');

                      const badgeClasses = isSecurity
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isPromo
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isUpdate
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200';

                      const cardBorder = isSecurity
                        ? 'border-rose-200 bg-rose-50/20'
                        : isPromo
                        ? 'border-amber-200 bg-amber-50/20'
                        : isUpdate
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-blue-200 bg-blue-50/20';

                      return (
                        <div
                          key={ann.id}
                          className={`rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs bg-white ${cardBorder}`}
                        >
                          {/* Announcement Top Bar */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClasses}`}
                              >
                                {isSecurity ? (
                                  <Shield className="w-3 h-3" />
                                ) : isPromo ? (
                                  <Sparkles className="w-3 h-3" />
                                ) : isUpdate ? (
                                  <RefreshCw className="w-3 h-3" />
                                ) : (
                                  <Info className="w-3 h-3" />
                                )}
                                <span>{badgeLabel}</span>
                              </span>

                              {ann.pinned && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[9px] uppercase">
                                  {language === 'tg' ? 'Собит' : 'Закреплено'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(ann.timestamp).toLocaleDateString([], {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}{' '}
                                •{' '}
                                {new Date(ann.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      language === 'tg'
                                        ? 'Оё мехоҳед ин паёмро нест кунед?'
                                        : 'Удалить это оповещение?'
                                    )
                                  ) {
                                    deleteAdminAnnouncement(ann.id);
                                    setAdminAnnouncements(getStoredAdminAnnouncements());
                                  }
                                }}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                                title={language === 'tg' ? 'Нест кардан' : 'Удалить'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mb-2">
                            {ann.title}
                          </h4>

                          {/* Message Body */}
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {renderTextWithLinks(ann.message)}
                          </p>

                          {/* Action Button */}
                          {ann.linkUrl && (
                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-start">
                              <button
                                type="button"
                                onClick={() => handleLinkAction(ann.linkUrl)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                              >
                                <span>{ann.linkText || (language === 'tg' ? 'Муфассал' : 'Подробнее')}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Automated Assistant Robot Stream */}
                  <div className="mt-5 pt-4 border-t-2 border-emerald-100/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">
                            {language === 'tg' ? 'Роботи ёрирасони худкор (Arzon Assistant)' : 'Автоматический робот-помощник'}
                          </h5>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {language === 'tg' ? 'Ҳамеша онлайн • Ёрии 24/7' : 'Онлайн 24/7'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                        {language === 'tg' ? 'Автоматӣ' : 'Авто'}
                      </span>
                    </div>

                    {/* Quick Interactive Prompt Buttons for Advertising & Promotion */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => handleSendBotQuestion('Чӣ тавр моламро тезтар фурӯшам ва эълонро VIP кунам?')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>{language === 'tg' ? '🚀 Реклама ва VIP' : '🚀 Реклама и VIP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendBotQuestion('Чӣ гуна эълони ройгон гузорам?')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'tg' ? '➕ Эълон мондан' : '➕ Подать объявление'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendBotQuestion('Қоидаҳои бехатарӣ ва пешгирӣ аз қаллобӣ чист?')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-rose-600" />
                        <span>{language === 'tg' ? '🛡️ Бехатарӣ' : '🛡️ Безопасность'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendBotQuestion('Чӣ тавр замимаро дар телефон насб кунем?')}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        <span>{language === 'tg' ? '📱 Насб дар телефон' : '📱 На телефон'}</span>
                      </button>
                    </div>

                    {/* Messages between user and bot */}
                    {adminBotMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                            m.sender === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs whitespace-pre-wrap'
                          }`}
                        >
                          <p>{m.text}</p>
                          {m.actionLabel && m.actionType && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (m.actionType === 'post_ad' && onOpenPostAd) onOpenPostAd();
                                  if (m.actionType === 'monetize' && onOpenMonetization) onOpenMonetization();
                                  if (m.actionType === 'safety' && onOpenSafety) onOpenSafety();
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <span>{m.actionLabel}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}

                    {isBotTyping && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2 py-1">
                        <Bot className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                        <span className="italic">{language === 'tg' ? 'Ёрирасон менависад...' : 'Робот печатает...'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Bot Interactive Input Bar */}
                <div className="p-2.5 sm:p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={botInputText}
                    onChange={(e) => setBotInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendBotQuestion(botInputText);
                    }}
                    placeholder={
                      language === 'tg'
                        ? 'Аз ёрирасони Arzon.tj савол диҳед (VIP, фурӯш, эълон, амният)...'
                        : language === 'ru'
                        ? 'Спросите робота Arzon.tj (VIP, продажи, объявление, безопасность)...'
                        : 'Ask Arzon.tj assistant (VIP, sell, ads, safety)...'
                    }
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-hidden text-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendBotQuestion(botInputText)}
                    disabled={!botInputText.trim() || isBotTyping}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl cursor-pointer shrink-0 transition-all shadow-xs"
                    title={language === 'tg' ? 'Ирсол' : 'Отправить'}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : currentConv ? (
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
                      onClick={() => setIsSupabaseModalOpen(true)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title={language === 'tg' ? 'Танзимоти Supabase' : 'Настройки базы'}
                    >
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">{language === 'tg' ? 'База' : 'База'}</span>
                    </button>
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

                {/* Offline Notification Banner if Supabase not configured */}
                {!isSupabaseConfigured() && (
                  <div className="px-3.5 sm:px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate text-[11px] font-medium">
                        {language === 'tg'
                          ? 'Пойгоҳ пайваст нашудааст: паёмҳо танҳо дар ин телефон нигоҳ дошта мешаванд.'
                          : language === 'ru'
                          ? 'База не подключена: сообщения сохраняются только на этом устройстве.'
                          : 'Database offline: messages stay only on this device.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSupabaseModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs transition-all"
                    >
                      {language === 'tg' ? 'Пайваст кардан' : 'Подключить'}
                    </button>
                  </div>
                )}

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
                  {deduplicateMessages(currentConv.messages).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {language === 'tg'
                          ? `Суҳбат оид ба «${currentConv.adTitle}»`
                          : language === 'ru'
                          ? `Переписка по объявлению «${currentConv.adTitle}»`
                          : `Chat for "${currentConv.adTitle}"`}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        {language === 'tg'
                          ? 'Паёми аввалини худро нависед. Паёмҳо дар ҳар ду телефон дар реҷаи зинда дастрас мешаванд.'
                          : language === 'ru'
                          ? 'Напишите первое сообщение. Сообщения появятся на обоих телефонах в реальном времени.'
                          : 'Send your first message. Messages will sync across both phones in real time.'}
                      </p>
                    </div>
                  ) : (
                    deduplicateMessages(currentConv.messages).map((msg) => {
                      const isMe = normalizeUserId(msg.senderId) === normalizeUserId(effectiveUserId);
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
                                  msg.status === 'error'
                                    ? (msg.errorMessage || 'Хатогӣ дар пайвастшавӣ')
                                    : msg.status === 'sending'
                                    ? (language === 'tg' ? 'Дар ҳоли интиқол...' : 'Отправка...')
                                    : msg.isRead
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
                                {msg.status === 'error' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      resendFailedMessage(currentConv.id, msg.id);
                                      setConversations(getStoredConversations());
                                    }}
                                    className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded text-[8px] font-bold cursor-pointer transition-all shadow-xs"
                                    title={language === 'tg' ? 'Аз нав фиристодан' : 'Повторить отправку'}
                                  >
                                    <span>{language === 'tg' ? 'Хато! Аз нав ↻' : 'Сбой! Повторить ↻'}</span>
                                  </button>
                                ) : msg.status === 'sending' ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-emerald-200" />
                                ) : msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-300 stroke-[2.5]" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* If sending failed, display error message */}
                          {msg.status === 'error' && msg.errorMessage && (
                            <p className="text-[9px] text-rose-200 bg-rose-950/40 px-2 py-0.5 rounded mt-1 font-mono break-all">
                              ⚠ {msg.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }))}
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
                        (m) => normalizeUserId(m.senderId) === normalizeUserId(effectiveUserId) && m.text?.trim() === chip.trim()
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

      {/* Admin Broadcast Announcement Composer Modal */}
      <AdminBroadcastModal
        language={language}
        isOpen={isAdminBroadcastOpen}
        onClose={() => setIsAdminBroadcastOpen(false)}
        onBroadcastSuccess={() => {
          setAdminAnnouncements(getStoredAdminAnnouncements());
          setAdminUnreadCount(0);
        }}
      />
    </div>
  );
};
