import React, { useState, useMemo, useEffect } from 'react';
import {
  Language,
  ProductAd,
  FilterState,
  SortOption,
  ProductCondition,
} from './types';
import { translations } from './data/translations';
import {
  getStoredAds,
  saveStoredAds,
  getFavorites,
  toggleFavoriteInStorage,
  syncAdsFromSupabase,
  saveAdToSupabase,
  deleteAdFromSupabase,
} from './data/mockAds';
import { getSupabase, fetchRemoteSupabaseConfig } from './utils/supabaseClient';
import { CITIES, CATEGORIES } from './data/taxonomy';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SearchAndFilters } from './components/SearchAndFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PostAdModal } from './components/PostAdModal';
import { SafetyModal } from './components/SafetyModal';
import { FavoritesModal } from './components/FavoritesModal';
import { QuickContactModal } from './components/QuickContactModal';
import { UserProfile } from './types';
import { ReportAdModal } from './components/ReportAdModal';
import { PlayMarketGuideModal } from './components/PlayMarketGuideModal';
import { AuthModal } from './components/AuthModal';
import { PromoteAdModal } from './components/PromoteAdModal';
import { MonetizationGuideModal } from './components/MonetizationGuideModal';
import { SomonHomeHub } from './components/SomonHomeHub';
import { BottomNav } from './components/BottomNav';
import { ChatModal } from './components/ChatModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { InstallmentModal } from './components/InstallmentModal';
import { Footer } from './components/Footer';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  getOrCreateConversation,
  getTotalUnreadCount,
  syncConversationsFromSupabase,
  subscribeToLiveChat,
  getStoredConversations,
  normalizeUserId,
  getDeviceGuestId,
  CHAT_EVENT_NAME,
} from './utils/chatUtils';
import {
  getAdminUnreadCount,
  subscribeToAdminAnnouncements,
  syncServerAnnouncements,
  ADMIN_ANNOUNCEMENTS_EVENT,
} from './utils/adminMessageUtils';
import {
  CheckCircle,
  Plus,
  RotateCcw,
  Sparkles,
  MapPin,
  Tag,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Search,
  MessageSquare,
  Download,
  X,
} from 'lucide-react';
import {
  matchesSearchQuery,
  POPULAR_SEARCH_SUGGESTIONS,
} from './utils/searchUtils';

const DEFAULT_FILTERS: FilterState = {
  query: '',
  category: 'all',
  city: 'all',
  district: '',
  minPrice: '',
  maxPrice: '',
  condition: 'all',
  onlyNegotiable: false,
  onlyWithPhotos: false,
  sortBy: 'newest',
};

export default function App() {
  // Language state (persisted safely)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('arzontj_lang');
      return saved === 'ru' || saved === 'en' || saved === 'tg' ? saved : 'tg';
    } catch {
      return 'tg';
    }
  });

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('arzontj_lang', newLang);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  // Ads state (persisted)
  const [ads, setAds] = useState<ProductAd[]>(() => getStoredAds());

  // Favorites state (persisted)
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // User Authentication State (persisted)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('arzontj_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Modals state
  const [selectedAd, setSelectedAd] = useState<ProductAd | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isPlayGuideOpen, setIsPlayGuideOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMonetizeOpen, setIsMonetizeOpen] = useState(false);
  const [promoteAd, setPromoteAd] = useState<ProductAd | null>(null);
  const [reportingAd, setReportingAd] = useState<ProductAd | null>(null);
  const [quickContactAd, setQuickContactAd] = useState<ProductAd | null>(null);
  const [installmentAd, setInstallmentAd] = useState<ProductAd | null>(null);

  // Chat Messenger state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupabaseSetupOpen, setIsSupabaseSetupOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() => {
    const effectiveId = currentUser?.id || getDeviceGuestId();
    return getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId);
  });

  // Listen for global open supabase setup event
  useEffect(() => {
    (window as any).__arzonLoaded = true;
    fetchRemoteSupabaseConfig().then((cfg) => {
      if (cfg) {
        window.dispatchEvent(new CustomEvent(CHAT_EVENT_NAME));
      }
    });

    syncServerAnnouncements();

    const handleOpenSetup = () => setIsSupabaseSetupOpen(true);
    window.addEventListener('arzontj:open-supabase-setup', handleOpenSetup);
    return () => window.removeEventListener('arzontj:open-supabase-setup', handleOpenSetup);
  }, []);

  // Keep unread chat count in sync with storage, custom events, and live Supabase Realtime
  useEffect(() => {
    const effectiveId = currentUser?.id || getDeviceGuestId();

    const handleChatUpdate = () => {
      setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
    };

    window.addEventListener(CHAT_EVENT_NAME, handleChatUpdate);
    window.addEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);
    handleChatUpdate();

    // Background sync from Supabase when app loads or user changes
    syncConversationsFromSupabase(effectiveId).then(() => {
      setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
    });

    // Cross-phone live messaging listener running in background
    const unsubscribe = subscribeToLiveChat(
      effectiveId,
      (newMsg) => {
        setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
        // If chat modal is closed and message is not from me, show gentle toast notification
        if (!isChatOpen && normalizeUserId(newMsg.senderId) !== normalizeUserId(effectiveId)) {
          const previewText = newMsg.imageUrl && !newMsg.text ? '📷 Сурат / Фото' : newMsg.text;
          const snippet = previewText.length > 35 ? previewText.slice(0, 35) + '...' : previewText;
          setToastMessage(
            language === 'tg'
              ? `Паёми нав аз ${newMsg.senderName}: «${snippet}»`
              : language === 'ru'
              ? `Новое сообщение от ${newMsg.senderName}: «${snippet}»`
              : `New message from ${newMsg.senderName}: «${snippet}»`
          );
          setTimeout(() => setToastMessage(null), 4500);
        }
      },
      () => {
        setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
      }
    );

    // Live admin broadcast announcements listener
    const unsubscribeAdmin = subscribeToAdminAnnouncements((announcement) => {
      setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
      if (!isChatOpen) {
        setToastMessage(
          language === 'tg'
            ? `📢 Маъмурият: «${announcement.title}»`
            : language === 'ru'
            ? `📢 Администрация: «${announcement.title}»`
            : `📢 Admin Notice: «${announcement.title}»`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    });

    return () => {
      window.removeEventListener(CHAT_EVENT_NAME, handleChatUpdate);
      window.removeEventListener(ADMIN_ANNOUNCEMENTS_EVENT, handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
      unsubscribe();
      unsubscribeAdmin();
    };
  }, [currentUser, isChatOpen, language]);

  const handleOpenChat = (ad?: ProductAd) => {
    if (ad) {
      const sellerId =
        ad.sellerId ||
        (ad.phone ? `user-${ad.phone.replace(/\D/g, '')}` : `seller-${ad.id}`);

      // If user is the seller of this ad, open existing inquiries instead of talking to self
      const normalizedSellerId = normalizeUserId(sellerId);
      const normalizedCurrentUserId = normalizeUserId(currentUser?.id);
      const sellerPhoneDigits = (ad.phone || '').replace(/\D/g, '');
      const userPhoneDigits = (currentUser?.phone || '').replace(/\D/g, '');

      if (
        currentUser &&
        (normalizedCurrentUserId === normalizedSellerId ||
          (userPhoneDigits && sellerPhoneDigits && userPhoneDigits === sellerPhoneDigits))
      ) {
        const stored = getStoredConversations();
        const existingInquiry = stored.find(
          (c) => c.adId === ad.id && normalizeUserId(c.sellerId) === normalizedCurrentUserId
        );
        if (existingInquiry) {
          setActiveConversationId(existingInquiry.id);
        } else {
          setActiveConversationId(null);
        }
        setIsChatOpen(true);
        return;
      }

      const conv = getOrCreateConversation(ad, currentUser);
      setActiveConversationId(conv.id);
      setIsChatOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  // Success toast for ad creation / reports / promotion
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA install prompt for mobile browser users
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // Live sync from Supabase on launch (auto-fetches server config so Phone 2 connects immediately)
  useEffect(() => {
    fetchRemoteSupabaseConfig().then(() => {
      syncAdsFromSupabase().then((latest) => {
        if (latest && latest.length > 0) {
          setAds(latest);
        }
      });
      const effectiveId = currentUser?.id || getDeviceGuestId();
      syncConversationsFromSupabase(effectiveId).then(() => {
        setUnreadChatCount(getTotalUnreadCount(effectiveId));
      });
    });
  }, []);

  // Listen to Supabase Auth State changes for persistent sessions
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Function to populate and sync profile from Supabase
    const syncUserProfileFromAuth = async (u: any) => {
      const cleanEmail = (u.email || '').toLowerCase().trim();
      if (!cleanEmail || cleanEmail.includes('@arzon-messenger.tj')) {
        return;
      }

      let displayName = u.user_metadata?.name || cleanEmail.split('@')[0] || 'Корбари Arzon.tj';
      let phoneStr = u.user_metadata?.phone || '';
      let balance = 30;

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        if (prof) {
          if (prof.name) displayName = prof.name;
          if (prof.phone) phoneStr = prof.phone;
          if (typeof prof.balance === 'number') balance = prof.balance;
        } else {
          // First time login - populate profile record
          await supabase.from('profiles').upsert({
            id: u.id,
            name: displayName,
            phone: phoneStr,
            email: cleanEmail,
            balance: balance,
            joined_date: '2026',
            is_verified: true,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // ignore
      }

      const profileUser: UserProfile = {
        id: u.id,
        name: displayName,
        email: cleanEmail,
        phone: phoneStr || '+992 90 000 0000',
        balance: balance,
        joinedDate: '2026',
        isVerified: true,
        rating: 5.0,
        reviewsCount: 1,
      };

      setCurrentUser(profileUser);
      try {
        localStorage.setItem('arzontj_user', JSON.stringify(profileUser));
      } catch {
        // ignore
      }
    };

    // 1. Initial session check on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        syncUserProfileFromAuth(data.session.user);
      }
    });

    // 2. Continuous listener for auth events (Sign In, Initial Session, Sign Out, User Updated)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        try {
          localStorage.removeItem('arzontj_user');
        } catch {
          // ignore
        }
        return;
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        await syncUserProfileFromAuth(session.user);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('arzontj_user', JSON.stringify(user));

    // Upsert user profile to Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('profiles').upsert({
        id: user.id,
        name: user.name,
        phone: user.phone || '',
        email: user.email || '',
        balance: user.balance,
        joined_date: user.joinedDate,
        is_verified: user.isVerified,
        updated_at: new Date().toISOString(),
      }).then(() => {}, (e) => console.warn('Supabase profile upsert error:', e));
    }

    setToastMessage(
      language === 'tg'
        ? `Хуш омадед, ${user.name}!`
        : `Добро пожаловать, ${user.name}!`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('arzontj_user');
      const supabase = getSupabase();
      if (supabase) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch {
      // ignore
    }
    setToastMessage(
      language === 'tg'
        ? 'Шумо аз ҳисоб баромадед'
        : 'Вы вышли из профиля'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTopUpBalance = (amount: number) => {
    if (!currentUser) return;
    const updated = { ...currentUser, balance: currentUser.balance + amount };
    setCurrentUser(updated);
    localStorage.setItem('arzontj_user', JSON.stringify(updated));
  };

  const handlePromoteSuccess = (updatedAd: ProductAd, packageName: string) => {
    const updatedAds = ads.map((item) =>
      item.id === updatedAd.id ? updatedAd : item
    );
    // Sort promoted ad to top
    const sortedAds = [
      updatedAd,
      ...updatedAds.filter((item) => item.id !== updatedAd.id),
    ];
    setAds(sortedAds);
    saveStoredAds(sortedAds);
    saveAdToSupabase(updatedAd);

    setToastMessage(
      language === 'tg'
        ? `Эълони «${updatedAd.title}» бо пакети ${packageName} VIP карда шуд!`
        : `Объявление успешно продвинуто с пакетом ${packageName}!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteAd = (adId: string) => {
    const updated = ads.filter((item) => item.id !== adId);
    setAds(updated);
    saveStoredAds(updated);
    deleteAdFromSupabase(adId);
    if (selectedAd?.id === adId) {
      setIsDetailOpen(false);
      setSelectedAd(null);
    }
    setToastMessage(
      language === 'tg' ? 'Эълон нест карда шуд' : 'Объявление удалено'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAdStatus = (adId: string, newStatus: 'active' | 'inactive' | 'sold') => {
    setAds((prev) => {
      const updated = prev.map((ad) => {
        if (ad.id === adId) {
          return {
            ...ad,
            status: newStatus,
            isSold: newStatus === 'sold',
          };
        }
        return ad;
      });
      saveStoredAds(updated);
      const target = updated.find((a) => a.id === adId);
      if (target) {
        saveAdToSupabase(target);
      }
      return updated;
    });

    setToastMessage(
      newStatus === 'sold'
        ? language === 'tg'
          ? 'Эълон ба ҳолати «Фурӯхташуда» гузаронида шуд'
          : 'Объявление помечено как проданное'
        : language === 'tg'
        ? 'Эълон фаъол карда шуд'
        : 'Объявление активировано'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('arzontj_user', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from('profiles')
        .upsert({
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone || '',
          email: updatedUser.email || '',
          balance: updatedUser.balance,
          updated_at: new Date().toISOString(),
        })
        .then(() => {}, (e) => console.warn('Supabase profile update:', e));
    }
    setToastMessage(language === 'tg' ? 'Маълумоти профил сабт шуд' : 'Профиль успешно обновлен');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleReportSubmit = (reason: string, details: string) => {
    setToastMessage(
      language === 'tg'
        ? 'Ташаккур! Шикояти шумо қабул шуд ва модераторон онро месанҷанд.'
        : language === 'ru'
        ? 'Спасибо! Ваша жалоба принята и проверяется модераторами.'
        : 'Thank you! Your report was received and is being reviewed.'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Update filter helper
  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleFavoriteInStorage(id);
    setFavorites(updated);
  };

  // Create new ad
  const handleAdCreated = (newAd: ProductAd) => {
    const updatedAds = [newAd, ...ads];
    setAds(updatedAds);
    saveStoredAds(updatedAds);
    saveAdToSupabase(newAd);

    // Show toast and open newly created ad detail
    setToastMessage(
      language === 'tg'
        ? 'Эълони шумо бо муваффақият нашр шуд!'
        : language === 'ru'
        ? 'Ваше объявление успешно опубликовано!'
        : 'Your advertisement was successfully published!'
    );
    setTimeout(() => setToastMessage(null), 4000);

    setSelectedAd(newAd);
    setIsDetailOpen(true);
  };

  // Fast Filtered Ads Calculation
  const filteredAds = useMemo(() => {
    return ads
      .filter((ad) => {
        // Smart query search with normalization, bilingual synonyms, and token matching
        if (filters.query.trim()) {
          if (!matchesSearchQuery(ad, filters.query)) {
            return false;
          }
        }

        // Category filter
        if (filters.category !== 'all' && ad.category !== filters.category) {
          return false;
        }

        // City filter
        if (filters.city !== 'all' && ad.city !== filters.city) {
          return false;
        }

        // District filter
        if (filters.district && ad.district !== filters.district) {
          return false;
        }

        // Price Min
        if (filters.minPrice && Number(filters.minPrice) > 0) {
          if (ad.price < Number(filters.minPrice)) return false;
        }

        // Price Max
        if (filters.maxPrice && Number(filters.maxPrice) > 0) {
          if (ad.price > Number(filters.maxPrice)) return false;
        }

        // Condition filter
        if (filters.condition !== 'all' && ad.condition !== filters.condition) {
          return false;
        }

        // Only Negotiable
        if (filters.onlyNegotiable && !ad.isNegotiable) {
          return false;
        }

        // Only With Photos
        if (filters.onlyWithPhotos && (!ad.images || ad.images.length === 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price_asc') {
          return a.price - b.price;
        }
        if (filters.sortBy === 'price_desc') {
          return b.price - a.price;
        }
        if (filters.sortBy === 'popular') {
          return b.views - a.views;
        }
        // default 'newest'
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [ads, filters]);

  // Similar ads for the selected ad
  const similarAds = useMemo(() => {
    if (!selectedAd) return [];
    return ads
      .filter(
        (item) =>
          item.id !== selectedAd.id &&
          (item.category === selectedAd.category || item.city === selectedAd.city)
      )
      .slice(0, 3);
  }, [ads, selectedAd]);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      const yOffset = -120; // accounts for sticky navbar + filters
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 w-full max-w-full overflow-x-hidden box-border">
      {/* Navbar with 3-Zone top bar contract */}
      <Navbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenPostAd={() => setIsPostAdOpen(true)}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenPlayGuide={() => setIsPlayGuideOpen(true)}
        onOpenMonetization={() => setIsMonetizeOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        favoritesCount={favorites.length}
        onOpenChat={() => handleOpenChat()}
        unreadChatCount={unreadChatCount}
        onOpenSupabase={() => setIsSupabaseSetupOpen(true)}
      />

      {/* PWA Mobile App Install Bar */}
      {!isInstalled && showInstallBanner && (
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-sm z-30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {language === 'tg'
                  ? 'Барномаи Arzon.tj-ро дар телефон насб кунед'
                  : language === 'ru'
                  ? 'Установите приложение Arzon.tj на телефон'
                  : 'Install Arzon.tj App on your device'}
              </p>
              <p className="text-[10px] text-emerald-100 truncate">
                {language === 'tg'
                  ? 'Бе интернет ҳам кор мекунад, суръати фаврӣ'
                  : language === 'ru'
                  ? 'Работает оффлайн, быстрый доступ'
                  : 'Works offline with instant access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const ok = await install();
                if (!ok) {
                  setIsPlayGuideOpen(true);
                }
              }}
              className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              {language === 'tg' ? 'Насб кардан' : language === 'ru' ? 'Установить' : 'Install'}
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section with Dushanbe photography, live autocomplete search & popular tags */}
      <HeroSection
        language={language}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearchSubmit={scrollToCatalog}
        onSelectCategory={(catId) => {
          handleFilterChange({ category: catId });
          scrollToCatalog();
        }}
        totalAdsCount={ads.length}
        ads={ads}
        onSelectAd={(ad) => {
          setSelectedAd(ad);
          setIsDetailOpen(true);
        }}
      />

      {/* Somon.tj Style Stories, 6 Category Tiles, and Curated Showcases (shown when not actively searching text) */}
      {!filters.query.trim() && (
        <SomonHomeHub
          language={language}
          onSelectCategory={(catId) => {
            handleFilterChange({ category: catId });
            scrollToCatalog();
          }}
          onOpenPromoteDemo={() => setIsMonetizeOpen(true)}
          onSelectAd={(ad) => {
            setSelectedAd(ad);
            setIsDetailOpen(true);
          }}
          ads={ads}
          scrollToCatalog={scrollToCatalog}
        />
      )}

      {/* Sticky Search & Advanced Filters Bar */}
      <SearchAndFilters
        language={language}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        resultsCount={filteredAds.length}
      />

      {/* Main Marketplace Product Grid */}
      <main id="catalog" className="flex-1 max-w-7xl mx-auto w-full max-w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 scroll-mt-28 box-border">
        {/* Prominent Search Status Banner when query is active */}
        {filters.query.trim() && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-slate-100 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full max-w-full box-border">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-base font-bold text-slate-900 truncate">
                  {language === 'tg'
                    ? `Натиҷаҳои ҷустуҷӯ барои: «${filters.query}»`
                    : language === 'ru'
                    ? `Результаты поиска по запросу: «${filters.query}»`
                    : `Search results for: "${filters.query}"`}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate">
                  {filteredAds.length > 0
                    ? `${filteredAds.length} ${language === 'tg' ? 'эълон ёфт шуд' : language === 'ru' ? 'объявлений найдено' : 'ads found'}`
                    : language === 'tg'
                    ? 'Мутаассифона, чизе ёфт нашуд.'
                    : language === 'ru'
                    ? 'Ничего не найдено. Попробуйте похожие запросы:'
                    : 'No ads found. Try different keywords:'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFilterChange({ query: '' })}
              className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 transition-colors shrink-0 cursor-pointer self-end sm:self-center"
            >
              {language === 'tg' ? 'Тоза кардан' : language === 'ru' ? 'Сбросить' : 'Clear'}
            </button>
          </div>
        )}
        {/* Active Filter Pills (if any) */}
        {(filters.category !== 'all' ||
          filters.city !== 'all' ||
          filters.district ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.query) && (
          <div className="flex items-center gap-2 flex-wrap mb-6 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-400">
              {language === 'tg'
                ? 'Филтрҳои фаъол:'
                : language === 'ru'
                ? 'Активные фильтры:'
                : 'Active filters:'}
            </span>

            {filters.query && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-800">
                "{filters.query}"
                <button
                  onClick={() => handleFilterChange({ query: '' })}
                  className="hover:text-rose-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {filters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                {CATEGORIES.find((c) => c.id === filters.category)?.name[
                  language
                ] || filters.category}
                <button
                  onClick={() => handleFilterChange({ category: 'all' })}
                  className="hover:text-rose-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {filters.city !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-800">
                {CITIES.find((c) => c.id === filters.city)?.name[language]}
                <button
                  onClick={() =>
                    handleFilterChange({ city: 'all', district: '' })
                  }
                  className="hover:text-rose-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {filters.district && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-800">
                {filters.district}
                <button
                  onClick={() => handleFilterChange({ district: '' })}
                  className="hover:text-rose-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-800 tabular-nums">
                {filters.minPrice || '0'} — {filters.maxPrice || '∞'}{' '}
                {t.currencySymbol}
                <button
                  onClick={() =>
                    handleFilterChange({ minPrice: '', maxPrice: '' })
                  }
                  className="hover:text-rose-500 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:underline ml-auto font-semibold cursor-pointer"
            >
              {t.resetFilters}
            </button>
          </div>
        )}

        {/* Results grid */}
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 w-full max-w-full box-border">
            {filteredAds.map((ad) => (
              <ProductCard
                key={ad.id}
                ad={ad}
                language={language}
                isFavorite={favorites.includes(ad.id)}
                onToggleFavorite={handleToggleFavorite}
                onClick={() => {
                  setSelectedAd(ad);
                  setIsDetailOpen(true);
                  // increment views locally
                  ad.views += 1;
                }}
                onQuickCall={(adItem, e) => {
                  e.stopPropagation();
                  setQuickContactAd(adItem);
                }}
                onPromoteAd={(adItem, e) => {
                  e.stopPropagation();
                  setPromoteAd(adItem);
                }}
                onOpenChat={(adItem, e) => {
                  e.stopPropagation();
                  handleOpenChat(adItem);
                }}
                onOpenInstallment={(adItem, e) => {
                  e.stopPropagation();
                  setInstallmentAd(adItem);
                }}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-10 sm:py-16 bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 max-w-lg mx-auto w-full max-w-full box-border">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.noAdsFound}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{t.noAdsHint}</p>
            
            {/* Quick Suggestions Chips */}
            <div className="mb-6">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                {language === 'tg'
                  ? 'Шояд шумо инҳоро меҷӯед:'
                  : language === 'ru'
                  ? 'Возможно, вы ищете:'
                  : 'Popular suggestions:'}
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {POPULAR_SEARCH_SUGGESTIONS.slice(0, 5).map((sugg) => (
                  <button
                    key={sugg.query}
                    onClick={() => handleFilterChange({ query: sugg.query, category: 'all', city: 'all' })}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 font-medium rounded-lg transition-all cursor-pointer"
                  >
                    {sugg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t.resetFilters}
              </button>
              <button
                onClick={() => setIsPostAdOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t.postAdButton}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Cities exploration anchor */}
      <section id="cities" className="bg-slate-100 py-8 sm:py-10 border-t border-slate-200 w-full max-w-full box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full max-w-full box-border">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="min-w-0 flex-1 pr-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {language === 'tg'
                  ? 'Эълонҳо аз рӯи шаҳрҳо'
                  : language === 'ru'
                  ? 'Объявления по городам Таджикистана'
                  : 'Classifieds by Cities'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {language === 'tg'
                  ? 'Интихоби минтақа барои ҷустуҷӯи дақиқтар'
                  : language === 'ru'
                  ? 'Выберите город для быстрого поиска'
                  : 'Select city for faster search'}
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 shrink-0">
              12 {language === 'tg' ? 'шаҳру ноҳия' : language === 'ru' ? 'городов' : 'cities'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 w-full max-w-full box-border">
            {CITIES.map((c) => {
              const countInCity = ads.filter((a) => a.city === c.id).length;
              const isSelected = filters.city === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    handleFilterChange({
                      city: isSelected ? 'all' : c.id,
                      district: '',
                    });
                    scrollToCatalog();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold truncate">
                    {c.name[language]}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {c.region[language]}
                  </div>
                  <div
                    className={`text-[10px] font-semibold mt-1.5 tabular-nums ${
                      isSelected ? 'text-white' : 'text-emerald-600'
                    }`}
                  >
                    {countInCity} {t.foundAds.toLowerCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer
        language={language}
        onSelectCity={(cityId) => {
          handleFilterChange({ city: cityId, district: '' });
          scrollToCatalog();
        }}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenPlayGuide={() => setIsPlayGuideOpen(true)}
        onOpenSupabase={() => setIsSupabaseSetupOpen(true)}
      />

      {/* Detail Modal */}
      {isDetailOpen && selectedAd && (
        <ProductDetailModal
          ad={selectedAd}
          language={language}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          isFavorite={selectedAd ? favorites.includes(selectedAd.id) : false}
          onToggleFavorite={handleToggleFavorite}
          similarAds={similarAds}
          onSelectAd={(ad) => setSelectedAd(ad)}
          onOpenReport={(ad) => setReportingAd(ad)}
          onOpenSafety={() => setIsSafetyOpen(true)}
          onOpenPromote={(ad) => setPromoteAd(ad)}
          onOpenChat={(ad) => handleOpenChat(ad)}
          onOpenInstallment={(ad) => setInstallmentAd(ad)}
        />
      )}

      {/* Promote Ad Modal (VIP / Turbo / Urgent) */}
      {promoteAd && (
        <PromoteAdModal
          ad={promoteAd}
          language={language}
          isOpen={Boolean(promoteAd)}
          onClose={() => setPromoteAd(null)}
          onPromoteSuccess={handlePromoteSuccess}
        />
      )}

      {/* Monetization & Business Guide Modal */}
      {isMonetizeOpen && (
        <MonetizationGuideModal
          language={language}
          isOpen={isMonetizeOpen}
          onClose={() => setIsMonetizeOpen(false)}
          onOpenPromoteDemo={() => {
            if (ads.length > 0) setPromoteAd(ads[0]);
          }}
        />
      )}

      {/* User Auth Modal (Phone SMS / Email / Full Somon-Style Profile Dashboard) */}
      {isAuthOpen && (
        <AuthModal
          language={language}
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          userAds={
            currentUser
              ? ads.filter(
                  (a) =>
                    (a.sellerId && a.sellerId === currentUser.id) ||
                    (a.phone && currentUser.phone && a.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) ||
                    a.sellerName === currentUser.name
                )
              : []
          }
          onOpenPromote={(ad) => setPromoteAd(ad)}
          onSelectAd={(ad) => {
            setSelectedAd(ad);
            setIsDetailOpen(true);
          }}
          onDeleteAd={handleDeleteAd}
          onTopUpBalance={handleTopUpBalance}
          onUpdateUser={handleUpdateUser}
          onToggleAdStatus={handleToggleAdStatus}
          onLanguageChange={handleLanguageChange}
          onOpenPostAd={() => setIsPostAdOpen(true)}
          onOpenSafety={() => setIsSafetyOpen(true)}
          onOpenPlayGuide={() => setIsPlayGuideOpen(true)}
        />
      )}

      {/* Report Ad Modal */}
      {reportingAd && (
        <ReportAdModal
          ad={reportingAd}
          language={language}
          isOpen={Boolean(reportingAd)}
          onClose={() => setReportingAd(null)}
          onSubmitReport={handleReportSubmit}
        />
      )}

      {/* Google Play Market Guide Modal */}
      {isPlayGuideOpen && (
        <PlayMarketGuideModal
          language={language}
          isOpen={isPlayGuideOpen}
          onClose={() => setIsPlayGuideOpen(false)}
        />
      )}

      {/* Post Ad Modal */}
      {isPostAdOpen && (
        <PostAdModal
          language={language}
          isOpen={isPostAdOpen}
          onClose={() => setIsPostAdOpen(false)}
          onAdCreated={handleAdCreated}
          currentUser={currentUser}
        />
      )}

      {/* Safety Modal */}
      {isSafetyOpen && (
        <SafetyModal
          language={language}
          isOpen={isSafetyOpen}
          onClose={() => setIsSafetyOpen(false)}
        />
      )}

      {/* Favorites Modal */}
      {isFavoritesOpen && (
        <FavoritesModal
          language={language}
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
          favorites={favorites}
          allAds={ads}
          onToggleFavorite={handleToggleFavorite}
          onSelectAd={(ad) => {
            setSelectedAd(ad);
            setIsDetailOpen(true);
          }}
          onQuickCall={(ad, e) => {
            e.stopPropagation();
            setQuickContactAd(ad);
          }}
        />
      )}

      {/* Quick Contact Modal */}
      {quickContactAd && (
        <QuickContactModal
          ad={quickContactAd}
          language={language}
          isOpen={Boolean(quickContactAd)}
          onClose={() => setQuickContactAd(null)}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Buyer-Seller Chat Modal & Admin Announcements Channel */}
      {isChatOpen && (
        <ChatModal
          language={language}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setActiveConversationId(null);
            const effectiveId = currentUser?.id || getDeviceGuestId();
            setUnreadChatCount(getTotalUnreadCount(effectiveId) + getAdminUnreadCount(effectiveId));
          }}
          currentUser={currentUser}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onViewAdDetail={(adId) => {
            const foundAd = ads.find((a) => a.id === adId);
            if (foundAd) {
              setSelectedAd(foundAd);
              setIsDetailOpen(true);
            }
          }}
          onOpenSafety={() => setIsSafetyOpen(true)}
          onOpenMonetization={() => setIsMonetizeOpen(true)}
          onOpenPostAd={() => setIsPostAdOpen(true)}
        />
      )}

      {/* Supabase Realtime Setup & Status Modal */}
      {isSupabaseSetupOpen && (
        <SupabaseSetupModal
          language={language}
          isOpen={isSupabaseSetupOpen}
          onClose={() => setIsSupabaseSetupOpen(false)}
        />
      )}

      {/* Installment & Car Loan Modal (Requirements 1-6) */}
      {installmentAd && (
        <InstallmentModal
          ad={installmentAd}
          language={language}
          isOpen={Boolean(installmentAd)}
          onClose={() => setInstallmentAd(null)}
          currentUser={currentUser}
          onSubmitSuccess={(app) => {
            setToastMessage(
              language === 'tg'
                ? `Дархости шумо бомуваффақият сабт шуд (№ ${app.id})`
                : language === 'ru'
                ? `Заявка успешно зарегистрирована (№ ${app.id})`
                : `Application registered successfully (№ ${app.id})`
            );
            setTimeout(() => setToastMessage(null), 5000);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-sm sm:max-w-md mx-auto bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 box-border">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Floating Messenger Action Button (FAB) on Mobile / Android */}
      {!isChatOpen && !isPostAdOpen && !isDetailOpen && (
        <button
          type="button"
          onClick={() => handleOpenChat()}
          className="fixed bottom-20 right-4 sm:right-6 lg:hidden z-40 w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xl border-2 border-white flex items-center justify-center cursor-pointer transition-transform"
          style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label={language === 'tg' ? 'Паёмҳо' : language === 'ru' ? 'Сообщения' : 'Messages'}
          title={language === 'tg' ? 'Кушодани чат' : language === 'ru' ? 'Открыть чат' : 'Open chat'}
        >
          <MessageSquare className="w-6 h-6" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>
      )}

      {/* Somon.tj Style Fixed Mobile Bottom Navigation */}
      <BottomNav
        language={language}
        onOpenHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenSearch={() => {
          scrollToCatalog();
          setTimeout(() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) input.focus();
          }, 350);
        }}
        onOpenPostAd={() => setIsPostAdOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenProfile={() => setIsAuthOpen(true)}
        onOpenChat={() => handleOpenChat()}
        unreadChatCount={unreadChatCount}
        favoritesCount={favorites.length}
        currentUser={currentUser}
      />
    </div>
  );
}
