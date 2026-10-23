import React from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { resolveImageUrl, handleImageError, FALLBACK_IMAGE } from '../utils/imageUtils';
import {
  Building,
  Home,
  Car,
  Briefcase,
  Smartphone,
  Grid,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SomonHomeHubProps {
  language: Language;
  onSelectCategory: (categoryId: string) => void;
  onOpenPromoteDemo: () => void;
  onSelectAd: (ad: ProductAd) => void;
  ads: ProductAd[];
  scrollToCatalog: () => void;
}

export const SomonHomeHub: React.FC<SomonHomeHubProps> = ({
  language,
  onSelectCategory,
  onOpenPromoteDemo,
  onSelectAd,
  ads,
  scrollToCatalog,
}) => {
  const t = translations[language];

  // Stories matching Somon.tj mobile app
  const stories = [
    {
      id: 'story-vip',
      label:
        language === 'tg'
          ? 'Чӣ тавр тезтар фурӯшем?'
          : language === 'ru'
          ? 'Как продать быстрее'
          : 'How to sell faster',
      sub:
        language === 'tg'
          ? 'VIP хизматҳо'
          : language === 'ru'
          ? 'VIP услуги'
          : 'VIP services',
      bg: 'from-amber-600 via-amber-700 to-amber-900',
      badge: 'PRO',
      onClick: onOpenPromoteDemo,
    },
    {
      id: 'story-dyson',
      label: 'Dyson & Apple',
      sub:
        language === 'tg'
          ? 'Техникаи нав'
          : language === 'ru'
          ? 'Новинки'
          : 'New arrivals',
      bg: 'from-slate-800 via-slate-900 to-black',
      badge: 'TOP',
      onClick: () => {
        onSelectCategory('electronics');
        scrollToCatalog();
      },
    },
    {
      id: 'story-season',
      label:
        language === 'tg'
          ? 'Мавсими тирамоҳ'
          : language === 'ru'
          ? 'Сезон продаж'
          : 'Season sales',
      sub:
        language === 'tg'
          ? 'Гармкунакҳо'
          : language === 'ru'
          ? 'Отопление'
          : 'Heaters',
      bg: 'from-blue-700 via-blue-800 to-indigo-950',
      badge: 'NEW',
      onClick: () => {
        onSelectCategory('home-garden');
        scrollToCatalog();
      },
    },
    {
      id: 'story-ev',
      label:
        language === 'tg'
          ? 'Электромобилҳо'
          : language === 'ru'
          ? 'Электрокары'
          : 'Electric cars',
      sub: 'BYD & Toyota',
      bg: 'from-emerald-700 via-teal-800 to-slate-950',
      badge: 'EV',
      onClick: () => {
        onSelectCategory('auto');
        scrollToCatalog();
      },
    },
  ];

  // 6 Main Rubrics exactly like Somon.tj screenshot
  const rubrics = [
    {
      id: 'real-estate-new',
      catId: 'real-estate',
      label: { tg: 'Биноҳои нав', ru: 'Новостройки', en: 'New Buildings' },
      icon: Building,
      color: 'bg-amber-500/15 text-amber-500',
    },
    {
      id: 'real-estate',
      catId: 'real-estate',
      label: { tg: 'Амвол', ru: 'Недвижимость', en: 'Real Estate' },
      icon: Home,
      color: 'bg-rose-500/15 text-rose-500',
    },
    {
      id: 'auto',
      catId: 'auto',
      label: { tg: 'Нақлиёт', ru: 'Транспорт', en: 'Vehicles' },
      icon: Car,
      color: 'bg-blue-500/15 text-blue-500',
    },
    {
      id: 'services',
      catId: 'services',
      label: { tg: 'Вакансии (Кор)', ru: 'Вакансии', en: 'Jobs' },
      icon: Briefcase,
      color: 'bg-purple-500/15 text-purple-500',
    },
    {
      id: 'electronics',
      catId: 'electronics',
      label: { tg: 'Телефон ва с...', ru: 'Телефоны и с...', en: 'Phones' },
      icon: Smartphone,
      color: 'bg-cyan-500/15 text-cyan-500',
    },
    {
      id: 'all',
      catId: 'all',
      label: { tg: 'Ҳама бахшҳо', ru: 'Все рубрики', en: 'All Categories' },
      icon: Grid,
      color: 'bg-emerald-500/15 text-emerald-500',
    },
  ];

  // Heating showcase ads (matching Somon.tj "Всё для отопления")
  const heatingAds = ads
    .filter(
      (a) =>
        a.id === 'ad-09' ||
        a.id === 'ad-10' ||
        (a.category === 'home-garden' && a.price < 1000)
    )
    .slice(0, 4);

  // EV & Auto showcase ads (matching Somon.tj "Электромобили и гибриды")
  const evAds = ads.filter((a) => a.category === 'auto').slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-7 w-full max-w-full box-border overflow-hidden">
      {/* 1. Somon.tj Stories / Highlights Strip */}
      <div className="w-full max-w-full box-border">
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none w-full max-w-full box-border -mx-3 px-3 sm:mx-0 sm:px-0">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={story.onClick}
              className={`relative min-w-[125px] sm:min-w-[150px] h-24 sm:h-28 rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br ${story.bg} text-white text-left flex flex-col justify-between overflow-hidden shadow-xs hover:scale-102 active:scale-98 transition-all shrink-0 cursor-pointer box-border`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs">
                  {story.badge}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-white/60" />
              </div>
              <div className="w-full overflow-hidden">
                <span className="text-[10px] text-white/70 block leading-tight truncate">
                  {story.sub}
                </span>
                <span className="text-xs font-bold block leading-tight mt-0.5 truncate">
                  {story.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Somon.tj 6-Category Grid Tiles */}
      <div className="w-full max-w-full box-border">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 w-full max-w-full box-border">
          {rubrics.map((r) => {
            const IconComp = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelectCategory(r.catId);
                  scrollToCatalog();
                }}
                className="bg-slate-900/95 hover:bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3.5 flex flex-col items-center justify-center text-center group transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer w-full max-w-full box-border overflow-hidden"
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-2 transition-transform group-hover:scale-110 shrink-0 ${r.color}`}
                >
                  <IconComp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate max-w-full block leading-tight">
                  {r.label[language]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Curated Showcase Row 1: Всё для отопления (Heating) */}
      {heatingAds.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3 w-full max-w-full box-border">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span className="truncate">
                {language === 'tg'
                  ? 'Таҷҳизот барои гармкунӣ'
                  : language === 'ru'
                  ? 'Всё для отопления'
                  : 'Heating Equipment'}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('home-garden');
                scrollToCatalog();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{language === 'tg' ? 'Ҳамааш' : language === 'ru' ? 'Все' : 'All'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-full box-border">
            {heatingAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => onSelectAd(ad)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col w-full max-w-full box-border"
              >
                <div className="aspect-4/3 bg-slate-100 overflow-hidden relative w-full">
                  <img
                    src={resolveImageUrl(ad.images[0])}
                    alt={ad.title}
                    onError={(e) => handleImageError(e, ad.category)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {ad.isUrgent && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                      {language === 'tg' ? 'Фаврӣ' : language === 'ru' ? 'Срочно' : 'Urgent'}
                    </span>
                  )}
                </div>
                <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between w-full max-w-full box-border">
                  <div className="text-sm sm:text-lg font-extrabold text-slate-900 tabular-nums truncate">
                    {new Intl.NumberFormat('ru-RU').format(ad.price)}{' '}
                    <span className="text-xs font-semibold text-emerald-700">
                      {t.currencySymbol}
                    </span>
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-medium text-slate-700 line-clamp-2 mt-1 leading-snug break-words">
                    {ad.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Curated Showcase Row 2: Электромобили и гибриды */}
      {evAds.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3 w-full max-w-full box-border">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span className="truncate">
                {language === 'tg'
                  ? 'Электромобилҳо ва нақлиёт'
                  : language === 'ru'
                  ? 'Электромобили и гибриды'
                  : 'Electric & Hybrid Cars'}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('auto');
                scrollToCatalog();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{language === 'tg' ? 'Ҳамааш' : language === 'ru' ? 'Все' : 'All'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-full box-border">
            {evAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => onSelectAd(ad)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col w-full max-w-full box-border"
              >
                <div className="aspect-4/3 bg-slate-100 overflow-hidden relative w-full">
                  <img
                    src={resolveImageUrl(ad.images[0])}
                    alt={ad.title}
                    onError={(e) => handleImageError(e, ad.category)}
                    className="w-full h-full object-cover"
                  />
                  {ad.isVip && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                      VIP
                    </span>
                  )}
                </div>
                <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between w-full max-w-full box-border">
                  <div className="text-sm sm:text-lg font-extrabold text-slate-900 tabular-nums truncate">
                    {new Intl.NumberFormat('ru-RU').format(ad.price)}{' '}
                    <span className="text-xs font-semibold text-emerald-700">
                      {t.currencySymbol}
                    </span>
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-medium text-slate-700 line-clamp-2 mt-1 leading-snug break-words">
                    {ad.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
