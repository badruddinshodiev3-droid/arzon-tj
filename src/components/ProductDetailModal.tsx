import React, { useState } from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { CITIES, CATEGORIES } from '../data/taxonomy';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import {
  X,
  Phone,
  MessageCircle,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  MapPin,
  Tag,
  AlertTriangle,
  Flag,
  Crown,
  MessageSquare,
  Car,
  CreditCard,
  Building2,
} from 'lucide-react';

interface ProductDetailModalProps {
  ad: ProductAd | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  similarAds: ProductAd[];
  onSelectAd: (ad: ProductAd) => void;
  onOpenReport: (ad: ProductAd) => void;
  onOpenSafety: () => void;
  onOpenPromote: (ad: ProductAd) => void;
  onOpenChat?: (ad: ProductAd) => void;
  onOpenInstallment?: (ad: ProductAd) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  ad,
  language,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  similarAds,
  onSelectAd,
  onOpenReport,
  onOpenSafety,
  onOpenPromote,
  onOpenChat,
  onOpenInstallment,
}) => {
  const t = translations[language];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen || !ad) return null;

  const cityName =
    CITIES.find((c) => c.id === ad.city)?.name[language] || ad.city;
  const categoryName =
    CATEGORIES.find((cat) => cat.id === ad.category)?.name[language] ||
    ad.category;

  const formattedPrice = new Intl.NumberFormat('ru-RU').format(ad.price);

  const cleanPhoneForLink = ad.phone.replace(/[^0-9+]/g, '');

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(ad.phone);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const maskedPhone = ad.phone.slice(0, 7) + ' ••• •• ' + ad.phone.slice(-2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 lg:p-6 animate-in fade-in duration-200 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title & Close */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-200 bg-white sticky top-0 z-20 w-full max-w-full box-border">
          <div className="flex items-center gap-2 overflow-hidden pr-3">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
              {categoryName}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              {cityName} {ad.district ? `(${ad.district})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleFavorite(ad.id)}
              className="p-2 text-slate-500 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Add to favorites"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'text-rose-500 fill-rose-500' : ''
                }`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Grid: Gallery Left, Details + Purchase/Contact Module Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src={resolveImageUrl(
                    ad.images[activeImageIndex] ||
                    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
                  )}
                  alt={ad.title}
                  className="w-full h-full object-contain object-center"
                  onError={(e) => handleImageError(e, ad.category)}
                />

                {/* Left/Right Navigation Arrows if >1 image */}
                {ad.images.length > 1 && (
                  <div>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === 0 ? ad.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === ad.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[11px] font-medium backdrop-blur-xs tabular-nums">
                  {activeImageIndex + 1} / {ad.images.length}
                </div>
              </div>

              {/* Thumbnails row */}
              {ad.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {ad.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, ad.category)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Purchase & Seller Module (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {ad.title}
                  </h1>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cityName}</span>
                      {ad.district && <span>· {ad.district}</span>}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="tabular-nums">
                        {ad.views} {t.viewsCount}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                        {formattedPrice}
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {t.somoni}
                      </span>
                    </div>

                    {ad.dealRating === 'super_deal' && (
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black flex items-center gap-1 shadow-xs">
                        <span>🔥</span>
                        <span>{language === 'tg' ? 'Нархи хуб (Арзон)' : language === 'ru' ? 'Выгодная цена' : 'Great Deal'}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs font-semibold">
                    {ad.isNegotiable ? (
                      <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ✓ {t.negotiable}
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">{t.fixedPrice}</span>
                    )}

                    {ad.allowsBarter && (
                      <span className="text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span>🔄</span>
                        <span>{ad.barterNote || (language === 'tg' ? 'Иваз / Бартер мешавад' : 'Возможен бартер')}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Offer / Bargain feature - Better than Somon.tj */}
                  {ad.isNegotiable && onOpenChat && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80">
                      <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>{language === 'tg' ? '⚡ Пешниҳоди нархи худро бикунед:' : language === 'ru' ? '⚡ Предложить свою цену:' : '⚡ Make an offer:'}</span>
                        <span className="text-emerald-600 font-semibold">{language === 'tg' ? 'Савдо дар чат' : 'Торг в чате'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChat(ad);
                          }}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-800 rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          -5% (~{new Intl.NumberFormat('ru-RU').format(Math.round(ad.price * 0.95))} смн)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChat(ad);
                          }}
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-800 rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          -10% (~{new Intl.NumberFormat('ru-RU').format(Math.round(ad.price * 0.9))} смн)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seller Contact Card */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center shrink-0">
                      {ad.sellerName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span>{ad.sellerName}</span>
                        {ad.isVerifiedSeller && (
                          <span className="p-0.5 bg-emerald-600 text-white rounded-full text-[9px] w-4 h-4 inline-flex items-center justify-center" title="Тасдиқшуда">
                            ✓
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          ⭐ {ad.sellerRating || 4.9}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">{t.verifiedSeller}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {t.memberSince} {ad.sellerJoined}
                      </p>
                    </div>
                  </div>

                  {/* Phone Reveal Area */}
                  {!phoneRevealed ? (
                    <button
                      type="button"
                      onClick={() => setPhoneRevealed(true)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 fill-white" />
                      <span>{t.showPhone}</span>
                      <span className="text-xs opacity-75 font-mono">
                        ({maskedPhone})
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      {/* Revealed Phone Bar */}
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-base font-bold text-emerald-900 font-mono tracking-wide">
                          {ad.phone}
                        </span>
                        <button
                          onClick={handleCopyPhone}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          title="Copy"
                        >
                          {copiedToast ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Call & Messenger Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${cleanPhoneForLink}`}
                          className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t.callSeller}</span>
                        </a>

                        <a
                          href={`https://wa.me/${cleanPhoneForLink.replace('+', '')}?text=${encodeURIComponent(
                            `Салом, ман дар Arzon.tj эълони шуморо дидам: ${ad.title}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Installment & Car Loan Button (Requirements 1 & 2) */}
                  {onOpenInstallment && (
                    ad.category === 'auto' ? (
                      <button
                        type="button"
                        onClick={() => onOpenInstallment(ad)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/20">
                            <Car className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-left font-bold">
                            {language === 'tg'
                              ? 'Бо қарз харидан'
                              : language === 'ru'
                              ? 'Купить в автокредит'
                              : 'Buy with auto loan'}
                          </span>
                        </div>
                        <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-md font-mono whitespace-nowrap">
                          ~{new Intl.NumberFormat('ru-RU').format(Math.round(ad.price / 24))} {t.somoni}/м
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenInstallment(ad)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/20">
                            <CreditCard className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-left font-bold">
                            {language === 'tg'
                              ? 'Қисм-қисм харидан'
                              : language === 'ru'
                              ? 'Купить в рассрочку'
                              : 'Buy in installments'}
                          </span>
                        </div>
                        <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-md font-mono whitespace-nowrap">
                          ~{new Intl.NumberFormat('ru-RU').format(Math.max(1, Math.round(ad.price / 6)))} {t.somoni}/м
                        </span>
                      </button>
                    )
                  )}

                  {/* Arzon.tj In-App Messenger Chat */}
                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(ad)}
                      className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-600/30 text-emerald-800 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>{t.chatWithSeller || 'Чат бо фурӯшанда'}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-extrabold ml-1">
                        Online
                      </span>
                    </button>
                  )}

                  {/* Promote ad button */}
                  <button
                    type="button"
                    onClick={() => onOpenPromote(ad)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Crown className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                    <span>
                      {language === 'tg'
                        ? 'Пешбурди эълон (VIP / Турбо)'
                        : language === 'ru'
                        ? 'Продвижение объявления (VIP / Турбо)'
                        : 'Promote listing (VIP / Turbo)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Category-specific safety badge */}
              {ad.category === 'electronics' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        {language === 'tg'
                          ? 'Санҷиши IMEI дар Тоҷикистон'
                          : language === 'ru'
                          ? 'Проверка IMEI в Таджикистане'
                          : 'IMEI check in Tajikistan'}
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Пеш аз харид, рамзи <code className="font-mono bg-emerald-100 px-1 rounded">*#06#</code>-ро санҷед
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://imei.tj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 underline shrink-0 mt-0.5"
                  >
                    imei.tj →
                  </a>
                </div>
              )}

              {/* Arzon.tj Anti-Scam & Trust Shield (Better & safer than Somon.tj) */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-2 border-emerald-500/30 rounded-2xl text-xs text-slate-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-emerald-950 text-xs tracking-tight">
                      {language === 'tg' ? 'Сипари амнияти Arzon.tj' : language === 'ru' ? 'Щит безопасности Arzon.tj' : 'Arzon.tj Security Shield'}
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      100% Амн
                    </span>
                  </div>
                </div>

                <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                  <li>
                    <span className="font-semibold text-rose-700">Ҳаргиз пешпардохт накунед</span> пеш аз дидани мол.
                  </li>
                  <li>
                    Рамзи СМС ё PIN-коди <span className="font-semibold">Корти Миллиро</span> ба касе надиҳед.
                  </li>
                  <li>
                    Пайвандҳои шубҳаноки беруна (онлайн-касса)-ро пахш накунед.
                  </li>
                </ul>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <button
                    onClick={onOpenSafety}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    {language === 'tg' ? 'Қоидаҳои амниятӣ →' : 'Правила безопасности →'}
                  </button>
                  <button
                    onClick={() => onOpenReport(ad)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-white/80 px-2 py-0.5 rounded-md border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <Flag className="w-3 h-3 text-rose-600" />
                    <span>{language === 'tg' ? 'Хабар аз қаллобӣ' : 'Сообщить о мошенничестве'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t.adDescriptionLabel}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {ad.description}
            </p>
          </div>

          {/* Specifications / Characteristics */}
          {ad.specs && Object.keys(ad.specs).length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Хусусиятҳо / Характеристики
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(ad.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="block text-[11px] text-slate-400 font-medium">
                      {key}
                    </span>
                    <span className="block text-xs font-bold text-slate-800 mt-0.5">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Advertisements */}
          {similarAds.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                {t.similarAds}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarAds.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectAd(item);
                      setActiveImageIndex(0);
                      setPhoneRevealed(false);
                    }}
                    className="p-2 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50/50"
                  >
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-200 mb-2">
                      <img
                        src={resolveImageUrl(item.images[0])}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e)}
                      />
                    </div>
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs font-bold text-emerald-700 tabular-nums">
                      {new Intl.NumberFormat('ru-RU').format(item.price)}{' '}
                      {t.currencySymbol}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Copied Toast */}
        {copiedToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-30 animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{t.copiedPhone}</span>
          </div>
        )}
      </div>
    </div>
  );
};
