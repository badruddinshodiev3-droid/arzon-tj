import React from 'react';
import { Language, UserProfile } from '../types';
import { Home, Search, Plus, MessageSquare, User, Heart } from 'lucide-react';

interface BottomNavProps {
  language: Language;
  onOpenHome: () => void;
  onOpenSearch: () => void;
  onOpenPostAd: () => void;
  onOpenFavorites: () => void;
  onOpenProfile: () => void;
  favoritesCount: number;
  currentUser: UserProfile | null;
  onOpenChat?: () => void;
  unreadChatCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  onOpenHome,
  onOpenSearch,
  onOpenPostAd,
  onOpenFavorites,
  onOpenProfile,
  favoritesCount,
  currentUser,
  onOpenChat,
  unreadChatCount = 0,
}) => {
  const homeLabel =
    language === 'tg' ? 'Асосӣ' : language === 'ru' ? 'Главная' : 'Home';
  const searchLabel =
    language === 'tg' ? 'Ҷустуҷӯ' : language === 'ru' ? 'Поиск' : 'Search';
  const postLabel =
    language === 'tg' ? 'Эълон' : language === 'ru' ? 'Подать' : 'Post';
  const chatLabel =
    language === 'tg' ? 'Паёмҳо' : language === 'ru' ? 'Сообщения' : 'Messages';
  const favLabel =
    language === 'tg' ? 'Мақбул' : language === 'ru' ? 'Избранное' : 'Favorites';
  const profileLabel = currentUser
    ? currentUser.name.split(' ')[0]
    : language === 'tg'
    ? 'Профил'
    : language === 'ru'
    ? 'Профиль'
    : 'Profile';

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-1.5 sm:px-3 flex items-center justify-around shadow-lg safe-area-pb w-full max-w-full box-border">
      {/* 1. Home */}
      <button
        type="button"
        onClick={onOpenHome}
        className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 hover:text-emerald-600 active:scale-95 transition-transform cursor-pointer min-w-0"
        aria-label={homeLabel}
      >
        <Home className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
          {homeLabel}
        </span>
      </button>

      {/* 2. Search / Catalog */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 hover:text-emerald-600 active:scale-95 transition-transform cursor-pointer min-w-0"
        aria-label={searchLabel}
      >
        <Search className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
          {searchLabel}
        </span>
      </button>

      {/* 3. Center Post Ad Button */}
      <button
        type="button"
        onClick={onOpenPostAd}
        className="flex-1 flex flex-col items-center justify-center -mt-3.5 cursor-pointer group min-w-0"
        aria-label={postLabel}
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0">
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </div>
        <span className="text-[10px] font-bold text-slate-900 mt-0.5 truncate max-w-full">
          {postLabel}
        </span>
      </button>

      {/* 4. Messages / Chat */}
      {onOpenChat ? (
        <button
          type="button"
          onClick={onOpenChat}
          className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 hover:text-emerald-600 active:scale-95 transition-transform relative cursor-pointer min-w-0"
          aria-label={chatLabel}
        >
          <div className="relative">
            <MessageSquare
              className={`w-5 h-5 shrink-0 ${
                unreadChatCount > 0 ? 'text-emerald-600' : ''
              }`}
            />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
            {chatLabel}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenFavorites}
          className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 hover:text-emerald-600 active:scale-95 transition-transform relative cursor-pointer min-w-0"
          aria-label={favLabel}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 shrink-0 ${
                favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
            {favLabel}
          </span>
        </button>
      )}

      {/* 5. Profile */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 hover:text-emerald-600 active:scale-95 transition-transform cursor-pointer min-w-0"
        aria-label={profileLabel}
      >
        <div className="relative">
          <User className="w-5 h-5 shrink-0" />
          {currentUser && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
          {profileLabel}
        </span>
      </button>
    </nav>
  );
};
