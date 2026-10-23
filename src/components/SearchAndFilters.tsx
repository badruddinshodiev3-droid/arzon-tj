import React, { useState } from 'react';
import { Language, FilterState, SortOption } from '../types';
import { translations } from '../data/translations';
import { CITIES, CATEGORIES } from '../data/taxonomy';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  MapPin,
  Grid,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface SearchAndFiltersProps {
  language: Language;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  resultsCount: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  language,
  filters,
  onFilterChange,
  onResetFilters,
  resultsCount,
}) => {
  const t = translations[language];
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const selectedCityObj = CITIES.find((c) => c.id === filters.city);
  const availableDistricts = selectedCityObj?.districts || [];

  const hasActiveFilters =
    Boolean(filters.query) ||
    filters.category !== 'all' ||
    filters.city !== 'all' ||
    Boolean(filters.district) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    filters.condition !== 'all' ||
    filters.onlyNegotiable ||
    filters.onlyWithPhotos ||
    filters.sortBy !== 'newest';

  const applyPricePreset = (min: string, max: string) => {
    onFilterChange({ minPrice: min, maxPrice: max });
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-30 shadow-2xs w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 w-full max-w-full box-border">
        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 w-full max-w-full">
          {/* Left: Search input + mobile filter button */}
          <div className="flex items-center gap-2 flex-1 min-w-0 w-full max-w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => onFilterChange({ query: e.target.value })}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 transition-colors box-border"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ query: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className={`lg:hidden flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                hasActiveFilters
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>{t.filterTitle}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              )}
            </button>
          </div>

          {/* Right: Quick Sort Dropdown + Result Count + Desktop Filter Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end shrink-0 w-full sm:w-auto">
            <div className="text-xs text-slate-500 whitespace-nowrap">
              <span>{t.foundAds}: </span>
              <strong className="text-slate-900 tabular-nums font-bold">
                {resultsCount}
              </strong>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onFilterChange({ sortBy: e.target.value as SortOption })
                }
                className="py-1.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="price_asc">{t.sortPriceAsc}</option>
                <option value="price_desc">{t.sortPriceDesc}</option>
                <option value="popular">{t.sortPopular}</option>
              </select>
            </div>

            {/* Desktop Reset Button if active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer whitespace-nowrap"
                title={t.resetFilters}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFilters}</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Filter Bar: Category, City, District, Price Range */}
        <div className="hidden lg:grid grid-cols-12 gap-3 mt-3 pt-3 border-t border-slate-100 items-center w-full max-w-full">
          {/* Category Dropdown */}
          <div className="col-span-3">
            <div className="relative">
              <Grid className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">{t.allCategories}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City Dropdown */}
          <div className="col-span-3">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filters.city}
                onChange={(e) =>
                  onFilterChange({ city: e.target.value, district: '' })
                }
                className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">{t.allCities}</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[language]} ({c.region[language]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District Dropdown (if selected city has districts) */}
          <div className="col-span-2">
            <select
              value={filters.district}
              disabled={availableDistricts.length === 0}
              onChange={(e) => onFilterChange({ district: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer disabled:opacity-40"
            >
              <option value="">{t.allDistricts}</option>
              {availableDistricts.map((d, idx) => (
                <option key={idx} value={d[language]}>
                  {d[language]}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Price Ranges */}
          <div className="col-span-4 flex items-center gap-1.5 justify-end">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {t.price}:
            </span>
            <button
              type="button"
              onClick={() => applyPricePreset('', '500')}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                filters.maxPrice === '500' && !filters.minPrice
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t.priceUnder500}
            </button>
            <button
              type="button"
              onClick={() => applyPricePreset('500', '2000')}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                filters.minPrice === '500' && filters.maxPrice === '2000'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t.price500to2000}
            </button>
            <button
              type="button"
              onClick={() => applyPricePreset('2000', '10000')}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                filters.minPrice === '2000' && filters.maxPrice === '10000'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t.price2000to10000}
            </button>
            <button
              type="button"
              onClick={() => applyPricePreset('10000', '')}
              className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                filters.minPrice === '10000' && !filters.maxPrice
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t.priceAbove10000}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Filter Drawer */}
        {mobileFilterOpen && (
          <div className="lg:hidden mt-2.5 pt-2.5 border-t border-slate-200 space-y-3 animate-in fade-in duration-200 w-full max-w-full box-border">
            {/* Category */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.adCategoryLabel}
              </label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 box-border"
              >
                <option value="all">{t.allCategories}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[language]}
                  </option>
                ))}
              </select>
            </div>

            {/* City & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.adCityLabel}
                </label>
                <select
                  value={filters.city}
                  onChange={(e) =>
                    onFilterChange({ city: e.target.value, district: '' })
                  }
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 box-border"
                >
                  <option value="all">{t.allCities}</option>
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.adDistrictLabel}
                </label>
                <select
                  value={filters.district}
                  disabled={availableDistricts.length === 0}
                  onChange={(e) => onFilterChange({ district: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:opacity-50 box-border"
                >
                  <option value="">{t.allDistricts}</option>
                  {availableDistricts.map((d, idx) => (
                    <option key={idx} value={d[language]}>
                      {d[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.price} ({t.somoni})
              </label>
              <div className="flex items-center gap-2 w-full">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange({ minPrice: e.target.value })}
                  placeholder={t.minPrice}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg box-border"
                />
                <span className="text-slate-400 shrink-0">—</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                  placeholder={t.maxPrice}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg box-border"
                />
              </div>
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1 w-full">
              <button
                type="button"
                onClick={() => applyPricePreset('', '500')}
                className="px-2 py-1 rounded bg-slate-100 text-[11px] text-slate-700 cursor-pointer"
              >
                {t.priceUnder500}
              </button>
              <button
                type="button"
                onClick={() => applyPricePreset('500', '2000')}
                className="px-2 py-1 rounded bg-slate-100 text-[11px] text-slate-700 cursor-pointer"
              >
                {t.price500to2000}
              </button>
              <button
                type="button"
                onClick={() => applyPricePreset('2000', '10000')}
                className="px-2 py-1 rounded bg-slate-100 text-[11px] text-slate-700 cursor-pointer"
              >
                {t.price2000to10000}
              </button>
              <button
                type="button"
                onClick={() => applyPricePreset('10000', '')}
                className="px-2 py-1 rounded bg-slate-100 text-[11px] text-slate-700 cursor-pointer"
              >
                {t.priceAbove10000}
              </button>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 w-full">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyNegotiable}
                  onChange={(e) =>
                    onFilterChange({ onlyNegotiable: e.target.checked })
                  }
                  className="accent-emerald-600 rounded"
                />
                <span>{t.onlyNegotiableFilter}</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyWithPhotos}
                  onChange={(e) =>
                    onFilterChange({ onlyWithPhotos: e.target.checked })
                  }
                  className="accent-emerald-600 rounded"
                />
                <span>{t.onlyPhotos}</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 w-full">
              <button
                type="button"
                onClick={onResetFilters}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                {t.resetFilters}
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg cursor-pointer"
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
