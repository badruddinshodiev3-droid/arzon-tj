import React, { useState, useRef, useEffect } from 'react';
import { Language, FilterState, ProductAd } from '../types';
import { translations } from '../data/translations';
import { CITIES, CATEGORIES } from '../data/taxonomy';
import {
  Search,
  MapPin,
  Grid,
  X,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import {
  POPULAR_SEARCH_SUGGESTIONS,
  getLiveSearchPreviews,
} from '../utils/searchUtils';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

interface HeroSectionProps {
  language: Language;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (categoryId: string) => void;
  totalAdsCount: number;
  ads: ProductAd[];
  onSelectAd: (ad: ProductAd) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  filters,
  onFilterChange,
  onSearchSubmit,
  onSelectCategory,
  totalAdsCount,
  ads,
  onSelectAd,
}) => {
  const t = translations[language];
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live autocomplete results
  const previews = getLiveSearchPreviews(ads, filters.query, 5);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsFocused(false);
      onSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (queryStr: string) => {
    onFilterChange({ query: queryStr });
    setIsFocused(false);
    onSearchSubmit();
  };

  const handleSelectPreviewAd = (ad: ProductAd) => {
    setIsFocused(false);
    onSelectAd(ad);
  };

  return (
    <section className="relative overflow-hidden bg-slate-900 border-b border-slate-200 w-full max-w-full box-border">
      {/* Background Image with Contrast Scrim */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={resolveImageUrl('/images/arzon_hero_dushanbe_1792056747849.jpg')}
          alt="Dushanbe Tajikistan Marketplace"
          className="w-full h-full object-cover object-center opacity-45 scale-105 transform motion-safe:transition-transform duration-1000"
          onError={(e) => handleImageError(e)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-7 sm:py-10 md:py-14 w-full max-w-full box-border">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-white text-[11px] sm:text-xs font-medium mb-3 sm:mb-4 max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{t.tagline}</span>
            <span className="text-white/40 shrink-0">·</span>
            <span className="text-emerald-300 font-semibold shrink-0">
              {totalAdsCount}+ {t.foundAds.toLowerCase()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight break-words">
            {language === 'ru' ? (
              <span>
                Покупайте и продавайте выгодно на{' '}
                <span className="text-emerald-400">Arzon.tj</span>
              </span>
            ) : language === 'en' ? (
              <span>
                Find and buy everything fast and affordable on{' '}
                <span className="text-emerald-400">Arzon.tj</span>
              </span>
            ) : (
              <span>
                Ҳама чизро дар <span className="text-emerald-400">Arzon.tj</span>{' '}
                тез ва арзон пайдо кунед
              </span>
            )}
          </h1>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-lg text-slate-200 text-pretty max-w-2xl font-normal">
            {t.subTagline}
          </p>
        </div>

        {/* Central Search Box with Live Autocomplete */}
        <div
          ref={containerRef}
          className="relative mt-5 sm:mt-7 bg-white/95 backdrop-blur-lg rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/40 w-full max-w-full box-border"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 w-full max-w-full box-border">
            {/* Search Input Field */}
            <div className="relative md:col-span-5 flex items-center w-full max-w-full box-border">
              <Search className="absolute left-3.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none shrink-0" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => onFilterChange({ query: e.target.value })}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium box-border"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange({ query: '' });
                  }}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="relative md:col-span-3 flex items-center border-t md:border-t-0 md:border-l border-slate-200/80 w-full max-w-full box-border">
              <MapPin className="absolute left-3 w-4 h-4 text-emerald-600 pointer-events-none shrink-0" />
              <select
                value={filters.city}
                onChange={(e) =>
                  onFilterChange({ city: e.target.value, district: '' })
                }
                className="w-full pl-9 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 bg-transparent rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium appearance-none cursor-pointer box-border"
              >
                <option value="all">{t.allCities}</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[language]}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="relative md:col-span-2 flex items-center border-t md:border-t-0 md:border-l border-slate-200/80 w-full max-w-full box-border">
              <Grid className="absolute left-3 w-4 h-4 text-emerald-600 pointer-events-none shrink-0" />
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 bg-transparent rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium appearance-none cursor-pointer box-border"
              >
                <option value="all">{t.allCategories}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name[language]}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex items-stretch w-full max-w-full box-border">
              <button
                type="button"
                onClick={() => {
                  setIsFocused(false);
                  onSearchSubmit();
                }}
                className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap box-border"
              >
                <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>{t.searchButton}</span>
              </button>
            </div>
          </div>

          {/* Live Autocomplete Dropdown Popup */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 sm:p-3 z-50 animate-in fade-in zoom-in-95 duration-150 w-full max-w-full box-border overflow-hidden">
              {filters.query.trim() ? (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {language === 'tg'
                        ? 'Натиҷаҳои фаврӣ:'
                        : language === 'ru'
                        ? 'Быстрые результаты:'
                        : 'Quick results:'}
                    </span>
                    <span className="text-emerald-700 font-bold tabular-nums">
                      {previews.length > 0
                        ? `${previews.length} ${language === 'tg' ? 'эълон' : 'объявлений'}`
                        : language === 'tg'
                        ? 'Ҳеҷ чиз ёфт нашуд'
                        : 'Ничего не найдено'}
                    </span>
                  </div>

                  {previews.length > 0 ? (
                    <div className="space-y-1">
                      {previews.map((ad) => (
                        <button
                          key={ad.id}
                          type="button"
                          onClick={() => handleSelectPreviewAd(ad)}
                          className="w-full flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors cursor-pointer group box-border"
                        >
                          <img
                            src={resolveImageUrl(ad.images[0])}
                            alt={ad.title}
                            className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0 border border-slate-200"
                            onError={(e) => handleImageError(e)}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-700">
                              {ad.title}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                              <span className="font-bold text-emerald-600 tabular-nums shrink-0">
                                {ad.price.toLocaleString('ru-RU')} {t.currencySymbol}
                              </span>
                              <span>·</span>
                              <span className="truncate">
                                {CITIES.find((c) => c.id === ad.city)?.name[language] ||
                                  ad.city}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onSearchSubmit();
                        }}
                        className="w-full mt-2 py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer box-border"
                      >
                        {language === 'tg'
                          ? `Ҳамаи натиҷаҳоро дар каталог кушоед →`
                          : `Показать все результаты в каталоге →`}
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <p className="text-xs text-slate-500 mb-2">
                        {language === 'tg'
                          ? `Барои «${filters.query}» эълоне ёфт нашуд.`
                          : `По запросу «${filters.query}» ничего не найдено.`}
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {POPULAR_SEARCH_SUGGESTIONS.slice(0, 4).map((sugg) => (
                          <button
                            key={sugg.query}
                            type="button"
                            onClick={() => handleSelectSuggestion(sugg.query)}
                            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 rounded-lg cursor-pointer"
                          >
                            {sugg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Popular searches when query is empty */
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2 pb-1 border-b border-slate-100">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {language === 'tg'
                        ? 'Ҷустуҷӯҳои машҳур дар Тоҷикистон:'
                        : language === 'ru'
                        ? 'Популярные поиски в Таджикистане:'
                        : 'Popular searches:'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCH_SUGGESTIONS.map((sugg) => (
                      <button
                        key={sugg.query}
                        type="button"
                        onClick={() => handleSelectSuggestion(sugg.query)}
                        className="text-[11px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent text-slate-700 font-medium rounded-xl transition-all cursor-pointer"
                      >
                        {sugg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Category Bar */}
        <div className="mt-4 sm:mt-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-full box-border -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              filters.category === 'all'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            {t.allCategories}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                filters.category === cat.id
                  ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              {cat.name[language]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
