import React, { useState } from 'react';
import { Language } from '../types';
import {
  Smartphone,
  X,
  Download,
  Check,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Copy,
  Layers,
  ArrowRight,
  Play,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PlayMarketGuideModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayMarketGuideModal: React.FC<PlayMarketGuideModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bubblewrapSnippet = `# 1. Насб кардани асбоби расмии Google
npm install -g @bubblewrap/cli

# 2. Омодасозии барномаи Android бо сомонаи худ
bubblewrap init --manifest=${window.location.origin}/manifest.json

# 3. Сохтани файли тайёр барои Google Play (.aab)
bubblewrap build`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white w-full max-w-full box-border">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-bold shrink-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-bold truncate">
                {language === 'tg'
                  ? 'Роҳнамои гузоштан ба Google Play Market'
                  : language === 'ru'
                  ? 'Руководство по публикации в Google Play'
                  : 'Google Play Market Publishing Guide'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                {language === 'tg'
                  ? 'Чӣ гуна Arzon.tj-ро дар телефон насб кунем ва ба Play Market барорем'
                  : 'Как опубликовать приложение в Google Play Store'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-slate-700 text-xs sm:text-sm w-full max-w-full box-border">
          {/* Direct Android APK Download Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-white" />
                <h4 className="font-bold text-white text-sm">
                  {language === 'tg'
                    ? 'Файли тайёри Android APK (10 MB)'
                    : 'Готовый Android APK файл (10 MB)'}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  Release
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                {language === 'tg'
                  ? 'Файли APK-ро бевосита дар телефони худ насб кунед ё ба дигарон фиристед.'
                  : 'Скачайте и установите APK файл прямо на свой смартфон или отправьте друзьям.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href="/arzon-tj-latest.zip"
                download="arzon-tj-latest.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 text-center cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                {language === 'tg' ? 'Боргирии мустақими лоиҳа (ZIP)' : 'Прямое скачивание (ZIP)'}
              </a>
              <a
                href="https://github.com/badruddinshodiev3-droid/arzon-tj/actions"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                title="GitHub Actions"
              >
                <span>GitHub Actions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Instant PWA Install Action Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'tg'
                    ? 'Санҷиши фаврӣ: Насб дар телефони худатон'
                    : 'Быстрая установка на ваш телефон'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'tg'
                  ? 'Arzon.tj ҳамчун барномаи PWA пурра омода аст ва метавонад бевосита дар экрани телефон мисли барномаи оддӣ ҷой гирад.'
                  : 'Arzon.tj готов как PWA — можно установить на экран смартфона прямо сейчас.'}
              </p>
            </div>

            {isInstallable ? (
              <button
                onClick={install}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                + {language === 'tg' ? 'Насб кардан' : 'Установить'}
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-xl shrink-0">
                ✓ PWA фаъол аст
              </span>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              {language === 'tg'
                ? '3 усули баровардани Arzon.tj ба Google Play Store:'
                : '3 способа публикации в Google Play Store:'}
            </h4>

            {/* Method 1: PWABuilder (Easiest, No-Code) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase">
                  {language === 'tg' ? 'Усули 1 (Осонтарин)' : 'Способ 1 (Самый простой)'}
                </span>
                <span className="text-xs font-semibold text-emerald-700">Бе барномасозӣ (No-code)</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">
                Истифодаи сомонаи расмии PWABuilder (аз Microsoft & Google)
              </h5>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  Ба сомонаи{' '}
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold underline inline-flex items-center gap-1"
                  >
                    pwabuilder.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  дароед.
                </li>
                <li>
                  Суроғаи (URL)-и сомонаи <strong>Arzon.tj</strong>-ро ворид намоед ва тугмаи <strong>Start</strong>-ро пахш кунед.
                </li>
                <li>
                  PWABuilder сомонаро месанҷад ва тугмаи <strong>Package for Android</strong>-ро фаъол мекунад.
                </li>
                <li>
                  Файли тайёри <strong>.aab</strong> (Android App Bundle)-ро зеркашӣ (Download) намоед. Ин файл барои Google Play комилан тайёр аст!
                </li>
              </ol>
            </div>

            {/* Method 2: Google Bubblewrap (Command Line) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase">
                  {language === 'tg' ? 'Усули 2 (Касбӣ)' : 'Способ 2 (Профессиональный)'}
                </span>
                <span className="text-xs font-semibold text-blue-700">Google Bubblewrap (TWA)</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">
                Табдилдиҳӣ бо асбоби расмии Google Bubblewrap
              </h5>
              <p className="text-xs text-slate-600">
                Google барои сайтҳо технологияи <strong>Trusted Web Activity (TWA)</strong>-ро пешниҳод мекунад.
              </p>
              <div className="relative bg-slate-900 rounded-xl p-3 text-[11px] font-mono text-emerald-300">
                <pre className="whitespace-pre-wrap">{bubblewrapSnippet}</pre>
                <button
                  onClick={() => copyToClipboard(bubblewrapSnippet, 'bubblewrap')}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Copy commands"
                >
                  {copiedCode === 'bubblewrap' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Method 3: Google Play Console */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase">
                  Қадами 3
                </span>
                <span className="text-xs font-semibold text-slate-700">Google Play Console</span>
              </div>
              <h5 className="font-bold text-slate-900 text-sm">
                Боргузорӣ ба Google Play Console
              </h5>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  Дар <strong>play.google.com/console</strong> аккаунти барномасоз (Google Play Developer Account) кушоед (пардохти яккарата $25).
                </li>
                <li>
                  Тугмаи <strong>"Create app"</strong> (Сохтани барнома)-ро пахш карда, номи <strong>"Arzon.tj - Маркетплейс"</strong>-ро нависед.
                </li>
                <li>
                  Файли <strong>.aab</strong>-ро дар бахши <strong>Production / Release</strong> бор кунед.
                </li>
                <li>
                  Аксҳо (screenshots), логотип (512x512) ва тавсифро бо забонҳои тоҷикӣ ва русӣ пур кунед.
                </li>
                <li>
                  Тугмаи <strong>"Submit for review"</strong>-ро пахш кунед. Пас аз 1 то 3 рӯз барнома дар тамоми телефонҳои Android дар Play Market дастрас мегардад!
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Arzon.tj бо Web App Manifest ва PWA 100% мувофиқ аст
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Фаҳмо шуд / Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
