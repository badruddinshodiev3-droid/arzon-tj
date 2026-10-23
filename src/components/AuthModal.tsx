import React, { useState, useEffect } from 'react';
import { UserProfile, ProductAd, Language } from '../types';
import { translations } from '../data/translations';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import {
  X,
  Phone,
  Mail,
  Lock,
  User,
  CheckCircle,
  Smartphone,
  Wallet,
  Plus,
  Crown,
  LogOut,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Database,
} from 'lucide-react';

interface AuthModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  userAds: ProductAd[];
  onOpenPromote: (ad: ProductAd) => void;
  onSelectAd: (ad: ProductAd) => void;
  onDeleteAd: (adId: string) => void;
  onTopUpBalance: (amount: number) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  language,
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  userAds,
  onOpenPromote,
  onSelectAd,
  onDeleteAd,
  onTopUpBalance,
}) => {
  const t = translations[language];

  // Auth Mode: 'phone' or 'email'
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'verify'>('input');

  // Phone flow
  const [phone, setPhone] = useState('+992 ');
  const [fullName, setFullName] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [sentCode, setSentCode] = useState('7721');
  const [timer, setTimer] = useState(59);

  // Email flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // Profile View tabs
  const [profileTab, setProfileTab] = useState<'ads' | 'wallet'>('ads');
  const [topUpAmount, setTopUpAmount] = useState('50');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'verify' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  // Handle phone submit -> send SMS
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) {
      alert(
        language === 'tg'
          ? 'Лутфан рақами дурусти Тоҷикистонро ворид кунед (масалан: +992 90 123 4567)'
          : 'Введите правильный номер телефона Таджикистана'
      );
      return;
    }
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setSentCode(generated);
    setStep('verify');
    setTimer(59);
  };

  // Handle SMS code verify
  const handleVerifySms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode === sentCode || smsCode === '1234' || smsCode.length === 4) {
      const cleanPhone = phone.replace(/\D/g, '');
      const newUser: UserProfile = {
        id: `user-${cleanPhone || Date.now()}`,
        name: fullName.trim() || 'Истифодабарандаи Arzon.tj',
        phone: phone.trim(),
        balance: 30, // 30 somoni welcome bonus!
        joinedDate: '2026',
        isVerified: true,
      };
      onLoginSuccess(newUser);
      setStep('input');
    } else {
      alert(
        language === 'tg'
          ? 'Рамзи СМС нодуруст аст! Рамзи санҷиширо ворид кунед: ' + sentCode
          : 'Неверный СМС-код! Код: ' + sentCode
      );
    }
  };

  // Handle email login / register
  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      alert('Email нодуруст аст');
      return;
    }
    const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const newUser: UserProfile = {
      id: `user-${cleanEmail || Date.now()}`,
      name: fullName.trim() || email.split('@')[0],
      email: email.trim(),
      phone: '+992 90 000 0000',
      balance: 20,
      joinedDate: '2026',
      isVerified: true,
    };
    onLoginSuccess(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[94vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white w-full max-w-full box-border">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shrink-0">
              {currentUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {currentUser
                  ? language === 'tg'
                    ? 'Ҳисоби ман'
                    : 'Мой профиль'
                  : language === 'tg'
                  ? 'Вуруд ё бақайдгирӣ'
                  : 'Вход или регистрация'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                {currentUser
                  ? currentUser.phone || currentUser.email
                  : language === 'tg'
                  ? 'Бо рақами телефон ё почта мисли Somon.tj'
                  : 'Вход по номеру телефона или e-mail'}
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

        {/* LOGGED IN PROFILE VIEW */}
        {currentUser ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 w-full max-w-full box-border">
            {/* User Info & Balance Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {currentUser.phone || currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('arzontj:open-supabase-setup'));
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    title={language === 'tg' ? 'Танзимоти Supabase' : 'Настройки Supabase'}
                  >
                    <Database className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Баромадан / Выйти"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Balance bar */}
              <div className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-600 font-medium">
                    Тавозуни шумо:
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {currentUser.balance} {t.somoni}
                  </span>
                </div>

                <button
                  onClick={() => setProfileTab('wallet')}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  + Пур кардан
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                onClick={() => setProfileTab('ads')}
                className={`py-1.5 px-3 rounded-xl transition-colors cursor-pointer ${
                  profileTab === 'ads'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Эълонҳои ман ({userAds.length})
              </button>
              <button
                onClick={() => setProfileTab('wallet')}
                className={`py-1.5 px-3 rounded-xl transition-colors cursor-pointer ${
                  profileTab === 'wallet'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Ҳамён ва пардохтҳо
              </button>
            </div>

            {/* TAB: MY ADS */}
            {profileTab === 'ads' && (
              <div className="space-y-3">
                {userAds.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-xs">
                      Шумо ҳоло ягон эълон надоред.
                    </p>
                  </div>
                ) : (
                  userAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div
                        onClick={() => {
                          onClose();
                          onSelectAd(ad);
                        }}
                        className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={resolveImageUrl(ad.images[0])}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e)}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {ad.title}
                          </h5>
                          <span className="text-xs font-bold text-emerald-700">
                            {new Intl.NumberFormat('ru-RU').format(ad.price)}{' '}
                            {t.somoni}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPromote(ad);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Crown className="w-3 h-3" />
                          <span>VIP</span>
                        </button>
                        <button
                          onClick={() => onDeleteAd(ad.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Нест кардан"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: WALLET */}
            {profileTab === 'wallet' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <h5 className="font-bold text-slate-900">
                    Пур кардани тавозун тавассути Алиф Моби ва DC
                  </h5>
                  <p className="text-slate-600">
                    Маблағро метавонед барои VIP ва Турбо-бардоштани эълонҳои худ сарф кунед.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    Маблағро интихоб кунед:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['20', '50', '100', '200'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(amt)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                          topUpAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {amt} с.
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onTopUpBalance(Number(topUpAmount));
                    alert(
                      `Тавозуни шумо бо муваффақият ${topUpAmount} сомонӣ зиёд шуд!`
                    );
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Пур кардан ({topUpAmount} сомонӣ)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* AUTHENTICATION FORM (PHONE OR EMAIL) */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 w-full max-w-full box-border">
            {/* Method switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setStep('input');
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Бо телефон (+992)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setStep('input');
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'email'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Бо Email</span>
              </button>
            </div>

            {/* PHONE AUTHENTICATION FLOW */}
            {authMethod === 'phone' && (
              <>
                {step === 'input' ? (
                  <form onSubmit={handleSendSms} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Ному насаби шумо (ихтиёрӣ):
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Масалан: Ҷамшед Раҳимов"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Рақами телефони мобилӣ (Тоҷикистон):
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+992 90 123 4567"
                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Ба рақами шумо СМС-код бо 4 рақам фиристода мешавад.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Гирифтани рамзи СМС</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  /* STEP 2: VERIFY SMS */
                  <form onSubmit={handleVerifySms} className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                      <span>Рамзи СМС ба рақами <strong>{phone}</strong> фиристода шуд.</span>
                      <div className="mt-1 text-[11px] text-emerald-700 font-mono font-bold">
                        (Рамзи санҷишӣ барои намоиш: {sentCode})
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Рамзи 4-рақамаро ворид намоед:
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        autoFocus
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-2xl font-bold font-mono py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {timer > 0 ? (
                          `Ирсоли дубора пас аз ${timer} сония`
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTimer(59);
                              setSentCode(
                                Math.floor(1000 + Math.random() * 9000).toString()
                              );
                            }}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            Аз нав фиристодани СМС
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('input')}
                        className="text-slate-500 hover:underline"
                      >
                        Ивази рақам
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Тасдиқ ва воридшавӣ
                    </button>
                  </form>
                )}
              </>
            )}

            {/* EMAIL AUTHENTICATION FLOW */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Ному насаби шумо:
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Масалан: Фаридун"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Почтаи электронӣ (Email):
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shumo@mail.ru"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Рамзи махфӣ (Парол):
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {isRegister
                      ? 'Аллакай аккаунт дорам? Ворид шудан'
                      : 'Бақайдгирии нав'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isRegister ? 'Бақайдгирӣ' : 'Воридшавӣ'}
                </button>
              </form>
            )}

            {/* Explanation box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-0.5">
                Мисли Somon.tj ва дигар сомонаҳои пешрафта:
              </span>
              Дар Тоҷикистон воридшавӣ тавассути СМС-шлюзи OsonSMS / Babilon / Tcell ё почта сурат мегирад. Пас аз воридшавӣ тамоми эълонҳо дар профили шумо нигоҳ дошта мешаванд.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
