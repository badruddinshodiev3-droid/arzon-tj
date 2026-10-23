import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { CITIES } from '../data/taxonomy';
import { ShieldCheck, Phone, MapPin, Database } from 'lucide-react';

interface FooterProps {
  language: Language;
  onSelectCity: (cityId: string) => void;
  onOpenSafety: () => void;
  onOpenPlayGuide: () => void;
  onOpenSupabase?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onSelectCity,
  onOpenSafety,
  onOpenPlayGuide,
  onOpenSupabase,
}) => {
  const t = translations[language];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-32 lg:pb-12 w-full max-w-full box-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 w-full max-w-full">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                A
              </div>
              <span className="text-xl font-extrabold text-white">
                Arzon<span className="text-emerald-400">.tj</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerTagline}
            </p>
            <div className="pt-1 text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>🇹🇯 Тоҷикистон</span>
              <span>·</span>
              <span>Сомонӣ (TJS)</span>
            </div>
          </div>

          {/* Major Cities of Tajikistan */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t.navCities}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(c.id);
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className="text-left text-xs text-slate-400 hover:text-emerald-400 transition-colors py-1 cursor-pointer truncate"
                >
                  {c.name[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Safety & Help */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {t.navSafety}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenSafety}
                  className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t.safetyNoticeTitle}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenPlayGuide}
                  className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Google Play Market (
                    {language === 'tg'
                      ? 'Насб кардан'
                      : language === 'ru'
                      ? 'Установить'
                      : 'Install'}
                    )
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSupabase) onOpenSupabase();
                    window.dispatchEvent(new CustomEvent('arzontj:open-supabase-setup'));
                  }}
                  className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left font-medium"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'tg'
                      ? 'Танзимоти Supabase (Пойгоҳи онлайн)'
                      : language === 'ru'
                      ? 'Настройки Supabase (Онлайн-база)'
                      : 'Supabase Settings (Online DB)'}
                  </span>
                </button>
              </li>
              <li className="text-slate-400">
                <span>
                  {language === 'tg'
                    ? 'Маслиҳатҳо барои харидорон'
                    : language === 'ru'
                    ? 'Советы для покупателей'
                    : 'Buyer guidelines'}
                </span>
              </li>
              <li className="text-slate-400">
                <span>
                  {language === 'tg'
                    ? 'Қоидаҳои ҷойгиркунии эълон'
                    : language === 'ru'
                    ? 'Правила размещения объявлений'
                    : 'Posting guidelines'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Prominent Supabase Setup Action for Android & Web */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (onOpenSupabase) onOpenSupabase();
              window.dispatchEvent(new CustomEvent('arzontj:open-supabase-setup'));
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer text-xs sm:text-sm font-semibold shadow-sm"
          >
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'tg'
                ? 'Танзимоти Supabase (Пойгоҳи онлайн)'
                : language === 'ru'
                ? 'Настройки Supabase (Онлайн-база)'
                : 'Supabase Settings (Online DB)'}
            </span>
          </button>

          <p className="text-xs text-slate-500 text-center sm:text-right">
            {t.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
};
