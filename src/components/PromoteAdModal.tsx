import React, { useState, useEffect } from 'react';
import { ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import {
  fetchPaymentConfig,
  createPaymentOrder,
  verifyPaymentOrder,
  activateServerPromotion,
  PaymentConfigResponse,
} from '../utils/paymentApi';
import {
  X,
  Crown,
  Zap,
  Flame,
  Sparkles,
  CheckCircle,
  CreditCard,
  QrCode,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Info,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface PromoteAdModalProps {
  ad: ProductAd | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onPromoteSuccess: (updatedAd: ProductAd, packageName: string) => void;
}

export type PromoPackage = 'turbo' | 'vip' | 'urgent' | 'max';

export const PromoteAdModal: React.FC<PromoteAdModalProps> = ({
  ad,
  language,
  isOpen,
  onClose,
  onPromoteSuccess,
}) => {
  const t = translations[language];

  const [selectedPackage, setSelectedPackage] = useState<PromoPackage>('vip');
  const [paymentMethod, setPaymentMethod] = useState<'alif' | 'dc' | 'korti_milli'>('alif');
  const [phoneNumber, setPhoneNumber] = useState(ad?.phone || '+992 ');

  // Payment state
  const [config, setConfig] = useState<PaymentConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [saveMethodConsent, setSaveMethodConsent] = useState(false);

  // Load backend payment configuration on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingConfig(true);
      setPaymentError(null);
      setPaymentSuccess(false);
      setActiveOrderId(null);
      setCheckoutUrl(null);

      fetchPaymentConfig()
        .then((cfg) => {
          setConfig(cfg);
        })
        .finally(() => {
          setIsLoadingConfig(false);
        });
    }
  }, [isOpen]);

  if (!isOpen || !ad) return null;

  const packages = [
    {
      id: 'turbo' as PromoPackage,
      name: { tg: 'Турбо-бардоштан', ru: 'Турбо-поднятие', en: 'Turbo Bump' },
      price: 5,
      durationDays: 1,
      duration: { tg: 'Якдафъаина', ru: 'Однократно', en: '1-time' },
      icon: Zap,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      description: {
        tg: 'Эълонро фавран ба аввали рӯйхат ва саҳифаи асосӣ мебардорад',
        ru: 'Мгновенно поднимает объявление на 1-е место в каталоге',
        en: 'Instantly bumps ad to the 1st position in catalog',
      },
      tag: { tg: 'Арзон ва тез', ru: 'Быстро и экономно', en: 'Fast & Cheap' },
    },
    {
      id: 'urgent' as PromoPackage,
      name: { tg: 'Нишони «Фаврӣ»', ru: 'Значок «Срочно»', en: 'Urgent Badge' },
      price: 10,
      durationDays: 7,
      duration: { tg: '7 рӯз', ru: '7 дней', en: '7 days' },
      icon: Flame,
      color: 'text-rose-500 bg-rose-50 border-rose-200',
      description: {
        tg: 'Нишони равшани сурхи «Фаврӣ» диққати харидоронро 3 маротиба бештар ҷалб мекунад',
        ru: 'Яркий красный значок «Срочно» привлекает в 3 раза больше звонков',
        en: 'Bright red "Urgent" badge attracts 3x more buyer inquiries',
      },
      tag: { tg: 'Фурӯши фаврӣ', ru: 'Быстрая продажа', en: 'Quick sale' },
    },
    {
      id: 'vip' as PromoPackage,
      name: { tg: 'VIP Эълон дар боло', ru: 'VIP на самом верху', en: 'VIP Top Ad' },
      price: 15,
      durationDays: 7,
      duration: { tg: '7 рӯз', ru: '7 дней', en: '7 days' },
      icon: Crown,
      color: 'text-amber-600 bg-amber-50 border-amber-300 ring-2 ring-amber-500/30',
      description: {
        tg: 'Дар аввали тамоми ҷустуҷӯҳо бо ҳошияи тиллоӣ ва тоҷи VIP ба муддати 7 рӯз устувор мемонад',
        ru: 'Закрепляется на самом верху каталога с золотой рамкой и короной на 7 дней',
        en: 'Pinned at the very top of search results with gold border and crown for 7 days',
      },
      tag: { tg: 'Машҳуртарин (15 с.)', ru: 'Самый популярный (15 с.)', en: 'Most Popular (15 TJS)' },
    },
    {
      id: 'max' as PromoPackage,
      name: { tg: 'Пакет «Максимум»', ru: 'Пакет «Максимум»', en: 'Maximum Package' },
      price: 25,
      durationDays: 14,
      duration: { tg: '14 рӯз', ru: '14 дней', en: '14 days' },
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-300',
      description: {
        tg: 'Ҳама хизматрасониҳо якҷоя: VIP + Турбо + Нишони Фаврӣ + Ранги махсус',
        ru: 'Все услуги вместе: VIP + Турбо + Срочно + Выделение цветом',
        en: 'All services combined: VIP + Turbo + Urgent badge + Highlight color',
      },
      tag: { tg: '35% тахфиф', ru: 'Скидка 35%', en: '35% off' },
    },
  ];

  const selectedPkgData = packages.find((p) => p.id === selectedPackage)!;

  // Check if chosen payment method is configured in the backend
  const isSelectedProviderConfigured =
    Boolean(config && (
      (paymentMethod === 'alif' && config.alif.isConfigured) ||
      (paymentMethod === 'dc' && config.dc.isConfigured) ||
      (paymentMethod === 'korti_milli' && config.isConfigured)
    ));

  // Handler for REAL payment initiation
  const handleStartRealPayment = async () => {
    setPaymentError(null);

    if (!isSelectedProviderConfigured) {
      setPaymentError(
        language === 'tg'
          ? 'Системаи пардохти воқеӣ ҳанӯз фаъол нест: калидҳои расмии тоҷири Бонки Алиф (ALIF_MERCHANT_ID ва ALIF_SECRET_KEY) дар сервер ворид нашудаанд. Пардохти сохта ё қалбакӣ манъ аст.'
          : 'Реальная платежная система еще не подключена: мерчант-ключи Алиф Банка не настроены на сервере. Фальшивая оплата запрещена.'
      );
      setShowSetupGuide(true);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create payment order in server backend
      const result = await createPaymentOrder({
        adId: ad.id,
        packageId: selectedPackage,
        provider: paymentMethod,
        customerPhone: phoneNumber,
      });

      if (!result.success || !result.orderId) {
        setPaymentError(result.message || 'Эҷоди супориши пардохт ноком шуд');
        setIsProcessing(false);
        return;
      }

      setActiveOrderId(result.orderId);
      if (result.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        // Open real provider checkout page
        window.open(result.checkoutUrl, '_blank');
      }

      // 2. Poll server for real verification
      setIsVerifying(true);
      pollForVerification(result.orderId);
    } catch (err: any) {
      setPaymentError(err?.message || 'Хатогӣ ҳангоми муроҷиат ба сервери пардохт');
      setIsProcessing(false);
    }
  };

  // Poll server verification endpoint
  const pollForVerification = (orderId: string, attemptsLeft = 20) => {
    if (attemptsLeft <= 0) {
      setIsProcessing(false);
      setIsVerifying(false);
      setPaymentError(
        language === 'tg'
          ? 'Мӯҳлати интизории тасдиқи пардохт гузашт ё пардохт бекор шуд. Маблағ гирифта нашудааст ва эълон VIP нашуд.'
          : 'Время ожидания подтверждения оплаты истекло. Оплата не была подтверждена банком.'
      );
      return;
    }

    setTimeout(async () => {
      try {
        const verify = await verifyPaymentOrder(orderId);

        if (verify.success && verify.verified && verify.status === 'completed') {
          // 3. Complete server promotion activation
          const activation = await activateServerPromotion({
            orderId,
            adId: ad.id,
          });

          if (activation.success && activation.verified) {
            setIsProcessing(false);
            setIsVerifying(false);
            setPaymentSuccess(true);

            const updatedAd: ProductAd = {
              ...ad,
              isVip: activation.isVip ?? (selectedPackage === 'vip' || selectedPackage === 'max' || ad.isVip),
              isUrgent: activation.isUrgent ?? (selectedPackage === 'urgent' || selectedPackage === 'max' || ad.isUrgent),
              isHighlighted: activation.isHighlighted ?? (selectedPackage === 'max' || ad.isHighlighted),
              promotedUntil: activation.promotedUntil,
              featured: true,
            };

            setTimeout(() => {
              onPromoteSuccess(updatedAd, selectedPkgData.name[language]);
              onClose();
            }, 2500);
            return;
          }
        }

        if (verify.status === 'failed' || verify.status === 'cancelled') {
          setIsProcessing(false);
          setIsVerifying(false);
          setPaymentError(
            language === 'tg'
              ? 'Пардохт бекор шуд ё маблағ нарасид. Эълон ҳамчун пулакӣ фаъол карда намешавад.'
              : 'Оплата отменена или не удалась. VIP статус не активирован.'
          );
          return;
        }

        // Continue polling
        pollForVerification(orderId, attemptsLeft - 1);
      } catch (pollErr) {
        pollForVerification(orderId, attemptsLeft - 1);
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[94vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-white w-full max-w-full box-border">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {language === 'tg'
                  ? 'Пешбурди пулакии эълон (VIP)'
                  : language === 'ru'
                  ? 'Платное продвижение объявления (VIP)'
                  : 'Paid Ad Promotion (VIP)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-100 truncate">
                {language === 'tg'
                  ? 'VIP барои 7 рӯз — 15 сомонӣ (тасдиқи расмӣ дар сервер)'
                  : 'VIP на 7 дней — 15 сомони (проверка на сервере)'}
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 w-full max-w-full box-border">
          {/* Ad Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
              <img
                src={resolveImageUrl(ad.images[0])}
                alt={ad.title}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e)}
              />
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {ad.title}
              </h4>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">
                {new Intl.NumberFormat('ru-RU').format(ad.price)} {t.somoni}
              </p>
            </div>
          </div>

          {/* REAL PAYMENT SYSTEM STATUS BANNER */}
          {!isLoadingConfig && (
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isSelectedProviderConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSelectedProviderConfigured ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold mb-1 flex items-center justify-between">
                    <span>
                      {isSelectedProviderConfigured
                        ? (language === 'tg' ? 'Системаи пардохти воқеӣ фаъол аст' : 'Реальная платежная система активна')
                        : (language === 'tg' ? 'Ҳолати система: Калидҳои тоҷир танзим нашудаанд' : 'Статус: Мерчант-ключи не настроены')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSetupGuide(!showSetupGuide)}
                      className="text-[11px] underline font-medium text-amber-800 hover:text-amber-900 ml-2"
                    >
                      {language === 'tg' ? 'Дастури танзим' : 'Инструкция'}
                    </button>
                  </div>
                  <p className="text-[11px] opacity-90">
                    {isSelectedProviderConfigured
                      ? (language === 'tg'
                          ? 'Пардохтҳо тавассути шлюзи расмии Бонк гузаронида шуда, мақоми VIP танҳо баъд аз тасдиқи сервер фаъол мешавад.'
                          : 'Платежи проходят через официальный шлюз банка, статус VIP активируется только после подтверждения сервером.')
                      : (language === 'tg'
                          ? 'Барои гирифтани маблағи ҳақиқии 15 сомонӣ, соҳиби барнома бояд бо Бонки Алиф шартномаи расмӣ бандад ва ALIF_MERCHANT_ID ва ALIF_SECRET_KEY-ро ба сервер пайваст кунад. Пардохти қалбакӣ ё бе тасдиқ манъ аст.'
                          : 'Для приема реальной оплаты 15 сомони требуются официальные ключи мерчанта Алиф. Фальшивые платежи отключены.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SETUP GUIDE ACCORDION */}
          {showSetupGuide && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>Дастури пайвасткунии Алиф Моби (Эквайринг):</span>
                <button
                  type="button"
                  onClick={() => setShowSetupGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                <li>
                  <strong className="text-white">Бастани шартнома:</strong> Ба сайти{' '}
                  <a
                    href="https://alif.tj"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline inline-flex items-center gap-0.5"
                  >
                    alif.tj <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  ё шӯъбаи Бонки Алиф муроҷиат намуда, шартномаи қабули пардохтҳои онлайнӣ (эквайринг)-ро ба имзо расонед.
                </li>
                <li>
                  <strong className="text-white">Гирифтани калидҳо:</strong> Аз кабинети тоҷирии Алиф (Alif Pay Business) калидҳои <code className="text-amber-300">ALIF_MERCHANT_ID</code> ва <code className="text-amber-300">ALIF_SECRET_KEY</code>-ро дастрас намоед.
                </li>
                <li>
                  <strong className="text-white">Сабт дар сервер:</strong> Ин калидҳоро дар файли танзимоти сервери Arzon.tj ворид кунед.
                </li>
                <li>
                  <strong className="text-white">Webhook:</strong> URL-и бозгашти пардохтҳоро дар кабинети Алиф нишон диҳед: <code className="text-emerald-300">https://ваша-барнома.tj/api/payment/alif/webhook</code>
                </li>
              </ol>
            </div>
          )}

          {/* Package Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2.5">
              {language === 'tg'
                ? 'Хизматрасониро интихоб кунед:'
                : 'Выберите услугу продвижения:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {packages.map((pkg) => {
                const IconComponent = pkg.icon;
                const isSelected = selectedPackage === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${pkg.color}`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {pkg.tag[language]}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900">
                        {pkg.name[language]}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                        {pkg.description[language]}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        {pkg.price} {t.somoni}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pkg.duration[language]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method in Tajikistan */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-900 mb-2">
              {language === 'tg'
                ? 'Усули пардохти воқеӣ дар Тоҷикистон:'
                : 'Способ реальной оплаты в Таджикистане:'}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('alif')}
                className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                  paymentMethod === 'alif'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[10px] mx-auto mb-1 flex items-center justify-center">
                  alif
                </div>
                <span className="text-[11px] block">Алиф Моби</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {config?.alif.isConfigured ? 'Пайваст' : 'Танзим лозим'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('dc')}
                className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                  paymentMethod === 'dc'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] mx-auto mb-1 flex items-center justify-center">
                  DC
                </div>
                <span className="text-[11px] block">Dushanbe City</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {config?.dc.isConfigured ? 'Пайваст' : 'Танзим лозим'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('korti_milli')}
                className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                  paymentMethod === 'korti_milli'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                <span className="text-[11px] block">Корти Миллӣ</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Тавассути Алиф</span>
              </button>
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              {language === 'tg'
                ? 'Рақами телефони ҳамён:'
                : 'Номер кошелька / телефона:'}
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+992 90 000 0000"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Secure Tokenized Saved Method Option */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveMethodConsent}
                onChange={(e) => setSaveMethodConsent(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 leading-snug">
                {language === 'tg'
                  ? 'Барои пардохтҳои оянда усулро бехатар дар хотир гиред (бо токени расмии бонк)'
                  : 'Запомнить способ оплаты для будущих продвижений (через защищенный токен банка)'}
              </span>
            </label>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {language === 'tg'
                  ? 'Кафолати амният: Рақами пурраи корт ва CVV дар сомона сабт намешавад.'
                  : 'Безопасность: Полные данные карты и CVV код никогда не сохраняются.'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Хатогии пардохт:</span>
                <span>{paymentError}</span>
              </div>
            </div>
          )}

          {/* Verification in Progress Banner */}
          {isVerifying && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in">
              <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
              <div>
                <span className="font-bold block">Интизори тасдиқи пардохт аз бонк...</span>
                <span className="text-[11px] text-blue-700">
                  Лутфан пардохтро дар замимаи Алиф Моби анҷом диҳед. Сервер мақоми супоришро месанҷад.
                </span>
              </div>
            </div>
          )}

          {/* Genuine Verified Success Banner */}
          {paymentSuccess && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl flex items-start gap-3 text-xs font-medium animate-in fade-in">
              <CheckCircle className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-emerald-900">
                  {language === 'tg'
                    ? 'Пардохт дар сервер тасдиқ шуд!'
                    : 'Оплата подтверждена на сервере!'}
                </span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  {language === 'tg'
                    ? `15 сомонӣ бомуваффақият қабул шуд. Эълони Шумо ба муддати 7 рӯз мақоми VIP гирифт.`
                    : '15 сомони успешно приняты. Объявление получило VIP статус на 7 дней.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Ба пардохт:</span>
            <span className="text-lg font-extrabold text-slate-900 tabular-nums">
              {selectedPkgData.price} {t.somoni}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {t.cancel}
            </button>

            <button
              onClick={handleStartRealPayment}
              disabled={isProcessing || paymentSuccess || isLoadingConfig}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isSelectedProviderConfigured
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Тафтиш дар сервер...</span>
                </>
              ) : isSelectedProviderConfigured ? (
                <>
                  <span>Пардохт кардан ({selectedPkgData.price} с.)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Танзими тоҷир лозим аст ({selectedPkgData.price} с.)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
