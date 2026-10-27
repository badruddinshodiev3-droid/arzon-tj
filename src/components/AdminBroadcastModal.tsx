import React, { useState } from 'react';
import { Language, AnnouncementType } from '../types';
import { addAdminAnnouncement } from '../utils/adminMessageUtils';
import {
  X,
  Send,
  Shield,
  Sparkles,
  Info,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  CheckCircle,
} from 'lucide-react';

interface AdminBroadcastModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess?: () => void;
}

export const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({
  language,
  isOpen,
  onClose,
  onBroadcastSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError(
        language === 'tg'
          ? 'Лутфан сарлавҳа ва матни паёмро пур кунед'
          : 'Пожалуйста, заполните заголовок и текст сообщения'
      );
      return;
    }

    // Default PIN: 2026 or empty for ease of test/admin
    if (adminPin.trim() && adminPin.trim() !== '2026') {
      setError(
        language === 'tg'
          ? 'Рамзи маъмур (PIN) нодуруст аст! (Рамзи пешфарз: 2026)'
          : 'Неверный PIN администратора! (По умолчанию: 2026)'
      );
      return;
    }

    setIsSending(true);
    try {
      await addAdminAnnouncement({
        title: title.trim(),
        message: message.trim(),
        type,
        linkUrl: linkUrl.trim() || undefined,
        linkText: linkText.trim() || (linkUrl.trim() ? (language === 'tg' ? 'Гузариш' : 'Перейти') : undefined),
        pinned: false,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setMessage('');
        setLinkUrl('');
        setLinkText('');
        setAdminPin('');
        onClose();
        if (onBroadcastSuccess) onBroadcastSuccess();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        language === 'tg'
          ? 'Хатогӣ ҳангоми ирсоли паём'
          : 'Ошибка при отправке сообщения'
      );
    } finally {
      setIsSending(false);
    }
  };

  const typeConfig: Record<AnnouncementType, { label: string; icon: any; color: string; bg: string }> = {
    info: {
      label: language === 'tg' ? 'Иттилоотӣ' : 'Информация',
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    promo: {
      label: language === 'tg' ? 'Пешниҳод / Акция' : 'Акция / Промо',
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    security: {
      label: language === 'tg' ? 'Бехатарӣ' : 'Безопасность',
      icon: Shield,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200',
    },
    update: {
      label: language === 'tg' ? 'Навсозӣ' : 'Обновление',
      icon: RefreshCw,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-xs">
              <Shield className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {language === 'tg' ? 'Ирсоли паёми маъмурият' : 'Отправка сообщения администрации'}
              </h3>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                {language === 'tg'
                  ? 'Паём ба ҳамаи корбарони Arzon.tj мерасад'
                  : 'Сообщение получат все пользователи Arzon.tj'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {language === 'tg'
                  ? 'Паём бо муваффақият ба ҳамаи корбарон фиристода шуд!'
                  : 'Сообщение успешно разослано всем пользователям!'}
              </span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {language === 'tg' ? 'Намуди паём' : 'Тип сообщения'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['info', 'promo', 'security', 'update'] as AnnouncementType[]).map((tKey) => {
                const conf = typeConfig[tKey];
                const Icon = conf.icon;
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? `${conf.bg} border-current shadow-xs ring-1 ring-emerald-500`
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? conf.color : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {conf.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'tg' ? 'Сарлавҳаи паём *' : 'Заголовок сообщения *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                language === 'tg'
                  ? 'Масалан: Тахфифи 20% барои VIP хизматрасониҳо'
                  : 'Например: Скидка 20% на VIP услуги'
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900 transition-colors"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {language === 'tg' ? 'Матни паёми маъмурият *' : 'Текст сообщения *'}
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                language === 'tg'
                  ? 'Матни мукаммали худро нависед. Шумо метавонед маълумот дар бораи қоидаҳо, навсозиҳо ва имкониятҳои навро ба корбарон расонед...'
                  : 'Напишите подробный текст оповещения для пользователей...'
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Action Link & Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'tg' ? 'Истинод (Link URL - ихтиёрӣ)' : 'Ссылка (URL - опционально)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... ё #catalog"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900"
                />
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'tg' ? 'Номи тугмаи истинод' : 'Текст кнопки перехода'}
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder={language === 'tg' ? 'Масалан: Дидани хизматҳо' : 'Например: Подробнее'}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900"
              />
            </div>
          </div>

          {/* Admin PIN */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-[11px] text-slate-500">
                <span>{language === 'tg' ? 'Рамзи тасдиқи админ:' : 'PIN подтверждения:'}</span>{' '}
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">2026</span>
              </div>
            </div>
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="2026"
              className="w-24 px-2.5 py-1 text-xs text-center font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-lg focus:border-emerald-600 outline-hidden"
            />
          </div>

          {/* Live Preview Card */}
          {title.trim() && (
            <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {language === 'tg' ? 'Пешнамоиш барои корбар' : 'Предпросмотр для пользователя'}
              </span>
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                  <span className="text-[9px] text-slate-400">Ҳозир</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{message}</p>
                {linkUrl && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {linkText || 'Гузариш'} →
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'tg' ? 'Бекор кардан' : 'Отмена'}
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSending
                  ? (language === 'tg' ? 'Ирсол шуда истодааст...' : 'Отправка...')
                  : (language === 'tg' ? 'Ирсол ба ҳама' : 'Отправить всем')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
