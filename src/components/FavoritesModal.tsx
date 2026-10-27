import React from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { Heart, X, Trash2 } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface FavoritesModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  allAds: ProductAd[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectAd: (ad: ProductAd) => void;
  onQuickCall: (ad: ProductAd, e: React.MouseEvent) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  language,
  isOpen,
  onClose,
  favorites,
  allAds,
  onToggleFavorite,
  onSelectAd,
  onQuickCall,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const favoriteAds = allAds.filter((ad) => favorites.includes(ad.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[90vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 w-full max-w-full box-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {t.favoritesTitle} ({favoriteAds.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto w-full max-w-full box-border">
          {favoriteAds.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{t.noFavorites}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-full box-border">
              {favoriteAds.map((ad) => (
                <ProductCard
                  key={ad.id}
                  ad={ad}
                  language={language}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onClick={() => {
                    onClose();
                    onSelectAd(ad);
                  }}
                  onQuickCall={onQuickCall}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
