import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import {
  ShieldCheck,
  X,
  CreditCard,
  Smartphone,
  Car,
  AlertTriangle,
  Lock,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface SafetyModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'rules' | 'imei' | 'cards'>('rules');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[90vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-emerald-50/50 w-full max-w-full box-border">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {language === 'tg'
                  ? 'Маркази бехатарии Arzon.tj'
                  : language === 'ru'
                  ? 'Центр безопасности Arzon.tj'
                  : 'Arzon.tj Safety Center'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                {language === 'tg'
                  ? 'Қоидаҳои ҳимоя аз қаллобӣ дар Тоҷикистон'
                  : language === 'ru'
                  ? 'Правила защиты от мошенников в Таджикистане'
                  : 'Scam protection rules in Tajikistan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1.5 sm:p-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold overflow-x-auto scrollbar-none w-full max-w-full box-border">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap text-center ${
              activeTab === 'rules'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'tg'
              ? 'Қоидаҳои асосӣ'
              : language === 'ru'
              ? 'Главные правила'
              : 'Main rules'}
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap text-center ${
              activeTab === 'cards'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'tg'
              ? 'Ҳимояи кортҳо'
              : language === 'ru'
              ? 'Защита карт'
              : 'Card safety'}
          </button>
          <button
            onClick={() => setActiveTab('imei')}
            className={`flex-1 py-2 px-3 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'imei'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'tg' ? 'Санҷиши IMEI.tj' : 'Проверка IMEI'}
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-950">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-rose-900">
                    {language === 'tg'
                      ? 'Ҳеҷ гоҳ пешпардохт накунед!'
                      : 'Никогда не делайте предоплату!'}
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    {language === 'tg'
                      ? 'Агар фурӯшанда гӯяд, ки "молро ба таксӣ медиҳам" ё "пешакӣ 100 сомонӣ фиристед то нигоҳ дорам" — ин 99% қаллобӣ аст. Пардохт танҳо пас аз дидани мол дар даст!'
                      : 'Если продавец просит отправить аванс или говорит "отправлю через такси" — это мошенничество. Оплата только лично при осмотре!'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {language === 'tg'
                        ? 'Мулоқот дар ҷойҳои серодам'
                        : 'Встречайтесь в людных местах'}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'tg'
                        ? 'Барои мулоқот марказҳои савдо, назди бозорҳо ё хиёбонҳои равшану камерадорро интихоб намоед.'
                        : 'Выбирайте торговые центры, кафе или освещенные улицы с камерами.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {language === 'tg'
                        ? 'Санҷиши ҳолати техникии мол'
                        : 'Проверяйте исправность на месте'}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'tg'
                        ? 'Телефонро бо симкорти худ санҷед, мошинро ба усто нишон диҳед, электроникаро ба розетка пайваст кунед.'
                        : 'Вставьте свою сим-карту в телефон, покажите авто автомеханику перед покупкой.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-amber-950">
                    {language === 'tg'
                      ? 'Огоҳӣ аз қаллобони Корти Миллӣ / Алиф / DC'
                      : 'Осторожно: Мошенничество с картами Корти Милли'}
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                    {language === 'tg'
                      ? 'Қаллобон метавонанд тавассути WhatsApp нависанд ва гӯянд, ки маблағро пардохт карданд ва ба шумо истинод (ссылка) мефиристанд. ҲЕҶ ГОҲ маълумоти корти худро дар сайтҳои бегона нанависед!'
                      : 'Мошенники пишут в WhatsApp, присылают поддельные ссылки на курьерскую доставку и просят ввести номер карты и код из СМС.'}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    {language === 'tg'
                      ? 'Ҳеҷ гоҳ рамзи 4-рақамаи СМС-ро ба касе нагӯед'
                      : 'Никому не сообщайте СМС-код от банка'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    {language === 'tg'
                      ? 'Рақами серақамаи пушти корт (CVC/CVV)-ро надиҳед'
                      : 'Не передавайте CVC/CVV код с обратной стороны карты'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    {language === 'tg'
                      ? 'Arzon.tj ҳеҷ гоҳ барои пардохт пайванди фиреб намефиристад'
                      : 'Arzon.tj никогда не просит данные банковских карт'}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'imei' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                    {language === 'tg'
                      ? 'Санҷиши ҳатмии IMEI дар Тоҷикистон'
                      : 'Обязательная проверка IMEI в Таджикистане'}
                  </h4>
                  <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                    {language === 'tg'
                      ? 'Пеш аз харидани ҳар як телефони мобилӣ ё планшет, рамзи *#06#-ро дар телефон чинед ва IMEI-и онро дар сомонаи расмии imei.tj бисанҷед.'
                      : 'Перед покупкой наберите *#06# и проверьте статус регистрации телефона на официальном портале imei.tj.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">
                  {language === 'tg' ? 'Қадамҳои санҷиш:' : 'Шаги проверки:'}
                </div>
                <div>1. Дар телефон чинед: <code className="bg-white px-1.5 py-0.5 rounded border font-mono font-bold text-emerald-700">*#06#</code></div>
                <div>2. Рақами 15-рақамаро дар сомонаи <strong className="text-slate-900">imei.tj</strong> ворид намоед</div>
                <div>3. Мутмаин шавед, ки статус сабтшуда (бе сабти дубора) мебошад.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Arzon.tj — Бехатарии шумо барои мо муҳим аст
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Фаҳмо / Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
