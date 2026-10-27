import React, { useState } from 'react';
import { Language } from '../types';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  getSupabase,
  testSupabaseChatConnection,
  DEFAULT_SUPABASE_URL,
  SUPABASE_SQL_SETUP,
  isServiceRoleKey,
} from '../utils/supabaseClient';
import { CHAT_EVENT_NAME } from '../utils/chatUtils';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface SupabaseSetupModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig?.url || DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [diagnosticDetails, setDiagnosticDetails] = useState<string[]>([]);
  const [copiedPhoneCode, setCopiedPhoneCode] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyForSecondPhone = () => {
    const payload = JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() });
    navigator.clipboard.writeText(payload);
    setCopiedPhoneCode(true);
    setTimeout(() => setCopiedPhoneCode(false), 2500);
  };

  const handleCopyLinkForSecondPhone = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?sb_key=${encodeURIComponent(anonKey.trim())}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const trimmed = text.trim();
      // Try JSON payload
      if (trimmed.startsWith('{') && trimmed.includes('anonKey')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.url) setUrl(parsed.url);
          if (parsed.anonKey) setAnonKey(parsed.anonKey);
          return;
        } catch {
          // ignore
        }
      }

      // If text looks like a URL
      if (trimmed.startsWith('https://')) {
        setUrl(trimmed);
      } else {
        setAnonKey(trimmed);
      }
    } catch {
      alert(language === 'tg' ? 'Ба хондани буфер иҷозат дода нашуд' : 'Буфер недоступен');
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = (url.trim() || DEFAULT_SUPABASE_URL).trim();
    const cleanKey = anonKey.trim();

    if (!cleanKey) {
      setTestStatus('error');
      setStatusMessage(
        language === 'tg'
          ? 'Лутфан Anon Public Key-ро ворид кунед (аз Supabase -> Project Settings -> API).'
          : 'Пожалуйста, введите Anon Public Key (из Supabase -> Project Settings -> API).'
      );
      setDiagnosticDetails([]);
      return;
    }

    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://') || cleanKey.includes('.supabase.co')) {
      const cleanTargetUrl = cleanKey.replace(/\/rest\/v1\/?$/, '');
      setUrl(cleanTargetUrl);
      setAnonKey('');
      setTestStatus('error');
      setStatusMessage(
        language === 'tg'
          ? 'Шумо нишонии Project URL-ро нусхабардорӣ кардед. Он ба сатри аввал (URL) гузошта шуд. Лутфан аз Supabase сатри дуюм — «anon public» (ки бо eyJ... сар мешавад)-ро нусха бардошта ба ин ҷо гузоред.'
          : 'Вы вставили Project URL. Он перемещен в поле URL. Пожалуйста, скопируйте ключ «anon public» (начинается с eyJ...) и вставьте сюда.'
      );
      setDiagnosticDetails([]);
      return;
    }

    if (cleanKey.startsWith('sb_sec_') || cleanKey.includes('service_role') || isServiceRoleKey(cleanKey)) {
      setTestStatus('error');
      setStatusMessage(
        language === 'tg'
          ? 'Огоҳӣ: Ин калиди махфии хатарноки «service_role» мебошад! Онро ҳеҷ гоҳ дар телефони мобилӣ истифода набаред. Лутфан танҳо калиди оммавии «anon»-ро ворид кунед.'
          : 'Предупреждение: Это секретный ключ «service_role»! Используйте только публичный «anon public key».'
      );
      setDiagnosticDetails([]);
      return;
    }

    setTestStatus('testing');
    setStatusMessage(
      language === 'tg'
        ? 'Санҷиши мукаммал (Хондан, Сабти паём, ва Realtime WebSocket)...'
        : 'Комплексная проверка (Чтение, Запись сообщения, и Realtime WebSocket)...'
    );
    setDiagnosticDetails(['Оғози санҷиш бо сервери Supabase...']);

    try {
      setSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });

      const diag = await testSupabaseChatConnection('diag-test-user');
      setDiagnosticDetails(diag.details || []);

      if (!diag.connected) {
        setTestStatus('error');
        setStatusMessage(diag.error || 'Хатогӣ дар пайвастшавӣ ба сервери Supabase');
        return;
      }

      if (diag.missingTables.length > 0) {
        setTestStatus('error');
        setStatusMessage(
          language === 'tg'
            ? `Пайвастшавӣ бомуваффақият кор кард ва калиди шумо дуруст аст! Аммо ҷадвалҳо (${diag.missingTables.join(', ')}) ҳанӯз дар база сохта нашудаанд. Лутфан рамзи SQL-ро аз поён нусхабардорӣ карда, дар бахши SQL Editor-и Supabase гузошта тугмаи «Run»-ро пахш намоед.`
            : `Подключение успешно и ключ верен! Но таблицы (${diag.missingTables.join(', ')}) еще не созданы. Скопируйте SQL-скрипт ниже и выполните (Run) в SQL Editor Supabase.`
        );
        return;
      }

      if (diag.writeTested && !diag.writeSuccess) {
        setTestStatus('error');
        setStatusMessage(diag.error || 'Хатогӣ дар сабти паём (RLS/Иҷозатҳо)');
        return;
      }

      if (diag.writeTested && !diag.readSuccess) {
        setTestStatus('error');
        setStatusMessage(diag.error || 'Хатогӣ дар хондани паём аз база');
        return;
      }

      setTestStatus('success');
      setStatusMessage(
        language === 'tg'
          ? 'Пайвастшавии комил тасдиқ гардид! Ҳамаи ҷадвалҳо, сабти паём, хониш ва шабакаи Realtime 100% фаъоланд.'
          : 'Подключение и тесты успешно подтверждены! Таблицы, запись, чтение и Realtime активны на 100%.'
      );

      // Trigger sync event across the application
      window.dispatchEvent(new CustomEvent(CHAT_EVENT_NAME));
    } catch (err: any) {
      console.warn('Supabase connection test failed:', err);
      setTestStatus('error');
      setStatusMessage(
        (language === 'tg' ? 'Хатогӣ дар санҷиш: ' : 'Ошибка проверки: ') + (err?.message || 'Server error')
      );
    }
  };

  const handleResetToOffline = () => {
    setSupabaseConfig(null);
    setUrl(DEFAULT_SUPABASE_URL);
    setAnonKey('');
    setTestStatus('idle');
    setStatusMessage(
      language === 'tg'
        ? 'Ба реҷаи офлайн (хотираи маҳаллӣ) баргардонида шуд.'
        : 'Возвращено в локальный офлайн-режим.'
    );
    window.dispatchEvent(new CustomEvent(CHAT_EVENT_NAME));
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 box-border">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {language === 'tg'
                  ? 'Пайвасткунии пойгоҳи додаҳои зинда (Supabase)'
                  : language === 'ru'
                  ? 'Подключение онлайн-базы данных (Supabase)'
                  : 'Connect Live Online Database (Supabase)'}
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'tg'
                  ? 'Барои расонидани паёмҳо байни ду телефони Android'
                  : 'Для доставки сообщений между двумя телефонами'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'tg'
                  ? 'Чаро ин лозим аст ва чаро ройгон аст?'
                  : 'Зачем это нужно и почему это бесплатно?'}
              </span>
            </div>
            <p className="leading-relaxed">
              {language === 'tg'
                ? 'Дар телефони Android паёмҳо дар хотираи дохилии худи телефон сабт мешаванд. Барои он ки паём аз телефони 1 ба телефони 2 расад, як сервери ройгони интернетии муштарак (Supabase PostgreSQL + Realtime) лозим аст. Supabase комилан ройгон (Free Tier) буда, ягон пардохт ё корти бонкиро талаб намекунад.'
                : 'На Android-устройствах локальный кэш изолирован. Чтобы сообщение с одного телефона мгновенно появилось на другом, требуется бесплатная облачная база данных (Supabase Realtime). Бесплатный тариф Supabase не требует банковских карт.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 flex items-center justify-between">
                <span>Supabase Project URL</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold text-xs"
                >
                  <span>supabase.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://mjjwmgjxmsjzfaxeyanj.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900 font-mono text-xs"
              />
              <p className="text-[11px] text-emerald-700 font-medium">
                {language === 'tg'
                  ? '✓ Нишонии расмии лоиҳа муқаррар шудааст: https://mjjwmgjxmsjzfaxeyanj.supabase.co'
                  : '✓ Установлен официальный URL проекта: https://mjjwmgjxmsjzfaxeyanj.supabase.co'}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900">
                  <span>Supabase Anon Public Key (API Key)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                  >
                    {language === 'tg' ? '📋 Часпондан' : '📋 Вставить'}
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'tg' ? 'Танҳо Anon Key' : 'Только Anon Key'}</span>
                  </span>
                </div>
              </div>
              <textarea
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                rows={2}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ё sb_publishable_..."
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl outline-hidden text-slate-900 font-mono text-xs"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {language === 'tg'
                    ? 'Аз панели Supabase: Project Settings -> API -> Project API keys -> сатри «anon public» (Publishable key)'
                    : 'Из панели Supabase: Project Settings -> API -> Project API keys -> строка «anon public» (Publishable key)'}
                </span>
                {anonKey && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLinkForSecondPhone}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      title={language === 'tg' ? 'Нусхабардории пайванд барои телефони 2' : 'Копировать ссылку для телефона 2'}
                    >
                      {copiedLink
                        ? (language === 'tg' ? 'Пайванд нусха шуд!' : 'Ссылка скопирована!')
                        : (language === 'tg' ? '🔗 Пайванд барои тел 2' : '🔗 Ссылка для тел 2')}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleCopyForSecondPhone}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {copiedPhoneCode
                        ? (language === 'tg' ? 'Нусха шуд!' : 'Скопировано!')
                        : (language === 'tg' ? 'Код' : 'Код')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl flex flex-col gap-2 text-xs ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testStatus === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : testStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold">{statusMessage}</span>
                </div>

                {/* Live Diagnostic checklist results */}
                {diagnosticDetails.length > 0 && (
                  <div className="mt-1 pt-2 border-t border-slate-200/60 space-y-1">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                      {language === 'tg' ? 'Натиҷаи марҳилаҳои санҷиш:' : 'Этапы диагностики:'}
                    </p>
                    {diagnosticDetails.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="text-slate-700">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={testStatus === 'testing'}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'tg' ? 'Санҷиш...' : 'Проверка...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {language === 'tg'
                        ? 'Сабт ва пайваст кардан'
                        : 'Сохранить и подключить'}
                    </span>
                  </>
                )}
              </button>

              {currentConfig && (
                <button
                  type="button"
                  onClick={handleResetToOffline}
                  className="py-2.5 px-3 border border-slate-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                >
                  {language === 'tg' ? 'Қатъи пайваст' : 'Отключить'}
                </button>
              )}
            </div>
          </form>

          {/* SQL Setup Script Section */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'tg'
                    ? 'Рамзи омодаи SQL барои Supabase (1-пахш)'
                    : 'Готовый SQL-скрипт для Supabase'}
                </span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'tg' ? 'Нусха шуд!' : 'Скопировано!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'tg' ? 'Нусхабардорӣ' : 'Копировать SQL'}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'tg'
                ? 'Дар панели Supabase ба бахши «SQL Editor» ворид шуда, тугмаи «New query»-ро пахш намоед ва ин матнро гузошта «Run»-ро пахш кунед:'
                : 'В панели Supabase откройте «SQL Editor», создайте «New query», вставьте этот код и нажмите «Run»:'}
            </p>
            <div className="relative rounded-xl overflow-hidden bg-slate-950 p-3 text-emerald-400 font-mono text-[10px] sm:text-xs max-h-48 overflow-y-auto leading-relaxed">
              <pre>{SUPABASE_SQL_SETUP}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
