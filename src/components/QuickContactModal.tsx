import React, { useState } from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { Phone, MessageCircle, Copy, Check, X, ShieldAlert, MessageSquare } from 'lucide-react';

interface QuickContactModalProps {
  ad: ProductAd | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: (ad: ProductAd) => void;
}

export const QuickContactModal: React.FC<QuickContactModalProps> = ({
  ad,
  language,
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ad) return null;

  const cleanPhone = ad.phone.replace(/[^0-9+]/g, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(ad.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 w-full max-w-full box-border">
          <h3 className="text-sm font-bold text-slate-900 truncate pr-2">
            {t.contactSellerModalTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 w-full max-w-full box-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center">
              {ad.sellerName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {ad.sellerName}
              </h4>
              <p className="text-xs text-slate-400 truncate">{ad.title}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <span className="text-base font-bold text-slate-900 font-mono tracking-wide">
              {ad.phone}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Copy"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(ad);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.chatWithSeller || 'Чат бо фурӯшанда'}</span>
              </button>
            )}

            <a
              href={`tel:${cleanPhone}`}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>{t.callSeller}</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                `Салом! Ман дар Arzon.tj эълони шуморо дидам: ${ad.title}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.whatsappChat}</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-snug">
            {t.safetyNotice1}
          </p>
        </div>
      </div>
    </div>
  );
};
