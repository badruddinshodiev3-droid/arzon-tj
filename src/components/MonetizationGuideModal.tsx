import React, { useState } from 'react';
import { Language } from '../types';
import {
  DollarSign,
  X,
  TrendingUp,
  CreditCard,
  Building2,
  Crown,
  Zap,
  CheckCircle2,
  Calculator,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface MonetizationGuideModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onOpenPromoteDemo: () => void;
}

export const MonetizationGuideModal: React.FC<MonetizationGuideModalProps> = ({
  language,
  isOpen,
  onClose,
  onOpenPromoteDemo,
}) => {
  // Interactive Calculator State
  const [dailyVipAds, setDailyVipAds] = useState(25);
  const [dailyTurboBumps, setDailyTurboBumps] = useState(40);
  const [activeStores, setActiveStores] = useState(20);
  const [bannerCount, setBannerCount] = useState(2);

  if (!isOpen) return null;

  // Calculations (in Somoni)
  // VIP: 15 TJS, Turbo: 5 TJS, Store subscription: 200 TJS/month, Banner: 1500 TJS/month
  const monthlyVipRevenue = dailyVipAds * 15 * 30;
  const monthlyTurboRevenue = dailyTurboBumps * 5 * 30;
  const monthlyStoreRevenue = activeStores * 200;
  const monthlyBannerRevenue = bannerCount * 1500;
  const totalMonthlyRevenue =
    monthlyVipRevenue +
    monthlyTurboRevenue +
    monthlyStoreRevenue +
    monthlyBannerRevenue;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white w-full max-w-full box-border">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-bold truncate">
                {language === 'tg'
                  ? 'Роҳнамои даромадгирӣ аз Arzon.tj'
                  : language === 'ru'
                  ? 'Как монетизировать маркетплейс Arzon.tj'
                  : 'Arzon.tj Marketplace Monetization Guide'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                {language === 'tg'
                  ? '4 роҳи асосии ба даст овардани даромад дар Тоҷикистон'
                  : '4 основных способа заработка на сайте объявлений в Таджикистане'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-slate-700 text-xs sm:text-sm w-full max-w-full box-border">
          {/* 4 Pillars of Marketplace Revenue in Tajikistan */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>4 манбаи асосии пулкоркунӣ (мисли Somon.tj ва Avito)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Stream 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      Хизматрасониҳои пулакӣ (VIP, Турбо, Ранг)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    50% даромад
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Фурӯшандагон мехоҳанд мошин, телефон ё хонаи худро тезтар фурӯшанд. Онҳо барои дар садри ҷустуҷӯ истодан ва нишони VIP аз <strong>5 то 25 сомонӣ</strong> пардохт мекунанд.
                </p>
              </div>

              {/* Stream 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      Мағозаҳои касбӣ (Тарофаи Pro / Бизнес)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    30% даромад
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Барои одамони оддӣ гузоштани эълон ройгон мемонад. Аммо автосалонҳо, агентиҳои амвол ва мағозаҳои телефон барои гузоштани 20–100 эълон моҳона <strong>150 то 500 сомонӣ</strong> обуна месупоранд.
                </p>
              </div>

              {/* Stream 3 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      Рекламаи баннерӣ (Банкҳо ва ширкатҳо)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    15% даромад
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ҷойгиркунии баннерҳои рекламавӣ аз бонкҳои Тоҷикистон (Алиф, Эсхата, DC), ширкатҳои сохтмонӣ ва операторони мобилӣ (Tcell, Megafon, Babilon). Ҳар як баннер моҳона <strong>1 000 – 3 000 сомонӣ</strong> меорад.
                </p>
              </div>

              {/* Stream 4 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      Муомилаи амн (Safe Deal / Доставка)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    5% даромад
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Комиссияи хурд (1-2%) аз хариду фурӯши молҳо бо кафолати сайт, ки пул то гирифтани мол дар депозит нигоҳ дошта мешавад.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">
                  Ҳисобкунаки даромади эҳтимолии сомона дар як моҳ
                </h4>
              </div>
              <span className="text-xs text-emerald-400 font-mono">
                Тоҷикистон (сомонӣ)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between mb-1 text-slate-300">
                  <span>VIP эълон дар 1 рӯз:</span>
                  <span className="font-bold text-white tabular-nums">
                    {dailyVipAds} адад (15 с.)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={dailyVipAds}
                  onChange={(e) => setDailyVipAds(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between mb-1 text-slate-300">
                  <span>Турбо-бардоштан дар 1 рӯз:</span>
                  <span className="font-bold text-white tabular-nums">
                    {dailyTurboBumps} адад (5 с.)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={dailyTurboBumps}
                  onChange={(e) => setDailyTurboBumps(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex justify-between mb-1 text-slate-300">
                  <span>Обунаи мағозаҳо дар 1 моҳ:</span>
                  <span className="font-bold text-white tabular-nums">
                    {activeStores} мағоза (200 с.)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={activeStores}
                  onChange={(e) => setActiveStores(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 4 */}
              <div>
                <div className="flex justify-between mb-1 text-slate-300">
                  <span>Баннерҳои рекламавӣ:</span>
                  <span className="font-bold text-white tabular-nums">
                    {bannerCount} баннер (1 500 с.)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={bannerCount}
                  onChange={(e) => setBannerCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Total Result */}
            <div className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 block">
                  Даромади тахминии моҳона:
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
                  ~ {new Intl.NumberFormat('ru-RU').format(totalMonthlyRevenue)}{' '}
                  сомонӣ
                </div>
              </div>

              <div className="text-[11px] text-slate-300 text-right">
                (~ $
                {Math.round(totalMonthlyRevenue / 10.9).toLocaleString('ru-RU')}{' '}
                USD дар 1 моҳ)
              </div>
            </div>
          </div>

          {/* Payment Gateways in Tajikistan */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Чӣ тавр пардохтҳоро (Alif, DC, Корти Миллӣ) дар асл қабул кунем?</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <strong className="text-emerald-950 block mb-0.5">
                  1. Алиф Бонк (Alif Pay / Alif Merchant API):
                </strong>
                Шумо метавонед ба сомонаи <strong>alif.tj</strong> муроҷиат намоед ё ба шуъбаи кор бо тиҷорат (Alif Business) ариза диҳед. Онҳо ба шумо калиди API (Merchant ID) медиҳанд, ки харидорон тавассути замимаи <strong>Alif Mobi</strong> бо QR-код ё ворид кардани рақами телефон маблағро пардохт мекунанд.
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <strong className="text-blue-950 block mb-0.5">
                  2. Dushanbe City (DC Processing):
                </strong>
                Пайвастшавӣ ба коркарди Dushanbe City барои қабули маблағ аз ҳамаи ҳамёнҳои DC ва кортҳои нақлиётиву бонкии DC.
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block mb-0.5">
                  3. Корти Миллӣ (Интернет-эквайринг):
                </strong>
                Тавассути шартнома бо Бонки Эсхата ё Амонатбонк, сомона метавонад кортҳои ҳамаи бонкҳои Тоҷикистонро бо санҷиши 3D-Secure қабул кунад.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Ин модели воқеии тиҷорат барои Тоҷикистон аст
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Пӯшидан
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenPromoteDemo();
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Санҷиши пешбурди VIP</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
