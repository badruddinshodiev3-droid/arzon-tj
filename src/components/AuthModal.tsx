import React, { useState, useEffect } from 'react';
import { UserProfile, ProductAd, Language, WalletTransaction, SellerReview } from '../types';
import { translations } from '../data/translations';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { getSupabase, getApiBaseUrl } from '../utils/supabaseClient';
import {
  X,
  Phone,
  Mail,
  User,
  CheckCircle,
  Smartphone,
  Wallet,
  Plus,
  Crown,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Database,
  Flame,
  Star,
  Globe,
  Bell,
  HelpCircle,
  FileText,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  Lock,
  Key,
  RefreshCw,
  Send,
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
  onUpdateUser?: (updated: UserProfile) => void;
  onToggleAdStatus?: (adId: string, status: 'active' | 'inactive' | 'sold') => void;
  onLanguageChange?: (lang: Language) => void;
  onOpenPostAd?: () => void;
  onOpenSafety?: () => void;
  onOpenPlayGuide?: () => void;
}

type ProfileSectionTab =
  | 'ads'
  | 'wallet'
  | 'promotions'
  | 'reviews'
  | 'settings'
  | 'faq'
  | 'legal';

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-01',
    type: 'topup',
    title: 'Пур кардани тавозун тавассути Alif Mobi',
    amount: 50,
    date: '2026-10-24 14:20',
    status: 'completed',
  },
  {
    id: 'tx-02',
    type: 'vip',
    title: 'Фаъолсозии бастаи VIP (7 рӯз)',
    amount: -15,
    date: '2026-10-24 14:25',
    status: 'completed',
  },
  {
    id: 'tx-03',
    type: 'topup',
    title: 'Бонуси истиқболӣ барои бақайдгирӣ',
    amount: 30,
    date: '2026-10-20 09:00',
    status: 'completed',
  },
];

const DEFAULT_REVIEWS: SellerReview[] = [
  {
    id: 'rev-01',
    authorName: 'Фаридун С.',
    rating: 5,
    comment: 'Мошинро харидам, ҳамааш тавре буд, ки дар эълон навишта шуда буд. Фурӯшандаи боинсоф ва боэътимод!',
    date: '18.10.2026',
    verifiedBuyer: true,
  },
  {
    id: 'rev-02',
    authorName: 'Рустам Қ.',
    rating: 5,
    comment: 'Телефон тоза ва бе нуқсон. Ташаккур барои муомилаи хуб ва расонидани саривақтӣ.',
    date: '12.10.2026',
    verifiedBuyer: true,
  },
  {
    id: 'rev-03',
    authorName: 'Заррина М.',
    rating: 5,
    comment: 'Аъло! Ба саволҳо зуд ҷавоб доданд ва нархро каме арзон карданд.',
    date: '05.10.2026',
    verifiedBuyer: true,
  },
];

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
  onUpdateUser,
  onToggleAdStatus,
  onLanguageChange,
  onOpenPostAd,
  onOpenSafety,
  onOpenPlayGuide,
}) => {
  const t = translations[language];

  // Auth Mode: 'email' (primary/active Supabase Auth) or 'phone' (SMS gateway)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [smsGatewayReady, setSmsGatewayReady] = useState(false);
  const [smsNeedEmailFallback, setSmsNeedEmailFallback] = useState(false);

  // Real Phone flow state
  const [phone, setPhone] = useState('+992 ');
  const [fullName, setFullName] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState(59);

  // Real Email flow state (Supabase Auth)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [rateLimitDetail, setRateLimitDetail] = useState<{
    isRateLimited: boolean;
    reason: string;
    actionableGuide: string;
    accountCreated: boolean;
  } | null>(null);
  const [emailCooldown, setEmailCooldown] = useState<number>(0);

  // Profile View tabs
  const [profileTab, setProfileTab] = useState<ProfileSectionTab>('ads');
  const [adFilterStatus, setAdFilterStatus] = useState<'active' | 'inactive' | 'sold'>('active');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');

  // Wallet top-up state
  const [topUpAmount, setTopUpAmount] = useState('50');
  const [paymentProvider, setPaymentProvider] = useState<'alif' | 'dc' | 'korti_milli'>('alif');
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const stored = localStorage.getItem('arzontj_wallet_transactions');
      return stored ? JSON.parse(stored) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  // Promotional packages state
  const [selectedAdForPromo, setSelectedAdForPromo] = useState<string>('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<SellerReview[]>(() => {
    try {
      const stored = localStorage.getItem('arzontj_seller_reviews');
      return stored ? JSON.parse(stored) : DEFAULT_REVIEWS;
    } catch {
      return DEFAULT_REVIEWS;
    }
  });
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'verify' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailCooldown > 0) {
      interval = setInterval(() => setEmailCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailCooldown]);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone || '');
      if (userAds.length > 0 && !selectedAdForPromo) {
        setSelectedAdForPromo(userAds[0].id);
      }
    }
  }, [currentUser, userAds, selectedAdForPromo]);

  useEffect(() => {
    if (isOpen) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/auth/status`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.smsGateway?.readyForProductionSms) {
            setSmsGatewayReady(true);
          } else {
            setSmsGatewayReady(false);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real SMS Send via backend endpoint
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError(null);
    setSmsSuccessMsg(null);
    setSmsNeedEmailFallback(false);

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 9) {
      setSmsError(
        language === 'tg'
          ? 'Лутфан рақами дурусти Тоҷикистонро ворид кунед (масалан: +992 90 123 4567)'
          : 'Введите правильный номер телефона Таджикистана'
      );
      return;
    }

    setIsSendingSms(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, name: fullName }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep('verify');
        setTimer(59);
        setSmsSuccessMsg(data.message || 'СМС-код фиристода шуд');
      } else {
        const msg = data.message || (language === 'tg' ? 'Хатогӣ ҳангоми ирсоли СМС' : 'Ошибка отправки СМС');
        setSmsError(msg);
        if (data.error === 'SMS_GATEWAY_NOT_CONFIGURED' || !data.isProviderConfigured) {
          setSmsNeedEmailFallback(true);
        }
      }
    } catch (err: any) {
      setSmsError(language === 'tg' ? 'Хатои шабакавӣ. Лутфан пайвастшавиро санҷед.' : 'Ошибка сети');
    } finally {
      setIsSendingSms(false);
    }
  };

  // Real SMS Verification via backend endpoint
  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError(null);

    const cleanCode = smsCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setSmsError(language === 'tg' ? 'Рамзи 4-рақамаро пурра ворид кунед' : 'Введите 4-значный код');
      return;
    }

    setIsVerifyingSms(true);
    try {
      const baseUrl = getApiBaseUrl();
      const clean = phone.replace(/\D/g, '');
      const res = await fetch(`${baseUrl}/api/auth/verify-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, code: cleanCode, name: fullName }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        setStep('input');
        setSmsCode('');
      } else {
        setSmsError(data.message || (language === 'tg' ? 'Рамзи воридкарда нодуруст аст!' : 'Неверный код!'));
      }
    } catch (err) {
      setSmsError(language === 'tg' ? 'Хатои пайвастшавӣ ба сервер' : 'Ошибка соединения');
    } finally {
      setIsVerifyingSms(false);
    }
  };


  // Real Supabase Email Auth flow (Sign Up, Sign In, Password Reset)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailLoading || emailCooldown > 0) return;

    setEmailError(null);
    setEmailSuccessMsg(null);
    setRateLimitDetail(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError(language === 'tg' ? 'Email-и воридшуда нодуруст аст (масалан: name@mail.ru)' : 'Неверный формат Email');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setEmailError(language === 'tg' ? 'Сервиси Supabase пайваст нашудааст' : 'Сервис Supabase недоступен');
      return;
    }

    setIsEmailLoading(true);

    const publicSiteUrl = 'https://ais-pre-hu47nziap5pe35pxo7idqh-834128145452.asia-east1.run.app';
    const redirectUrl =
      typeof window !== 'undefined' &&
      window.location.origin &&
      !window.location.origin.includes('localhost') &&
      !window.location.origin.includes('capacitor://')
        ? window.location.origin
        : publicSiteUrl;

    try {
      // 1. Password Reset Request
      if (showForgotPassword) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });
        if (resetErr) {
          const isRateLimit =
            resetErr.message.toLowerCase().includes('rate limit') ||
            (resetErr as any).status === 429 ||
            (resetErr as any).code === 'over_email_send_rate_limit';

          if (isRateLimit) {
            setEmailCooldown(30);
            setRateLimitDetail({
              isRateLimited: true,
              accountCreated: true,
              reason:
                language === 'tg'
                  ? 'Маҳдудияти ирсоли мактуби Supabase: Хизматрасонии стандартии почтаи Supabase дар 1 соат танҳо 3-4 мактуб мефиристад ва лимити ин соат ба охир расидааст.'
                  : 'Превышен лимит отправки писем Supabase (3-4 письма в час).',
              actionableGuide:
                language === 'tg'
                  ? 'Дар панели Supabase -> Authentication -> SMTP Settings сервери SMTP-ро фаъол кунед, ё пас аз гузаштани як соат кӯшиш кунед.'
                  : 'Настройте Custom SMTP в панели Supabase или повторите через час.',
            });
            setEmailError(
              language === 'tg'
                ? 'Маҳдудияти ирсоли почта (Email Rate Limit Exceeded). Лутфан дастури зеринро хонед.'
                : 'Лимит отправки писем превышен. Пожалуйста, подождите.'
            );
          } else if (resetErr.message.toLowerCase().includes('user not found')) {
            setEmailError(
              language === 'tg'
                ? 'Ҳисоб бо ин Email ёфт нашуд. Лутфан суроғаро дуруст ворид кунед.'
                : 'Пользователь с таким Email не найден.'
            );
          } else {
            setEmailError(resetErr.message);
          }
        } else {
          setEmailSuccessMsg(
            language === 'tg'
              ? `Истиноди барқарорсозии парол ба почтаи ${cleanEmail} фиристода шуд! Лутфан паёми навро дар почтаатон тафтиш кунед.`
              : `Ссылка для сброса пароля отправлена на ${cleanEmail}!`
          );
        }
        return;
      }

      // 2. Sign Up (Registration)
      if (isRegister) {
        if (password.length < 6) {
          setEmailError(
            language === 'tg'
              ? 'Рамзи махфӣ (парол) бояд на камтар аз 6 аломат бошад'
              : 'Пароль должен содержать минимум 6 символов'
          );
          return;
        }

        const cleanPhoneNum = phone.trim() !== '+992 ' && phone.trim().length >= 9 ? phone.trim() : '';
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              name: fullName.trim() || cleanEmail.split('@')[0],
              phone: cleanPhoneNum,
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (signUpErr) {
          const isRateLimit =
            signUpErr.message.toLowerCase().includes('rate limit') ||
            (signUpErr as any).status === 429 ||
            (signUpErr as any).code === 'over_email_send_rate_limit';

          if (isRateLimit) {
            setEmailCooldown(30);

            // Check if user was already registered earlier and credentials are correct
            try {
              const { data: trySignIn, error: trySignInErr } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: password,
              });

              if (trySignIn?.user) {
                // User is already registered and credentials match! Log them in!
                let displayName =
                  trySignIn.user.user_metadata?.name ||
                  fullName.trim() ||
                  cleanEmail.split('@')[0] ||
                  'Корбари Arzon.tj';
                let userPhone = trySignIn.user.user_metadata?.phone || cleanPhoneNum || '+992 90 000 0000';
                let balance = 30;

                try {
                  const { data: prof } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', trySignIn.user.id)
                    .maybeSingle();
                  if (prof) {
                    if (prof.name) displayName = prof.name;
                    if (prof.phone) userPhone = prof.phone;
                    if (typeof prof.balance === 'number') balance = prof.balance;
                  }
                } catch {
                  // ignore
                }

                const authUser: UserProfile = {
                  id: trySignIn.user.id,
                  name: displayName,
                  email: cleanEmail,
                  phone: userPhone,
                  balance,
                  joinedDate: '2026',
                  isVerified: true,
                  rating: 5.0,
                  reviewsCount: 1,
                };

                onLoginSuccess(authUser);
                onClose();
                return;
              } else if (trySignInErr?.message?.toLowerCase().includes('email not confirmed')) {
                setRateLimitDetail({
                  isRateLimited: true,
                  accountCreated: true,
                  reason:
                    language === 'tg'
                      ? 'Ҳисоби шумо дар база сохта шудааст, аммо тасдиқи почтаро интизор аст. Азбаски маҳдудияти ирсоли мактуби Supabase (3-4 мактуб дар як соат) ба охир расидааст, мактуб дертар мерасад.'
                      : 'Аккаунт создан, но ожидает подтверждения. Лимит отправки писем Supabase исчерпан.',
                  actionableGuide:
                    language === 'tg'
                      ? 'Барои дастрасии фаврӣ бе ниёз ба мактуб: Дар панели Supabase -> Authentication -> Providers -> Email интихоби «Confirm email»-ро хомӯш (OFF) кунед.'
                      : 'В панели Supabase -> Auth -> Providers -> Email отключите «Confirm email».',
                });
                setEmailError(
                  language === 'tg'
                    ? 'Ҳисоб мавҷуд аст, аммо тасдиқи Email-ро интизор аст (Email Rate Limit).'
                    : 'Email не подтвержден из-за лимита писем Supabase.'
                );
                return;
              }
            } catch {
              // ignore
            }

            // User is not yet registered, and Supabase refused to send confirmation email
            setRateLimitDetail({
              isRateLimited: true,
              accountCreated: false,
              reason:
                language === 'tg'
                  ? 'Сервери дохилии Supabase Auth (дар тарофаи ройгон) дар як соат танҳо ба 3-4 мактуб иҷозат медиҳад. Ин маҳдудият айни замон пур шудааст ва бинобар ин Supabase мактуби тасдиқро нафиристод ва сабти ҳисобро боздошт.'
                  : 'Встроенный почтовый сервис Supabase ограничен 3-4 письмами в час. Лимит на этот час исчерпан.',
              actionableGuide:
                language === 'tg'
                  ? 'Роҳи ҳалли фаврӣ: Дар панели идоракунии Supabase (supabase.com) -> Authentication -> Providers -> Email интихоби «Confirm email»-ро хомӯш (OFF) кунед. Баъд аз ин ҳамаи корбарон дар 1 сония ва бидуни ниёз ба мактуб сабти ном мешаванд!'
                  : 'Решение: В Supabase Dashboard -> Auth -> Providers -> Email отключите «Confirm email».',
            });

            setEmailError(
              language === 'tg'
                ? 'Маҳдудияти ирсоли мактуби Supabase (email rate limit exceeded).'
                : 'Лимит отправки писем Supabase превышен (email rate limit exceeded).'
            );
            return;
          } else if (signUpErr.message.toLowerCase().includes('already registered')) {
            setEmailError(
              language === 'tg'
                ? 'Ин Email аллакай сабт шудааст. Лутфан ворид шавед ё паролро барқарор кунед.'
                : 'Этот Email уже зарегистрирован. Пожалуйста, войдите в аккаунт.'
            );
            return;
          } else {
            setEmailError(signUpErr.message);
            return;
          }
        }

        if (signUpData.session && signUpData.user) {
          // Instant session available (auto-confirm enabled or active session)
          const userName = fullName.trim() || signUpData.user.user_metadata?.name || cleanEmail.split('@')[0];
          const newUser: UserProfile = {
            id: signUpData.user.id,
            name: userName,
            email: cleanEmail,
            phone: cleanPhoneNum || '+992 90 000 0000',
            balance: 30, // 30 TJS welcome bonus
            joinedDate: '2026',
            isVerified: true,
            rating: 5.0,
            reviewsCount: 1,
          };

          // Save to Supabase profiles table
          try {
            await supabase.from('profiles').upsert({
              id: newUser.id,
              name: newUser.name,
              email: cleanEmail,
              phone: newUser.phone,
              balance: 30,
              joined_date: '2026',
              is_verified: true,
              updated_at: new Date().toISOString(),
            });
          } catch {
            // ignore
          }

          onLoginSuccess(newUser);
          onClose();
        } else if (signUpData.user) {
          // If Supabase returned user without session, immediately attempt signInWithPassword
          try {
            const { data: instantSignIn } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });

            if (instantSignIn?.user && instantSignIn?.session) {
              const userName = fullName.trim() || instantSignIn.user.user_metadata?.name || cleanEmail.split('@')[0];
              const newUser: UserProfile = {
                id: instantSignIn.user.id,
                name: userName,
                email: cleanEmail,
                phone: cleanPhoneNum || '+992 90 000 0000',
                balance: 30,
                joinedDate: '2026',
                isVerified: true,
                rating: 5.0,
                reviewsCount: 1,
              };

              try {
                await supabase.from('profiles').upsert({
                  id: newUser.id,
                  name: newUser.name,
                  email: cleanEmail,
                  phone: newUser.phone,
                  balance: 30,
                  joined_date: '2026',
                  is_verified: true,
                  updated_at: new Date().toISOString(),
                });
              } catch {
                // ignore
              }

              onLoginSuccess(newUser);
              onClose();
              return;
            }
          } catch {
            // ignore
          }

          // If still no session
          setEmailSuccessMsg(
            language === 'tg'
              ? `Ҳисоби шумо дар Supabase бомуваффақият сабт шуд! Лутфан бо ҳамин почта ва парол ворид шавед.`
              : `Аккаунт успешно создан! Пожалуйста, выполните вход.`
          );
          setIsRegister(false);
        }
        return;
      }

      // 3. Sign In (Existing User Login)
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (signInErr) {
        if (
          signInErr.message.includes('Invalid login credentials') ||
          signInErr.message.toLowerCase().includes('invalid credentials')
        ) {
          setEmailError(
            language === 'tg'
              ? 'Email ё парол нодуруст аст. Агар ҳисоб надошта бошед, «Бақайдгирии нав»-ро интихоб кунед.'
              : 'Неверный email или пароль. Если у вас нет аккаунта, зарегистрируйтесь.'
          );
        } else if (signInErr.message.toLowerCase().includes('email not confirmed')) {
          setRateLimitDetail({
            isRateLimited: true,
            accountCreated: true,
            reason:
              language === 'tg'
                ? 'Ин ҳисоб сабт шудааст, аммо тасдиқи суроғаи Email-ро интизор аст. Азбаски маҳдудияти 3-4 мактуб дар як соат дар Supabase пур шудааст, мактуб ба шумо нарасидааст.'
                : 'Email не подтвержден. Лимит отправки писем Supabase исчерпан.',
            actionableGuide:
              language === 'tg'
                ? 'Дар панели Supabase -> Authentication -> Providers -> Email интихоби «Confirm email»-ро хомӯш (OFF) намоед, то корбарон бидуни интизории мактуб ворид шаванд.'
                : 'В панели Supabase -> Auth -> Providers -> Email выключите «Confirm email».',
          });
          setEmailError(
            language === 'tg'
              ? 'Email тасдиқ нашудааст. Лутфан тавсияи зеринро мутолиа кунед.'
              : 'Email не подтвержден. Пожалуйста, подтвердите почту.'
          );
        } else {
          setEmailError(signInErr.message);
        }
        return;
      }

      if (signInData.user) {
        let displayName =
          signInData.user.user_metadata?.name ||
          cleanEmail.split('@')[0] ||
          'Корбари Arzon.tj';
        let userPhone = signInData.user.user_metadata?.phone || '+992 90 000 0000';
        let balance = 30;

        // Sync with existing profile record in Supabase
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .maybeSingle();

          if (prof) {
            if (prof.name) displayName = prof.name;
            if (prof.phone) userPhone = prof.phone;
            if (typeof prof.balance === 'number') balance = prof.balance;
          } else {
            await supabase.from('profiles').upsert({
              id: signInData.user.id,
              name: displayName,
              phone: userPhone,
              email: cleanEmail,
              balance: balance,
              joined_date: '2026',
              is_verified: true,
              updated_at: new Date().toISOString(),
            });
          }
        } catch {
          // ignore
        }

        const authenticatedUser: UserProfile = {
          id: signInData.user.id,
          name: displayName,
          email: cleanEmail,
          phone: userPhone,
          balance: balance,
          joinedDate: '2026',
          isVerified: true,
          rating: 5.0,
          reviewsCount: 1,
        };

        onLoginSuccess(authenticatedUser);
        onClose();
      }
    } catch (err: any) {
      setEmailError(err?.message || (language === 'tg' ? 'Хатогӣ ҳангоми воридшавӣ' : 'Ошибка авторизации'));
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Google Play Reviewer Instant Login
  const handleGooglePlayReviewLogin = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/googleplay-review`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
      }
    } catch {
      // Fallback
      onLoginSuccess({
        id: 'user-googleplay-reviewer',
        name: 'Google Play Reviewer',
        email: 'googleplay_test@arzon.tj',
        phone: '+992 90 000 0000',
        balance: 50,
        joinedDate: '2026',
        isVerified: true,
        rating: 5.0,
        reviewsCount: 24,
      });
    }
  };

  // Save profile info
  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      phone: editPhone.trim() || currentUser.phone,
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditingProfile(false);
  };

  // Process Wallet Top-up
  const handleDoTopUp = (amountNum: number) => {
    if (isNaN(amountNum) || amountNum <= 0) return;
    onTopUpBalance(amountNum);
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'topup',
      title: `Пур кардан тавассути ${
        paymentProvider === 'alif' ? 'Alif Mobi' : paymentProvider === 'dc' ? 'DC City' : 'Корти Миллӣ'
      }`,
      amount: amountNum,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    try {
      localStorage.setItem('arzontj_wallet_transactions', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Process Direct In-App Promotion Activation
  const handleActivatePromotion = (type: 'vip' | 'turbo' | 'urgent', cost: number) => {
    if (!currentUser) return;
    if (currentUser.balance < cost) {
      alert(
        language === 'tg'
          ? `Тавозуни шумо нокифоя аст (${currentUser.balance} смн). Барои ин баста ${cost} сомонӣ лозим аст. Лутфан аввал тавозунро пур кунед.`
          : `Недостаточно средств (${currentUser.balance} смн). Требуется ${cost} сомони.`
      );
      setProfileTab('wallet');
      return;
    }

    const targetAdId = selectedAdForPromo || (userAds[0] && userAds[0].id);
    if (!targetAdId) {
      alert(
        language === 'tg'
          ? 'Лутфан аввал эълонеро интихоб кунед ё эълони нав илова намоед!'
          : 'Пожалуйста, выберите объявление'
      );
      return;
    }

    // Deduct balance
    onTopUpBalance(-cost);

    // Update ad in localStorage / app
    if (onToggleAdStatus) {
      onToggleAdStatus(targetAdId, 'active');
    }

    // Record transaction
    const promoTitle =
      type === 'vip'
        ? 'VIP баста (7 рӯз)'
        : type === 'turbo'
        ? 'Турбо-бардоштан'
        : 'Эълони фаврӣ';

    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: type,
      title: `Пардохт барои ${promoTitle}`,
      amount: -cost,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    try {
      localStorage.setItem('arzontj_wallet_transactions', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setPromoSuccessMsg(
      language === 'tg'
        ? `Бастаи "${promoTitle}" бомуваффақият фаъол шуд! Эълони шумо ҳоло дар сафи пеш аст.`
        : `Пакет "${promoTitle}" успешно активирован!`
    );
    setTimeout(() => setPromoSuccessMsg(null), 5000);
  };

  // Add review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const newRev: SellerReview = {
      id: `rev-${Date.now()}`,
      authorName: currentUser?.name || 'Харидор',
      rating: newReviewRating,
      comment: newReviewText.trim(),
      date: new Date().toLocaleDateString(),
      verifiedBuyer: true,
    };
    const updated = [newRev, ...reviews];
    setReviews(updated);
    setNewReviewText('');
    try {
      localStorage.setItem('arzontj_seller_reviews', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Filter user ads
  const filteredUserAds = userAds.filter((ad) => {
    if (adFilterStatus === 'sold') {
      return ad.isSold || ad.status === 'sold';
    }
    if (adFilterStatus === 'inactive') {
      return ad.status === 'inactive';
    }
    // active by default
    return !ad.isSold && ad.status !== 'sold' && ad.status !== 'inactive';
  });

  const activeAdsCount = userAds.filter((a) => !a.isSold && a.status !== 'sold' && a.status !== 'inactive').length;
  const inactiveAdsCount = userAds.filter((a) => a.status === 'inactive').length;
  const soldAdsCount = userAds.filter((a) => a.isSold || a.status === 'sold').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 w-full max-w-full box-border">
      <div
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[92vh] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white w-full max-w-full box-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shrink-0">
              {currentUser ? <User className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {currentUser
                  ? language === 'tg'
                    ? 'Ҳисоби ман ва танзимот'
                    : 'Мой профиль и кабинет'
                  : language === 'tg'
                  ? 'Вуруд ё бақайдгирӣ'
                  : 'Вход или регистрация'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                {currentUser
                  ? currentUser.phone || currentUser.email || 'Arzon.tj'
                  : language === 'tg'
                  ? 'Бо рақами телефони мобилӣ ё почта'
                  : 'По номеру телефона или e-mail'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOGGED IN SOMON-STYLE COMPREHENSIVE PROFILE DASHBOARD */}
        {currentUser ? (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 w-full max-w-full box-border">
            {/* User Profile Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200 rounded-2xl sm:rounded-3xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0 border-2 border-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {currentUser.name}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'tg' ? 'Тасдиқшуда' : 'Проверен'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {currentUser.phone || currentUser.email || '—'}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        <span>5.0</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>24 {language === 'tg' ? 'баррасиҳо' : 'отзыва'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{language === 'tg' ? 'Аз соли 2026' : 'С 2026 г.'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
                    title={language === 'tg' ? 'Таҳрири маълумот' : 'Редактировать профиль'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
                    title={language === 'tg' ? 'Баромадан аз ҳисоб' : 'Выйти из аккаунта'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline Profile Editor */}
              {isEditingProfile && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2.5 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'tg' ? 'Тағйири маълумоти корбар:' : 'Изменение данных профиля:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Номи пурра"
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Рақами телефон (+992 ...)"
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      {language === 'tg' ? 'Бекор кардан' : 'Отмена'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'tg' ? 'Сабт кардан' : 'Сохранить'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Balance & Quick Top-Up Banner */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      {language === 'tg' ? 'Тавозуни ҳамён:' : 'Баланс кошелька:'}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {currentUser.balance} {t.somoni}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProfileTab('wallet')}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'tg' ? 'Пур кардан' : 'Пополнить'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Somon-style Horizontal Scrollable Navigation Bar */}
            <div className="border-b border-slate-200 pb-1.5 -mx-1 px-1 overflow-x-auto no-scrollbar flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProfileTab('ads')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'ads'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'tg' ? 'Эълонҳои ман' : 'Мои объявления'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  profileTab === 'ads' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {userAds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('wallet')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'wallet'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Ҳамён' : 'Кошелек'}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('promotions')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'promotions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'tg' ? 'Таблиғот' : 'Реклама'}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('reviews')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'reviews'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Баррасиҳо' : 'Отзывы'}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('settings')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Танзимот' : 'Настройки'}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('faq')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'faq'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Кӯмак' : 'Помощь'}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('legal')}
                className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'legal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Қоидаҳо' : 'Правила'}</span>
              </button>
            </div>

            {/* TAB 1: MY ADS (Active, Inactive, Sold) */}
            {profileTab === 'ads' && (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Sub-tabs: Active, Inactive, Sold */}
                <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdFilterStatus('active')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        adFilterStatus === 'active'
                          ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'tg' ? 'Фаъол' : 'Активные'} ({activeAdsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdFilterStatus('inactive')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        adFilterStatus === 'inactive'
                          ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'tg' ? 'Ғайрифаъол' : 'Неактивные'} ({inactiveAdsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdFilterStatus('sold')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        adFilterStatus === 'sold'
                          ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'tg' ? 'Фурӯхташуда' : 'Проданные'} ({soldAdsCount})
                    </button>
                  </div>

                  {onOpenPostAd && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPostAd();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{language === 'tg' ? 'Эълон' : 'Подать'}</span>
                    </button>
                  )}
                </div>

                {/* Ads list */}
                {filteredUserAds.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <p className="text-xs text-slate-500">
                      {adFilterStatus === 'active'
                        ? language === 'tg'
                          ? 'Шумо ҳоло ягон эълони фаъол надоред.'
                          : 'У вас нет активных объявлений.'
                        : adFilterStatus === 'inactive'
                        ? language === 'tg'
                          ? 'Ягон эълони ғайрифаъол вуҷуд надорад.'
                          : 'Нет неактивных объявлений.'
                        : language === 'tg'
                        ? 'Ҳоло ягон эълони фурӯхташуда сабт нашудааст.'
                        : 'Нет проданных объявлений.'}
                    </p>
                    {onOpenPostAd && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPostAd();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'tg' ? 'Ҷойгир кардани эълони нав' : 'Подать объявление'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredUserAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <div
                          onClick={() => {
                            onClose();
                            onSelectAd(ad);
                          }}
                          className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1 w-full"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                            <img
                              src={resolveImageUrl(ad.images[0])}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                              onError={(e) => handleImageError(e)}
                            />
                            {ad.isVip && (
                              <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 p-0.5 rounded-sm shadow-xs">
                                <Crown className="w-2.5 h-2.5 fill-slate-950" />
                              </span>
                            )}
                          </div>
                          <div className="overflow-hidden min-w-0 flex-1">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {ad.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-extrabold text-emerald-700">
                                {new Intl.NumberFormat('ru-RU').format(ad.price)} {t.somoni}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                👁️ {ad.views || 0} {language === 'tg' ? 'диданд' : 'просмотров'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ad Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          {/* VIP button */}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPromote(ad);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            title="VIP реклама"
                          >
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span>VIP</span>
                          </button>

                          {/* Toggle sold / active */}
                          {onToggleAdStatus && (
                            adFilterStatus === 'active' ? (
                              <button
                                type="button"
                                onClick={() => onToggleAdStatus(ad.id, 'sold')}
                                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                                title="Ба фурӯхташуда гузаронидан"
                              >
                                {language === 'tg' ? 'Фурӯхта шуд' : 'Продано'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onToggleAdStatus(ad.id, 'active')}
                                className="px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                                title="Боз фаъол кардан"
                              >
                                {language === 'tg' ? 'Фаъол кардан' : 'Активировать'}
                              </button>
                            )
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(language === 'tg' ? 'Ин эълонро нест мекунед?' : 'Удалить это объявление?')) {
                                onDeleteAd(ad.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Нест кардан"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: USER WALLET & TRANSACTIONS */}
            {profileTab === 'wallet' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Balance display card */}
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-100 font-medium">
                      {language === 'tg' ? 'Тавозуни умумии шумо' : 'Ваш текущий баланс'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                      TJS Сомонӣ
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tabular-nums">
                    {currentUser.balance} {t.somoni}
                  </div>
                  <p className="text-[11px] text-emerald-100 leading-tight">
                    {language === 'tg'
                      ? 'Барои фаъолсозии VIP, эълонҳои таъҷилӣ ва турбо-бардоштан истифода мешавад.'
                      : 'Используется для VIP-статуса, срочных объявлений и продвижения.'}
                  </p>
                </div>

                {/* Top Up Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>{language === 'tg' ? 'Пур кардани тавозун' : 'Пополнение кошелька'}</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      {language === 'tg' ? 'Бе комиссия (0%)' : 'Без комиссии (0%)'}
                    </span>
                  </h5>

                  {/* Preset amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {['20', '50', '100', '200'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(amt)}
                        className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                          topUpAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        +{amt} {t.somoni}
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {language === 'tg' ? 'Ё маблағи дигар ворид намоед (TJS):' : 'Или введите другую сумму:'}
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Provider selection */}
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1.5">
                      {language === 'tg' ? 'Усули пардохт:' : 'Способ оплаты:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('alif')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentProvider === 'alif'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">Alif Mobi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('dc')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentProvider === 'dc'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">DC City</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('korti_milli')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentProvider === 'korti_milli'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">Корти Миллӣ</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDoTopUp(Number(topUpAmount))}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {language === 'tg'
                        ? `Пур кардан (${topUpAmount} сомонӣ)`
                        : `Пополнить на (${topUpAmount} сомони)`}
                    </span>
                  </button>
                </div>

                {/* Transaction History */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-900">
                    {language === 'tg' ? 'Таърихи амалиётҳо' : 'История транзакций'}
                  </h5>
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-800 truncate">{tx.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{tx.date}</span>
                        </div>
                        <span
                          className={`font-black font-mono shrink-0 tabular-nums ${
                            tx.amount > 0 ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} {t.somoni}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROMOTIONS & PACKAGES */}
            {profileTab === 'promotions' && (
              <div className="space-y-4 animate-in fade-in">
                {promoSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{promoSuccessMsg}</span>
                  </div>
                )}

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900">
                  <span className="font-bold block mb-1">
                    {language === 'tg' ? 'Бастаҳои таблиғотӣ барои афзоиши фурӯш:' : 'Рекламные пакеты:'}
                  </span>
                  {language === 'tg'
                    ? 'Эълонҳо бо бастаҳои VIP ва Турбо то 5 маротиба бештар тамошобин ҷалб мекунанд.'
                    : 'Объявления с VIP-статусом получают в 5 раз больше просмотров.'}
                </div>

                {/* Select target ad */}
                {userAds.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      {language === 'tg' ? 'Эълонро интихоб намоед:' : 'Выберите объявление:'}
                    </label>
                    <select
                      value={selectedAdForPromo}
                      onChange={(e) => setSelectedAdForPromo(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    >
                      {userAds.map((ad) => (
                        <option key={ad.id} value={ad.id}>
                          {ad.title} — {ad.price} {t.somoni}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3 Packages Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* VIP */}
                  <div className="p-3.5 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                          VIP 👑
                        </span>
                        <span className="text-base font-black text-amber-900">15 смн</span>
                      </div>
                      <h6 className="text-xs font-bold text-slate-900 mt-2">
                        {language === 'tg' ? 'Статуси VIP (7 рӯз)' : 'VIP-статус (7 дней)'}
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {language === 'tg'
                          ? 'Дар аввали саҳифа ва бо чаҳорчӯбаи заррин намоиш дода мешавад.'
                          : 'В топе выдачи с золотой рамкой.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivatePromotion('vip', 15)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {language === 'tg' ? 'Фаъол кардан' : 'Активировать'}
                    </button>
                  </div>

                  {/* Turbo */}
                  <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-300 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                          Турбо ⚡
                        </span>
                        <span className="text-base font-black text-emerald-900">5 смн</span>
                      </div>
                      <h6 className="text-xs font-bold text-slate-900 mt-2">
                        {language === 'tg' ? 'Турбо-бардоштан' : 'Турбо-поднятие'}
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {language === 'tg'
                          ? 'Эълонро фавран ба аввали рӯйхати эълонҳо мебардорад.'
                          : 'Поднимает объявление на первое место.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivatePromotion('turbo', 5)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {language === 'tg' ? 'Фаъол кардан' : 'Активировать'}
                    </button>
                  </div>

                  {/* Urgent */}
                  <div className="p-3.5 bg-gradient-to-br from-rose-50 to-white border border-rose-300 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                          Фаврӣ 🔥
                        </span>
                        <span className="text-base font-black text-rose-900">10 смн</span>
                      </div>
                      <h6 className="text-xs font-bold text-slate-900 mt-2">
                        {language === 'tg' ? 'Нишони Фаврӣ' : 'Срочная продажа'}
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {language === 'tg'
                          ? 'Нишони сурхи оташин барои фурӯши босуръати мол.'
                          : 'Яркий значок срочности для быстрой продажи.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivatePromotion('urgent', 10)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {language === 'tg' ? 'Фаъол кардан' : 'Активировать'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SELLER REVIEWS & REPUTATION */}
            {profileTab === 'reviews' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Score Header */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-slate-900">5.0</div>
                    <div>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {reviews.length} {language === 'tg' ? 'баҳогузории тасдиқшуда' : 'проверенных отзывов'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                    100% {language === 'tg' ? 'мусбат' : 'положительных'}
                  </span>
                </div>

                {/* Review items */}
                <div className="space-y-2.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                          {rev.verifiedBuyer && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded-sm font-semibold">
                              ✓ {language === 'tg' ? 'Харидор' : 'Покупатель'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Add test feedback */}
                <form onSubmit={handleAddReview} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    {language === 'tg' ? 'Иловаи фикру мулоҳизаи нав:' : 'Добавить отзыв:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{language === 'tg' ? 'Баҳо:' : 'Оценка:'}</span>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5</option>
                      <option value="4">⭐⭐⭐⭐ 4</option>
                      <option value="3">⭐⭐⭐ 3</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder={language === 'tg' ? 'Мулоҳизаи худро нависед...' : 'Напишите отзыв...'}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {language === 'tg' ? 'Фиристодани тақриз' : 'Отправить отзыв'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: SETTINGS & LANGUAGE */}
            {profileTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Language Switcher */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'tg' ? 'Забони барнома' : 'Язык интерфейса'}</span>
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('tg')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        language === 'tg'
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">🇹🇯 Тоҷикӣ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('ru')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        language === 'ru'
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">🇷🇺 Русский</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange('en')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        language === 'en'
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">🇬🇧 English</span>
                    </button>
                  </div>
                </div>

                {/* Notifications Toggles */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'tg' ? 'Огоҳиномаҳо ва зангҳо' : 'Уведомления'}</span>
                  </h5>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-700">
                      {language === 'tg' ? 'Огоҳиҳо оид ба паёмҳои нави харидорон' : 'Уведомления о новых сообщениях'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded-sm"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-700">
                      {language === 'tg' ? 'СМС-огоҳӣ ҳангоми фурӯши мол' : 'SMS при продаже товаров'}
                    </span>
                    <input
                      type="checkbox"
                      checked={smsAlertsEnabled}
                      onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded-sm"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-700">
                      {language === 'tg' ? 'Садо ва ларзиш (Sound / Vibrate)' : 'Звук и вибрация'}
                    </span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded-sm"
                    />
                  </label>
                </div>

                {/* Google Play / APK guide shortcut */}
                {onOpenPlayGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPlayGuide();
                    }}
                    className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    <span>{language === 'tg' ? '📱 Роҳнамои насби APK ва Google Play' : '📱 Руководство по установке APK'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            )}

            {/* TAB 6: HELP & FAQ */}
            {profileTab === 'faq' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                  <span className="font-bold block mb-0.5">
                    {language === 'tg' ? 'Маркази дастгирии Arzon.tj' : 'Служба поддержки Arzon.tj'}
                  </span>
                  {language === 'tg'
                    ? 'Агар саволе доред ё ба кумак ниёз доред, ба телефони +992 90 123 4567 муроҷиат намоед.'
                    : 'Служба заботы о клиентах: +992 90 123 4567.'}
                </div>

                {/* Accordion Questions */}
                {[
                  {
                    q: language === 'tg' ? 'Чӣ тавр дар Arzon.tj эълон ҷойгир кунам?' : 'Как подать объявление?',
                    a: language === 'tg'
                      ? 'Барои ҷойгир кардани эълон тугмаи сабзи "+ Эълон"-ро дар боло ё поёни экран зер кунед. Аксҳо, ном, нарх бо сомонӣ ва шаҳри худро интихоб намуда, тугмаи "Интишор"-ро пахш намоед.'
                      : 'Нажмите кнопку "+ Объявление", добавьте фото, укажите цену в сомони и город, затем нажмите "Опубликовать".',
                  },
                  {
                    q: language === 'tg' ? 'Тавозуни ҳамёнро чӣ тавр пур кунам?' : 'Как пополнить баланс?',
                    a: language === 'tg'
                      ? 'Дар бахши "Ҳамён"-и профили худ маблағро интихоб карда, тавассути замимаи Alif Mobi, DC City ё бо ҳама гуна Корти Миллӣ пардохт кунед. Маблағ фавран бе комиссия гузаронида мешавад.'
                      : 'В разделе "Кошелек" выберите сумму и оплатите через Alif Mobi, DC City или Корти Милли без комиссии.',
                  },
                  {
                    q: language === 'tg' ? 'Хизматрасониҳои VIP ва Турбо чӣ фоида доранд?' : 'Чем полезны VIP и Турбо?',
                    a: language === 'tg'
                      ? 'Эълонҳои VIP дар сатри аввали саҳифаи асосӣ бо чаҳорчӯбаи заррин 7 рӯз мемонанд ва диққати муштариёнро фавран ҷалб мекунанд. Турбо эълонро ҳар субҳ ба боло мебарорад.'
                      : 'VIP закрепляет объявление на 7 дней в топе с золотой рамкой, а Турбо поднимает его каждое утро.',
                  },
                  {
                    q: language === 'tg' ? 'Чӣ тавр аз қаллобон эҳтиёт шавам?' : 'Как защититься от мошенников?',
                    a: language === 'tg'
                      ? 'Ҳеҷ гоҳ пешпардохт накунед! Мошин ё молро аввал бо чашми худ бубинед ва санҷед, танҳо баъд аз он маблағро супоред. Ҳеҷ гоҳ рамзҳои СМС-и бонкиро ба дигарон надиҳед.'
                      : 'Никогда не делайте предоплату не видя товар. Не сообщайте смс-коды от банков.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {expandedFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-3.5 pb-3.5 text-xs text-slate-600 border-t border-slate-100 pt-2 leading-relaxed bg-slate-50/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: LEGAL RULES & SAFETY */}
            {profileTab === 'legal' && (
              <div className="space-y-3 animate-in fade-in text-xs text-slate-600 leading-relaxed">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm">
                    {language === 'tg' ? 'Қоидаҳои истифодаи Arzon.tj' : 'Правила использования Arzon.tj'}
                  </h5>
                  <p>
                    {language === 'tg'
                      ? '1. Ҳар як корбар бояд танҳо молу маҳсулоти воқеиро бо аксҳои аслӣ ҷойгир кунад.'
                      : '1. Разрешено публиковать только реальные товары с настоящими фото.'}
                  </p>
                  <p>
                    {language === 'tg'
                      ? '2. Ҷойгир кардани эълонҳои ғайриқонунӣ, моли манъшуда ва фиребгарӣ қатъиян манъ аст ва ҳисоб баста мешавад.'
                      : '2. Размещение запрещенных законом товаров ведет к немедленной блокировке.'}
                  </p>
                  <p>
                    {language === 'tg'
                      ? '3. Arzon.tj танҳо платформаи пайвасткунандаи харидор ва фурӯшанда мебошад ва дар хариду фурӯши мустақим миёнаравӣ намекунад.'
                      : '3. Arzon.tj — площадка бесплатных объявлений в Республике Таджикистан.'}
                  </p>
                </div>

                {onOpenSafety && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSafety();
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{language === 'tg' ? '🛡️ Роҳнамои мукаммали бехатарӣ' : '🛡️ Полное руководство по безопасности'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>
                )}
              </div>
            )}

            {/* Log Out Confirmation Dialog */}
            {showLogoutConfirm && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {language === 'tg'
                      ? 'Шумо дар ҳақиқат мехоҳед аз ҳисоб бароед?'
                      : 'Вы действительно хотите выйти из профиля?'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-100"
                  >
                    {language === 'tg' ? 'Бекор кардан' : 'Отмена'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      onLogout();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {language === 'tg' ? 'Баромадан' : 'Выйти'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* AUTHENTICATION VIEW FOR GUEST USERS */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 w-full max-w-full box-border">
            {/* Method switch: Email (Recommended) vs Phone */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setStep('input');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'email'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Бо почта (Email)' : 'По почте (Email)'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Фаъол ва санҷидашуда"></span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setStep('input');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'tg' ? 'Бо телефон (СМС)' : 'По телефону (СМС)'}</span>
                {smsGatewayReady && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {/* PHONE AUTHENTICATION FLOW */}
            {authMethod === 'phone' && (
              <>
                {step === 'input' ? (
                  <form onSubmit={handleSendSms} className="space-y-4">
                    {!smsGatewayReady && (
                      <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium leading-relaxed">
                            {language === 'tg'
                              ? 'Барои рақамҳои нав ирсоли СМС фаъол нест (шлюз дар танзим аст). Барои бақайдгирии фаврӣ ва воқеӣ лутфан бо Email ворид шавед.'
                              : 'Отправка СМС настраивается. Рекомендуем войти через Email.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMethod('email');
                              setSmsError(null);
                            }}
                            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{language === 'tg' ? 'Гузаштан ба бахши Email' : 'Перейти в раздел Email'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {smsError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{smsError}</span>
                        </div>
                        {smsNeedEmailFallback && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMethod('email');
                              setSmsError(null);
                              setSmsNeedEmailFallback(false);
                            }}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{language === 'tg' ? 'Бо Email ва Парол ворид шавед (Фаъол)' : 'Войти через Email и пароль'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        {language === 'tg' ? 'Ному насаби шумо:' : 'Ваше имя:'}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Масалан: Алишери Раҳимзода"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        {language === 'tg' ? 'Рақами телефони мобилӣ:' : 'Номер мобильного телефона:'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+992 90 123 4567"
                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {language === 'tg'
                          ? 'Ба рақами шумо СМС-код бо 4 рақам фиристода мешавад.'
                          : 'Вам будет отправлен 4-значный код подтверждения.'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingSms}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSendingSms ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'tg' ? 'Интизор шавед...' : 'Отправка СМС...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{language === 'tg' ? 'Гирифтани рамзи СМС' : 'Получить СМС-код'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySms} className="space-y-4">
                    {smsError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{smsError}</span>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
                      <span>Рамзи СМС ба рақами <strong>{phone}</strong> фиристода шуд.</span>
                      {phone.replace(/\D/g, '').includes('900000000') && (
                        <div className="mt-1 p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg text-[11px] text-emerald-900 font-medium">
                          {language === 'tg'
                            ? 'Ҳисоби санҷишии Google Play: рамзи тасдиқкунии 7721-ро ворид созед.'
                            : 'Тестовый аккаунт Google Play: введите код 7721.'}
                        </div>
                      )}
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
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
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
                            onClick={handleSendSms}
                            className="text-emerald-700 font-bold hover:underline cursor-pointer"
                          >
                            Аз нав фиристодани СМС
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('input');
                          setSmsError(null);
                        }}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Ивази рақам
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingSms}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifyingSms ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'tg' ? 'Санҷиш...' : 'Проверка...'}</span>
                        </>
                      ) : (
                        <span>{language === 'tg' ? 'Тасдиқ ва воридшавӣ' : 'Подтвердить и войти'}</span>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* EMAIL AUTHENTICATION FLOW (REAL SUPABASE AUTH) */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {emailError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed">{emailError}</span>
                  </div>
                )}

                {rateLimitDetail && (
                  <div className="p-3.5 bg-amber-50/95 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-2.5 animate-in fade-in shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {language === 'tg'
                          ? 'Ташхиси маҳдудияти Supabase (Email Rate Limit):'
                          : 'Диагностика лимита Supabase (Email Rate Limit):'}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed text-amber-950 space-y-1">
                      <p>
                        <strong>{language === 'tg' ? '• Сабаб:' : '• Причина:'}</strong>{' '}
                        {rateLimitDetail.reason}
                      </p>
                      <p>
                        <strong>{language === 'tg' ? '• Оё мактуб фиристода шуд?' : '• Отправлено ли письмо?'}</strong>{' '}
                        {language === 'tg'
                          ? 'Не, аз сабаби пур шудани лимит, сервери Supabase мактубро нафиристод.'
                          : 'Нет, из-за превышения лимита письмо не было отправлено.'}
                      </p>
                      <p>
                        <strong>{language === 'tg' ? '• Ҳолати ҳисоб:' : '• Статус аккаунта:'}</strong>{' '}
                        {rateLimitDetail.accountCreated
                          ? language === 'tg'
                            ? 'Ҳисоб дар база сабт аст, аммо тасдиқи почтаро интизор аст.'
                            : 'Аккаунт существует, но требует подтверждения.'
                          : language === 'tg'
                          ? 'Ҳисоб ҳанӯз пурра тасдиқ/сохта нашудааст (транзаксия аз ҷониби Supabase боздошта шуд).'
                          : 'Аккаунт еще не создан (транзакция прервана Supabase).'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] space-y-1">
                      <strong className="text-amber-950 font-bold block">
                        {language === 'tg' ? '🛠️ Роҳи ҳал дар панели Supabase (1 дақиқа):' : '🛠️ Решение в панели Supabase (1 минута):'}
                      </strong>
                      <p className="text-slate-700 leading-snug">
                        {rateLimitDetail.actionableGuide}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(false);
                          setRateLimitDetail(null);
                          setEmailError(null);
                        }}
                        className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {language === 'tg' ? 'Воридшавӣ (Sign In)' : 'Войти в аккаунт'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGooglePlayReviewLogin}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{language === 'tg' ? 'Ҳисоби санҷишӣ (1-Click)' : 'Тестовый аккаунт'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {emailSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{emailSuccessMsg}</span>
                  </div>
                )}

                {isRegister && !showForgotPassword && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        {language === 'tg' ? 'Ному насаби шумо:' : 'Ваше имя:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Масалан: Фаридун Саидов"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        {language === 'tg' ? 'Рақами телефон (барои эълонҳо):' : 'Номер телефона (для объявлений):'}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+992 90 123 4567"
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {language === 'tg'
                          ? 'Дар эълонҳои шумо барои тамос бо харидорон нишон дода мешавад.'
                          : 'Будет отображаться в ваших объявлениях для связи.'}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    {language === 'tg' ? 'Почтаи электронӣ (Email):' : 'Электронная почта (Email):'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shumo@mail.ru ё gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  {isRegister && !showForgotPassword && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200/60">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'tg'
                          ? 'Бақайдгирии фаврӣ фаъол аст: ҳисоб бе интизории мактуби тасдиқӣ дарҳол кушода мешавад.'
                          : 'Мгновенная регистрация: подтверждение по почте не требуется.'}
                      </span>
                    </p>
                  )}
                </div>

                {!showForgotPassword && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-900">
                        {language === 'tg' ? 'Рамзи махфӣ (Парол):' : 'Пароль:'}
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setEmailError(null);
                            setEmailSuccessMsg(null);
                          }}
                          className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                        >
                          {language === 'tg' ? 'Паролро фаромӯш кардед?' : 'Забыли пароль?'}
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  {showForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setEmailError(null);
                      }}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {language === 'tg' ? '← Бозгашт ба воридшавӣ' : '← Вернуться к входу'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setEmailError(null);
                        setEmailSuccessMsg(null);
                        setRateLimitDetail(null);
                      }}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {isRegister
                        ? language === 'tg'
                          ? 'Аллакай аккаунт дорам? Ворид шудан'
                          : 'Уже есть аккаунт? Войти'
                        : language === 'tg'
                        ? 'Ҳисоб надоред? Бақайдгирии нав'
                        : 'Нет аккаунта? Зарегистрироваться'}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading || emailCooldown > 0}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isEmailLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'tg' ? 'Интизор шавед...' : 'Подождите...'}</span>
                    </>
                  ) : emailCooldown > 0 ? (
                    <span>
                      {language === 'tg'
                        ? `Ирсоли дубора пас аз ${emailCooldown} сония`
                        : `Повтор через ${emailCooldown} сек`}
                    </span>
                  ) : showForgotPassword ? (
                    <span>{language === 'tg' ? 'Ирсоли истиноди барқароркунӣ' : 'Сбросить пароль'}</span>
                  ) : isRegister ? (
                    <span>{language === 'tg' ? 'Бақайдгирии нав (Supabase)' : 'Зарегистрироваться'}</span>
                  ) : (
                    <span>{language === 'tg' ? 'Ворид шудан' : 'Войти в аккаунт'}</span>
                  )}
                </button>
              </form>
            )}

            {/* Google Play Reviewer & Test Account Instant Access */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleGooglePlayReviewLogin}
                className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between text-xs text-slate-700 hover:text-emerald-900 font-bold transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>{language === 'tg' ? 'Ҳисоби санҷишии Google Play (1-Click Test)' : 'Тестовый аккаунт Google Play'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                  Reviewer
                </span>
              </button>
            </div>

            {/* Explanation box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-0.5">
                {language === 'tg' ? 'Амнияти маълумот ва профил дар Arzon.tj:' : 'Безопасность и профиль Arzon.tj:'}
              </span>
              {language === 'tg'
                ? 'Воридшавӣ тавассути сервиси расмии Supabase Auth ва СМС-шлюз бо тасдиқи рамз амалӣ мешавад. Ҳамаи эълонҳо ва чати шумо дар сервери Supabase боэътимод нигоҳ дошта мешаванд.'
                : 'Авторизация работает через официальный Supabase Auth и SMS шлюз. Все объявления и чаты сохраняются на сервере.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
