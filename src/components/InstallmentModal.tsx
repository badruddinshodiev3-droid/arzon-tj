import React, { useState } from 'react';
import { ProductAd, Language, UserProfile, InstallmentApplication } from '../types';
import { translations } from '../data/translations';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { calculateFinancing, saveInstallmentApplication } from '../utils/installmentUtils';
import {
  X,
  Car,
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  Lock,
  ChevronRight,
  Info,
  BadgeCheck,
} from 'lucide-react';

interface InstallmentModalProps {
  ad: ProductAd | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSubmitSuccess?: (app: InstallmentApplication) => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  ad,
  language,
  isOpen,
  onClose,
  currentUser,
  onSubmitSuccess,
}) => {
  const t = translations[language];

  if (!isOpen || !ad) return null;

  const isAutoLoan = ad.category === 'auto';
  const availableTerms = isAutoLoan ? [12, 24, 36, 48] : [3, 6, 12, 18, 24];
  const defaultTerm = isAutoLoan ? 24 : 6;
  const defaultDownPercent = isAutoLoan ? 20 : 0;

  const [termMonths, setTermMonths] = useState<number>(defaultTerm);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(defaultDownPercent);
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantPhone, setApplicantPhone] = useState(currentUser?.phone || '+992 ');
  const [applicantCity, setApplicantCity] = useState(ad.city || 'dushanbe');
  const [userConsent, setUserConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedApp, setSubmittedApp] = useState<InstallmentApplication | null>(null);

  const calculation = calculateFinancing(
    ad.price,
    termMonths,
    downPaymentPercent,
    isAutoLoan
  );

  const formattedProductPrice = new Intl.NumberFormat('ru-RU').format(ad.price);
  const formattedMonthly = new Intl.NumberFormat('ru-RU').format(calculation.monthlyPayment);
  const formattedDown = new Intl.NumberFormat('ru-RU').format(calculation.downPayment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = applicantName.trim();
    const cleanPhone = applicantPhone.trim();

    if (!cleanName || cleanName.length < 3) {
      setErrorMessage(
        language === 'tg'
          ? 'Лутфан ному насаби пурраи худро ворид кунед'
          : language === 'ru'
          ? 'Пожалуйста, укажите ваши полные фамилию и имя'
          : 'Please enter your full name'
      );
      return;
    }

    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setErrorMessage(
        language === 'tg'
          ? 'Рақами телефон бояд на камтар аз 9 рақам бошад'
          : language === 'ru'
          ? 'Номер телефона должен содержать не менее 9 цифр'
          : 'Phone number must contain at least 9 digits'
      );
      return;
    }

    if (!userConsent) {
      setErrorMessage(
        language === 'tg'
          ? 'Барои идома, розигии худро ба коркарди маълумоти шахсӣ тасдиқ кунед'
          : language === 'ru'
          ? 'Для продолжения подтвердите согласие на обработку персональных данных'
          : 'Please agree to personal data processing to proceed'
      );
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newApp: InstallmentApplication = {
        id: `ARZ-FIN-${Date.now().toString().slice(-6)}`,
        adId: ad.id,
        adTitle: ad.title,
        adPrice: ad.price,
        adCategory: ad.category,
        adImage: ad.images?.[0] || '',
        type: isAutoLoan ? 'auto_loan' : 'installment',
        applicantName: cleanName,
        applicantPhone: cleanPhone,
        applicantCity,
        durationMonths: termMonths,
        monthlyEstimate: calculation.monthlyPayment,
        downPayment: calculation.downPayment,
        userConsent: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      saveInstallmentApplication(newApp);
      setIsSubmitting(false);
      setSubmittedApp(newApp);

      if (onSubmitSuccess) {
        onSubmitSuccess(newApp);
      }
    }, 400);
  };

  const handleClose = () => {
    setSubmittedApp(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 box-border">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b text-white shrink-0 ${
            isAutoLoan
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 border-indigo-800'
              : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 border-purple-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              {isAutoLoan ? <Car className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isAutoLoan
                  ? language === 'tg'
                    ? 'Харидани мошин бо қарзи бонкӣ'
                    : language === 'ru'
                    ? 'Покупка автомобиля в автокредит'
                    : 'Car Purchase via Auto Loan'
                  : language === 'tg'
                  ? 'Харидан бо пардохти қисм-қисм'
                  : language === 'ru'
                  ? 'Покупка товара в рассрочку'
                  : 'Installment Purchase Application'}
              </h3>
              <p className="text-xs text-white/80">
                {isAutoLoan
                  ? language === 'tg'
                    ? 'Ҳисоби пешакии пардохти ҳармоҳа ва дархост'
                    : language === 'ru'
                    ? 'Предварительный расчет платежей и заявка'
                    : 'Preliminary monthly payment estimate and inquiry'
                  : language === 'tg'
                  ? 'Пардохти баробар ба моҳҳо бе фишори молиявӣ'
                  : language === 'ru'
                  ? 'Оплата равными частями на удобный срок'
                  : 'Pay in comfortable equal monthly installments'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Success Screen after submission */}
          {submittedApp ? (
            <div className="text-center py-6 sm:py-8 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  № {submittedApp.id}
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                  {language === 'tg'
                    ? 'Дархости шумо бомуваффақият сабт шуд!'
                    : language === 'ru'
                    ? 'Ваша заявка успешно зарегистрирована!'
                    : 'Your application has been registered!'}
                </h4>
                <p className="text-slate-600 max-w-md mx-auto text-xs sm:text-sm mt-1">
                  {language === 'tg'
                    ? `Ташаккур, ${submittedApp.applicantName}! Дархости шумо барои «${submittedApp.adTitle}» ба маблағи тахминии ${new Intl.NumberFormat('ru-RU').format(submittedApp.monthlyEstimate)} с./моҳ (${submittedApp.durationMonths} моҳ) қабул шуд.`
                    : language === 'ru'
                    ? `Спасибо, ${submittedApp.applicantName}! Заявка на «${submittedApp.adTitle}» с расчетом ~${new Intl.NumberFormat('ru-RU').format(submittedApp.monthlyEstimate)} с./мес (${submittedApp.durationMonths} мес.) принята.`
                    : `Thank you, ${submittedApp.applicantName}! Application for "${submittedApp.adTitle}" (~${new Intl.NumberFormat('ru-RU').format(submittedApp.monthlyEstimate)} TJS/mo, ${submittedApp.durationMonths} mo) is received.`}
                </p>
              </div>

              {/* Informational Next Steps Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 max-w-lg mx-auto text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'tg'
                      ? 'Қадамҳои минбаъда:'
                      : language === 'ru'
                      ? 'Дальнейшие шаги:'
                      : 'Next steps:'}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>
                    {language === 'tg'
                      ? `Мутахассиси мо ба рақами ${submittedApp.applicantPhone} барои тасдиқи шароит тамос хоҳад гирифт.`
                      : language === 'ru'
                      ? `Специалист свяжется по номеру ${submittedApp.applicantPhone} для уточнения деталей.`
                      : `A specialist will reach out to ${submittedApp.applicantPhone} regarding conditions.`}
                  </li>
                  <li>
                    {language === 'tg'
                      ? 'Маълумоти шахсии шумо бо рамзгузорӣ маҳфуз буда, ба шахсони бегона дода намешавад.'
                      : language === 'ru'
                      ? 'Ваши персональные данные защищены и не передаются посторонним лицам.'
                      : 'Your personal data is encrypted and never shared with third parties.'}
                  </li>
                  <li>
                    {language === 'tg'
                      ? 'Шартномаи ниҳоӣ танҳо пас аз санҷиши расмии бонки шарик дар Тоҷикистон баста мешавад.'
                      : language === 'ru'
                      ? 'Окончательное оформление кредита происходит только при официальном согласии банка-партнера.'
                      : 'Final credit agreements are executed through official partner bank channels.'}
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'tg' ? 'Фаҳмо, ташаккур' : language === 'ru' ? 'Понятно, спасибо' : 'Got it, thank you'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Summary Mini Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                  {ad.images && ad.images.length > 0 ? (
                    <img
                      src={resolveImageUrl(ad.images[0])}
                      alt={ad.title}
                      onError={(e) => handleImageError(e, ad.category)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      {isAutoLoan ? <Car className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    {isAutoLoan
                      ? language === 'tg' ? 'Мошини интихобшуда' : language === 'ru' ? 'Выбранный автомобиль' : 'Selected vehicle'
                      : language === 'tg' ? 'Моли интихобшуда' : language === 'ru' ? 'Выбранный товар' : 'Selected product'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {ad.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {formattedProductPrice} {t.somoni}
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500">
                      {language === 'tg' ? 'Фурӯшанда:' : language === 'ru' ? 'Продавец:' : 'Seller:'} {ad.sellerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculator Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>
                      {language === 'tg'
                        ? 'Ҳисобкунаки мӯҳлат ва пардохт'
                        : language === 'ru'
                        ? 'Калькулятор срока и платежей'
                        : 'Term & Payment Calculator'}
                    </span>
                  </h4>
                  <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                    {termMonths} {language === 'tg' ? 'моҳ' : language === 'ru' ? 'мес.' : 'months'}
                  </span>
                </div>

                {/* Term Selectors */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {language === 'tg'
                      ? 'Мӯҳлати пардохт:'
                      : language === 'ru'
                      ? 'Срок кредитования / рассрочки:'
                      : 'Financing duration:'}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableTerms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setTermMonths(term)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          termMonths === term
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        {term} {language === 'tg' ? 'моҳ' : language === 'ru' ? 'мес' : 'mo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Down Payment Option */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      {language === 'tg'
                        ? 'Пешпардохт (Первоначальный взнос):'
                        : language === 'ru'
                        ? 'Первоначальный взнос:'
                        : 'Down payment:'}
                    </span>
                    <span className="font-mono text-indigo-700 font-bold">
                      {downPaymentPercent}% ({formattedDown} {t.somoni})
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(isAutoLoan ? [10, 20, 30, 40] : [0, 10, 20, 30]).map((percent) => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => setDownPaymentPercent(percent)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          downPaymentPercent === percent
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Output Cards */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'tg'
                        ? 'Пардохти тахминӣ'
                        : language === 'ru'
                        ? 'Ежемесячный платеж'
                        : 'Est. Monthly Payment'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg sm:text-xl font-black text-indigo-700">
                        ~{formattedMonthly}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{t.somoni}/моҳ</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'tg'
                        ? 'Маблағи маблағгузорӣ'
                        : language === 'ru'
                        ? 'Сумма финансирования'
                        : 'Financed Amount'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg sm:text-xl font-black text-slate-800">
                        {new Intl.NumberFormat('ru-RU').format(calculation.financedAmount)}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{t.somoni}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>
                      {language === 'tg'
                        ? 'Маълумоти харидор барои тамос'
                        : language === 'ru'
                        ? 'Контактные данные покупателя'
                        : 'Buyer Contact Details'}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {language === 'tg'
                          ? 'Ному насаби пурра *'
                          : language === 'ru'
                          ? 'Ф.И.О. полностью *'
                          : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder={language === 'tg' ? 'Масалан: Сомони Раҳимӣ' : 'Например: Алишери Саид'}
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden text-xs sm:text-sm text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {language === 'tg'
                          ? 'Рақами телефон барои тамос *'
                          : language === 'ru'
                          ? 'Номер телефона для связи *'
                          : 'Phone number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+992 90 123 4567"
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden text-xs sm:text-sm text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent & Privacy Notice (Requirement 5) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userConsent}
                      onChange={(e) => setUserConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-800 leading-snug">
                      {language === 'tg'
                        ? 'Ман ба коркарди маълумоти шахсӣ, тафтиши пешакӣ ва тамос гирифтан барои пешниҳоди шартҳои молиявӣ розигӣ медиҳам.'
                        : language === 'ru'
                        ? 'Я даю согласие на обработку персональных данных, предварительный скоринг и связь для предоставления условий финансирования.'
                        : 'I consent to the processing of personal data, preliminary credit check, and being contacted regarding financing conditions.'}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'tg'
                        ? 'Маълумоти шумо комилан махфӣ буда, танҳо барои дархости интихобшуда истифода мешавад.'
                        : language === 'ru'
                        ? 'Ваши данные строго конфиденциальны и защищены шифрованием.'
                        : 'Your data is strictly confidential and protected.'}
                    </span>
                  </div>
                </div>

                {/* Regulatory / Partner Demo Disclaimer (Requirement 6) */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {language === 'tg'
                        ? 'Маълумоти муҳим:'
                        : language === 'ru'
                        ? 'Важная информация:'
                        : 'Important Notice:'}
                    </span>{' '}
                    {language === 'tg'
                      ? 'Ин ҳисобкунӣ ва дархост дар ҳолати пешнамоиши санҷишӣ (намоишӣ) фаъолият дорад. Қарзи воқеӣ ва пардохти қисм-қисм танҳо пас аз пайвастшавии шарикони расмии бонкии Тоҷикистон (Алиф, Эсхата ва ғ.) ва имзои шартномаи расмӣ пешниҳод мегардад.'
                      : language === 'ru'
                      ? 'Расчет и заявка работают в режиме предварительного предзаказа. Реальный кредит и рассрочка предоставляются только после официального подключения банковских партнеров Таджикистана и оформления договора.'
                      : 'This calculation and application function in preview mode. Actual credit and installments are issued only following official integration with licensed banking partners in Tajikistan and signed agreements.'}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 px-4 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                      isAutoLoan
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>{language === 'tg' ? 'Сабти дархост...' : language === 'ru' ? 'Регистрация...' : 'Submitting...'}</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isAutoLoan
                            ? language === 'tg'
                              ? 'Фиристодани дархости автокредит'
                              : language === 'ru'
                              ? 'Подать заявку на автокредит'
                              : 'Submit Auto Loan Application'
                            : language === 'tg'
                            ? 'Фиристодани дархости рассрочка'
                            : language === 'ru'
                            ? 'Подать заявку на рассрочку'
                            : 'Submit Installment Application'}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="py-3 px-4 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    {language === 'tg' ? 'Бекор кардан' : language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
