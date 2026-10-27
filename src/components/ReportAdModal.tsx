import React, { useState } from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

interface ReportAdModalProps {
  ad: ProductAd | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, details: string) => void;
}

export const ReportAdModal: React.FC<ReportAdModalProps> = ({
  ad,
  language,
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState('fraud');
  const [details, setDetails] = useState('');

  if (!isOpen || !ad) return null;

  const reasons = [
    {
      id: 'fraud',
      label: {
        tg: 'Қаллобӣ / Талаби пешпардохт',
        ru: 'Мошенничество / Требование предоплаты',
        en: 'Scam / Advance payment request',
      },
    },
    {
      id: 'fake_price',
      label: {
        tg: 'Нархи дурӯғ ё номувофиқ',
        ru: 'Неверная или заниженная цена',
        en: 'Misleading or incorrect price',
      },
    },
    {
      id: 'sold',
      label: {
        tg: 'Мол аллакай фурӯхта шудааст',
        ru: 'Товар уже продан',
        en: 'Item already sold',
      },
    },
    {
      id: 'counterfeit',
      label: {
        tg: 'Моли қалбакӣ (нусха / подделка)',
        ru: 'Поддельный или контрафактный товар',
        en: 'Counterfeit / fake item',
      },
    },
    {
      id: 'phone_wrong',
      label: {
        tg: 'Рақами телефон кор намекунад',
        ru: 'Номер телефона недоступен',
        en: 'Phone number invalid / inactive',
      },
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, details);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 w-full max-w-full box-border">
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {language === 'tg'
                ? 'Шикоят аз болои эълон'
                : language === 'ru'
                ? 'Пожаловаться на объявление'
                : 'Report Advertisement'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 w-full max-w-full box-border">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[11px] text-slate-400 block">
              {language === 'tg' ? 'Эълон:' : 'Объявление:'}
            </span>
            <span className="text-xs font-bold text-slate-800 line-clamp-1">
              {ad.title}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              {language === 'tg'
                ? 'Сабаби шикоятро интихоб кунед:'
                : 'Выберите причину жалобы:'}
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r.id
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-rose-600"
                  />
                  <span>{r.label[language]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              {language === 'tg'
                ? 'Шарҳи иловагӣ (ихтиёрӣ):'
                : 'Комментарий (необязательно):'}
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                language === 'tg'
                  ? 'Тафсилоти бештарро нависед...'
                  : 'Опишите подробнее...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {language === 'tg' ? 'Бекор кардан' : 'Отмена'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              {language === 'tg' ? 'Фиристодани шикоят' : 'Отправить жалобу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
