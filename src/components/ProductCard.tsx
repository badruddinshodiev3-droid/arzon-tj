import React, { useState } from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { CITIES, CATEGORIES } from '../data/taxonomy';
import { resolveImageUrl, handleImageError, FALLBACK_SVG_DATA_URL } from '../utils/imageUtils';
import {
  Heart,
  Camera,
  Phone,
  Crown,
  Flame,
  MessageSquare,
  Car,
  CreditCard,
} from 'lucide-react';

interface ProductCardProps {
  ad: ProductAd;
  language: Language;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onQuickCall: (ad: ProductAd, e: React.MouseEvent) => void;
  onPromoteAd?: (ad: ProductAd, e: React.MouseEvent) => void;
  onOpenChat?: (ad: ProductAd, e: React.MouseEvent) => void;
  onOpenInstallment?: (ad: ProductAd, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  ad,
  language,
  isFavorite,
  onToggleFavorite,
  onClick,
  onQuickCall,
  onPromoteAd,
  onOpenChat,
  onOpenInstallment,
}) => {
  const t = translations[language];

  const cityName =
    CITIES.find((c) => c.id === ad.city)?.name[language] || ad.city;
  const categoryName =
    CATEGORIES.find((cat) => cat.id === ad.category)?.name[language] ||
    ad.category;

  const formattedPrice = new Intl.NumberFormat('ru-RU').format(ad.price);

  return (
    <article
      onClick={onClick}
      className={`group rounded-2xl transition-all duration-200 flex flex-col overflow-hidden cursor-pointer w-full max-w-full box-border ${
        ad.isVip
          ? 'bg-amber-50/30 border-2 border-amber-300 ring-1 ring-amber-400/40 shadow-sm hover:shadow-md'
          : ad.isHighlighted
          ? 'bg-emerald-50/30 border border-emerald-300 shadow-2xs hover:shadow-md'
          : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* 4:3 Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {ad.images && ad.images.length > 0 ? (
          <img
            src={resolveImageUrl(ad.images[0])}
            alt={ad.title}
            onError={(e) => handleImageError(e, ad.category)}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
              ad.isSold || ad.status === 'sold' ? 'opacity-80 grayscale-[30%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4">
            <Camera className="w-8 h-8 mb-1 opacity-40" />
            <span className="text-[11px] font-medium text-slate-500 text-center line-clamp-1">
              {ad.title}
            </span>
          </div>
        )}

        {/* Top Floating Controls */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
          {/* Left Badges: VIP / Urgent */}
          <div className="flex items-center gap-1 pointer-events-auto max-w-[75%] flex-wrap">
            {ad.isVip && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black flex items-center gap-1 shadow-sm uppercase tracking-wide">
                <Crown className="w-2.5 h-2.5 fill-slate-950" />
                <span>VIP</span>
              </span>
            )}
            {ad.isUrgent && (
              <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                <Flame className="w-2.5 h-2.5 fill-white" />
                <span>
                  {language === 'tg'
                    ? 'Фаврӣ'
                    : language === 'ru'
                    ? 'Срочно'
                    : 'Urgent'}
                </span>
              </span>
            )}
            {(ad.isSold || ad.status === 'sold') && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-bold shadow-sm">
                {language === 'tg' ? 'Фурӯхта шуд' : language === 'ru' ? 'Продано' : 'Sold'}
              </span>
            )}
            {ad.isSample && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 backdrop-blur-xs text-slate-200 text-[9px] font-medium" title={language === 'tg' ? 'Эълони намунавӣ барои намоиш' : 'Демонстрационное объявление'}>
                {language === 'tg' ? 'Намуна' : language === 'ru' ? 'Демо' : 'Sample'}
              </span>
            )}
            {ad.dealRating === 'super_deal' && (
              <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black flex items-center gap-1 shadow-sm">
                <span>🔥</span>
                <span>{language === 'tg' ? 'Арзон' : language === 'ru' ? 'Суперцена' : 'Hot Deal'}</span>
              </span>
            )}
            {ad.isVerifiedSeller && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm" title={language === 'tg' ? 'Фурӯшандаи тасдиқшуда' : 'Проверенный продавец'}>
                <span>✓</span>
                <span className="hidden xs:inline">{language === 'tg' ? 'Тасдиқ' : 'Проверен'}</span>
              </span>
            )}
            {ad.allowsBarter && (
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-600/90 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                <span>🔄</span>
                <span className="hidden xs:inline">{language === 'tg' ? 'Иваз' : 'Бартер'}</span>
              </span>
            )}
            {ad.images.length > 1 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-[9px] font-semibold text-white flex items-center gap-1 shadow-xs">
                <Camera className="w-2.5 h-2.5" />
                <span>{ad.images.length}</span>
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(ad.id, e)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-sm transition-all pointer-events-auto active:scale-90 shrink-0"
            aria-label="Add to favorites"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                isFavorite ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Quiet Featured marker */}
        {ad.featured && !ad.isVip && !ad.isUrgent && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-[9px] font-semibold text-white tracking-wide">
              {t.featuredBadge}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between w-full max-w-full box-border">
        <div>
          {/* Metadata Line */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5 overflow-hidden">
            <span className="font-medium text-emerald-700 truncate max-w-[110px] shrink-0">
              {categoryName}
            </span>
            <span aria-hidden="true" className="text-slate-300 shrink-0">
              ·
            </span>
            <span className="truncate max-w-[90px]">{cityName}</span>
            {ad.district && (
              <span className="hidden sm:inline-flex items-center gap-1.5 truncate">
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="truncate text-slate-400">{ad.district}</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug break-words">
            {ad.title}
          </h3>

          {/* Installment / Auto Loan Tag (Clickable directly to inquiry) */}
          <div className="mt-1.5 flex items-center">
            {ad.category === 'auto' ? (
              <span
                onClick={(e) => {
                  if (onOpenInstallment) {
                    e.stopPropagation();
                    onOpenInstallment(ad, e);
                  }
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[10px] font-bold cursor-pointer transition-colors"
                title={language === 'tg' ? 'Бо қарз харидан' : language === 'ru' ? 'Купить в автокредит' : 'Buy with auto loan'}
              >
                <Car className="w-2.5 h-2.5 text-blue-600" />
                <span>{language === 'tg' ? 'Қарз:' : language === 'ru' ? 'Кредит:' : 'Loan:'}</span>
                <span className="font-mono">~{new Intl.NumberFormat('ru-RU').format(Math.round(ad.price / 24))} {t.somoni}/м</span>
              </span>
            ) : (
              <span
                onClick={(e) => {
                  if (onOpenInstallment) {
                    e.stopPropagation();
                    onOpenInstallment(ad, e);
                  }
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-[10px] font-bold cursor-pointer transition-colors"
                title={language === 'tg' ? 'Қисм-қисм харидан' : language === 'ru' ? 'Купить в рассрочку' : 'Buy in installments'}
              >
                <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                <span>{language === 'tg' ? 'Қисм-қисм:' : language === 'ru' ? 'Рассрочка:' : 'Split:'}</span>
                <span className="font-mono">~{new Intl.NumberFormat('ru-RU').format(Math.max(1, Math.round(ad.price / 6)))} {t.somoni}/м</span>
              </span>
            )}
          </div>
        </div>

        {/* Price & Contact Row */}
        <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-end justify-between gap-1.5 w-full max-w-full box-border">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 truncate">
              <span className="text-base sm:text-xl font-bold text-slate-900 tabular-nums truncate">
                {formattedPrice}
              </span>
              <span className="text-xs font-semibold text-emerald-700 shrink-0">
                {t.currencySymbol}
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              {ad.isNegotiable ? (
                <span className="text-emerald-600">{t.negotiable}</span>
              ) : (
                <span className="text-slate-400">{t.fixedPrice}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Promote Ad Button */}
            {onPromoteAd && (
              <button
                type="button"
                onClick={(e) => onPromoteAd(ad, e)}
                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer shrink-0"
                title="VIP"
              >
                <Crown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Call Button */}
            <button
              type="button"
              onClick={(e) => onQuickCall(ad, e)}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
              title={t.callSeller}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">{t.callSeller}</span>
            </button>

            {/* Quick Chat Button */}
            {onOpenChat && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(ad, e);
                }}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300/80 active:scale-95 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
                title={language === 'tg' ? 'Чат бо фурӯшанда' : language === 'ru' ? 'Чат с продавцом' : 'Chat with seller'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-[11px] font-bold">
                  {language === 'tg' ? 'Чат' : language === 'ru' ? 'Чат' : 'Chat'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
