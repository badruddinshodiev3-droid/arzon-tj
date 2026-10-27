import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../data/translations';
import {
  Heart,
  Globe,
  Plus,
  ShieldCheck,
  MapPin,
  Grid,
  Smartphone,
  TrendingUp,
  User,
  MessageSquare,
  Database,
} from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenPostAd: () => void;
  onOpenSafety: () => void;
  onOpenFavorites: () => void;
  onOpenPlayGuide: () => void;
  onOpenMonetization: () => void;
  onOpenAuth: () => void;
  currentUser: UserProfile | null;
  favoritesCount: number;
  onSelectCityFilter?: (cityId: string) => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
  onOpenSupabase?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onOpenPostAd,
  onOpenSafety,
  onOpenFavorites,
  onOpenPlayGuide,
  onOpenMonetization,
  onOpenAuth,
  currentUser,
  favoritesCount,
  onOpenChat,
  unreadChatCount = 0,
  onOpenSupabase,
}) => {
  const t = translations[language];
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'tg', label: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 w-full box-border">
        <div className="flex items-center justify-between gap-1 sm:gap-4 md:gap-6 h-14 sm:h-16 w-full max-w-full">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 sm:gap-2 group whitespace-nowrap shrink-0"
            aria-label="Arzon.tj Asosiy"
          >
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold text-base sm:text-xl tracking-tight shrink-0">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                Arzon<span className="text-emerald-600">.tj</span>
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase hidden min-[360px]:block">
                Тоҷикистон
              </span>
            </div>
          </a>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            <a
              href="#catalog"
              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Grid className="w-4 h-4 text-slate-400" />
              <span>{t.navCatalog}</span>
            </a>
            <a
              href="#cities"
              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{t.navCities}</span>
            </a>
            <button
              type="button"
              onClick={onOpenSafety}
              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.navSafety}</span>
            </button>
            <button
              type="button"
              onClick={onOpenMonetization}
              className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer font-bold"
            >
              <TrendingUp className="w-4 h-4" />
              <span>
                {language === 'tg'
                  ? 'Даромад (Пулакӣ)'
                  : language === 'ru'
                  ? 'Монетизация'
                  : 'Monetization'}
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenPlayGuide}
              className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer font-semibold"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Play Market</span>
            </button>
            <button
              type="button"
              onClick={onOpenFavorites}
              className="relative flex items-center gap-1.5 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  favoritesCount > 0
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-400'
                }`}
              />
              <span>{t.navFavorites}</span>
              {favoritesCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                  {favoritesCount}
                </span>
              )}
            </button>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="relative flex items-center gap-1.5 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                <span>{t.navMessages || (language === 'tg' ? 'Паёмҳо' : language === 'ru' ? 'Сообщения' : 'Messages')}</span>
                {unreadChatCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-full animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: Responsive Action Controls + Post Ad CTA */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 max-w-full">
            {/* Quick Messages on Tablets (Mobile has BottomNav + FAB) */}
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="relative hidden md:flex lg:hidden p-1.5 sm:p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                title={language === 'tg' ? 'Паёмҳо' : language === 'ru' ? 'Сообщения' : 'Messages'}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Login Button */}
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer shrink-0"
              title={currentUser ? currentUser.name : (language === 'tg' ? 'Вуруд' : language === 'ru' ? 'Вход' : 'Login')}
              aria-label={currentUser ? currentUser.name : 'User Login'}
            >
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline max-w-[80px] truncate">
                {currentUser
                  ? currentUser.name.split(' ')[0]
                  : language === 'tg'
                  ? 'Вуруд'
                  : language === 'ru'
                  ? 'Вход'
                  : 'Login'}
              </span>
            </button>

            {/* Supabase Database Button (Visible on mobile & desktop) */}
            <button
              type="button"
              onClick={onOpenSupabase}
              className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
              title={isSupabaseConfigured() ? 'Supabase Realtime фаъол аст' : 'Пайвасти база барои 2 телефон'}
              aria-label="Database Status"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline text-[11px]">
                {isSupabaseConfigured() ? 'База' : 'Пайваст'}
              </span>
            </button>

            {/* Language Switcher */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Change Language"
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="uppercase text-[11px] sm:text-xs font-bold">
                  {language}
                </span>
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer ${
                        language === lang.code
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Favorites Button (visible on medium-small screens; narrow mobile screens use BottomNav) */}
            <button
              type="button"
              onClick={onOpenFavorites}
              className="hidden min-[480px]:flex lg:hidden p-1.5 text-slate-600 hover:text-rose-500 relative cursor-pointer shrink-0 items-center justify-center"
              aria-label={t.navFavorites}
              title={t.navFavorites}
            >
              <Heart
                className={`w-4 h-4 ${
                  favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''
                }`}
              />
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Primary Action Button (Post Ad) - Guaranteed responsive fit without clipping */}
            <button
              type="button"
              onClick={onOpenPostAd}
              className="flex items-center gap-1 px-2 sm:px-3.5 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={t.postAdButton}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] shrink-0" />
              <span>
                {language === 'tg' ? 'Эълон' : language === 'ru' ? 'Подать' : 'Post'}
              </span>
              <span className="hidden sm:inline">
                {language === 'tg' ? ' мондан' : language === 'ru' ? ' объявление' : ' an ad'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

