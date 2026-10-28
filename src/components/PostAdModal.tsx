import React, { useState, useRef, useEffect } from 'react';
import { ProductAd, Language, UserProfile } from '../types';
import { translations } from '../data/translations';
import { CITIES, CATEGORIES } from '../data/taxonomy';
import { resolveImageUrl, compressAndReadImage, handleImageError, FALLBACK_IMAGE } from '../utils/imageUtils';
import {
  X,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Loader2,
  Phone,
  Tag,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';

interface PostAdModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onAdCreated: (newAd: ProductAd) => void;
  currentUser?: UserProfile | null;
}

export const PostAdModal: React.FC<PostAdModalProps> = ({
  language,
  isOpen,
  onClose,
  onAdCreated,
  currentUser,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset stock images with verified HTTPS CDN URLs
  const SAMPLE_PRESETS = [
    {
      label: language === 'tg' ? 'Toyota Camry' : language === 'ru' ? 'Toyota Camry' : 'Toyota Camry',
      url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: language === 'tg' ? 'iPhone 15 Pro' : language === 'ru' ? 'iPhone 15 Pro' : 'iPhone 15 Pro',
      url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: language === 'tg' ? 'Манзили Душанбе' : language === 'ru' ? 'Квартира Душанбе' : 'Apartment Dushanbe',
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: language === 'tg' ? 'Қолини тоҷикӣ' : language === 'ru' ? 'Таджикский ковер' : 'Tajik Carpet',
      url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<'new' | 'used'>('used');
  const [city, setCity] = useState('dushanbe');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('+992 ');
  const [images, setImages] = useState<string[]>([
    '/images/ad_iphone_15_pro_1792056804198.jpg',
  ]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.name && !sellerName) {
        setSellerName(currentUser.name);
      }
      if (currentUser.phone && (phone === '+992 ' || !phone.trim())) {
        setPhone(currentUser.phone);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const selectedCityObj = CITIES.find((c) => c.id === city);
  const availableDistricts = selectedCityObj?.districts || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrorMsg(
        language === 'tg'
          ? 'Ҳадди аксар 5 сурат иҷозат дода мешавад'
          : language === 'ru'
          ? 'Максимум 5 фотографий'
          : 'Maximum 5 photos allowed'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessingImages(true);
    setErrorMsg('');

    try {
      const remainingSlots = 5 - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      // Process and compress each image for fast Android rendering
      const compressedUrls = await Promise.all(
        filesToProcess.map((file) => compressAndReadImage(file))
      );

      setImages((prev) => [...prev, ...compressedUrls.filter(Boolean)]);
    } catch {
      setErrorMsg(
        language === 'tg'
          ? 'Хатогӣ ҳангоми боргирии сурат'
          : language === 'ru'
          ? 'Ошибка при загрузке фото'
          : 'Error processing photos'
      );
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addPresetImage = (url: string) => {
    if (images.length >= 5) {
      setErrorMsg(
        language === 'tg'
          ? 'Ҳадди аксар 5 сурат иҷозат дода мешавад'
          : language === 'ru'
          ? 'Максимум 5 фотографий'
          : 'Maximum 5 photos allowed'
      );
      return;
    }
    setImages((prev) => [...prev, url]);
    setErrorMsg('');
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg(
        language === 'tg'
          ? 'Лутфан номи молро ворид кунед'
          : language === 'ru'
          ? 'Пожалуйста, введите название товара'
          : 'Please enter product title'
      );
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg(
        language === 'tg'
          ? 'Лутфан нархро бо сомонӣ ворид намоед'
          : language === 'ru'
          ? 'Пожалуйста, укажите цену в сомони'
          : 'Please enter a valid price in TJS'
      );
      return;
    }
    if (!sellerName.trim()) {
      setErrorMsg(
        language === 'tg'
          ? 'Лутфан номи худро ворид кунед'
          : language === 'ru'
          ? 'Укажите ваше имя'
          : 'Please enter your name'
      );
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMsg(
        language === 'tg'
          ? 'Лутфан рақами телефони дурустро ворид кунед'
          : language === 'ru'
          ? 'Введите корректный номер телефона'
          : 'Please enter a valid phone number'
      );
      return;
    }

    const newAd: ProductAd = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      description:
        description.trim() ||
        (language === 'tg'
          ? 'Маҳсулот дар ҳолати хуб, барои маълумоти бештар занг занед.'
          : language === 'ru'
          ? 'Товар в хорошем состоянии, звоните для подробностей.'
          : 'Item in good condition. Contact seller for details.'),
      price: Number(price),
      isNegotiable,
      category,
      city,
      district: district || undefined,
      images:
        images.length > 0
          ? images
          : ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80', '/images/ad_toyota_camry_1792056773231.jpg'],
      phone: phone.trim(),
      sellerId:
        currentUser?.id ||
        (phone.replace(/\D/g, '').length >= 9
          ? `user-${phone.replace(/\D/g, '')}`
          : `seller-${Date.now()}`),
      sellerName: sellerName.trim(),
      sellerJoined: '2026',
      createdAt: new Date().toISOString(),
      views: 1,
      condition,
      featured: false,
    };

    onAdCreated(newAd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6 w-full max-w-full box-border animate-in fade-in duration-200 overflow-hidden">
      <div
        className="bg-white w-full max-w-2xl sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-slate-200 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden relative box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white sticky top-0 z-20 w-full max-w-full box-border">
          <div className="min-w-0 pr-3">
            <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">
              {t.postAdTitle}
            </h2>
            <p className="text-xs text-slate-500 truncate">{t.postAdSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-full box-border">
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 w-full max-w-full box-border">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Photo Uploader (Up to 5 photos) with Android Camera/Gallery Support */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{t.adPhotosLabel}</span>
                  <span className="text-slate-400 font-normal">
                    ({images.length}/5)
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {t.adPhotosHint}
                </span>
              </div>

              {/* Photos preview grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs"
                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:bg-rose-600 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold shadow-xs">
                        {language === 'tg' ? 'Асосӣ' : language === 'ru' ? 'Главное' : 'Main'}
                      </span>
                    )}
                  </div>
                ))}

                {/* Upload Button Slot if < 5 */}
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 cursor-pointer p-2 text-center active:bg-emerald-100/50">
                    {isProcessingImages ? (
                      <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mb-1" />
                    ) : (
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-slate-400 group-hover:text-emerald-600" />
                    )}
                    <span className="text-[10px] font-semibold leading-tight line-clamp-2">
                      {isProcessingImages
                        ? (language === 'tg' ? 'Боргирӣ...' : language === 'ru' ? 'Сжатие...' : 'Processing...')
                        : t.uploadPhoto}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                      multiple
                      disabled={isProcessingImages}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Quick Demo Image Presets */}
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{language === 'tg' ? 'Намунаи акс:' : language === 'ru' ? 'Пример фото:' : 'Photo samples:'}</span>
                </span>
                {SAMPLE_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => addPresetImage(p.url)}
                    disabled={images.length >= 5}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Product Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.adTitleLabel} *</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.adTitlePlaceholder}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium box-border"
              />
            </div>

            {/* Category & Condition Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  {t.adCategoryLabel} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium cursor-pointer box-border"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  {t.condition}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition('used')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      condition === 'used'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.condUsed}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('new')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      condition === 'new'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.condNew}
                  </button>
                </div>
              </div>
            </div>

            {/* Price & Negotiable */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="block text-xs font-bold text-slate-900">
                {t.adPriceLabel} *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t.adPricePlaceholder}
                    className="w-full px-3.5 py-2.5 text-base font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 tabular-nums box-border"
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                  {t.somoni}
                </span>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="font-semibold">{t.negotiable}</span>
              </label>
            </div>

            {/* City & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.adCityLabel} *</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium cursor-pointer box-border"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language]} ({c.region[language]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  {t.adDistrictLabel}
                </label>
                <select
                  value={district}
                  disabled={availableDistricts.length === 0}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium disabled:opacity-50 cursor-pointer box-border"
                >
                  <option value="">{t.allDistricts}</option>
                  {availableDistricts.map((d, idx) => (
                    <option key={idx} value={d[language]}>
                      {d[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                {t.adDescriptionLabel}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.adDescriptionPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 leading-relaxed font-normal box-border resize-none"
              />
            </div>

            {/* Seller Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  {t.sellerNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder={language === 'tg' ? 'Масалан: Далер' : language === 'ru' ? 'Например: Далер' : 'e.g. Daler'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium box-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.sellerPhoneLabel} *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+992 90 000 0000"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono font-medium box-border"
                />
              </div>
            </div>

            {/* Bottom Scroll Padding for comfortable mobile scrolling */}
            <div className="h-4 sm:h-2" />
          </div>

          {/* Sticky Bottom Action Bar - ALWAYS REACHABLE ON MOBILE */}
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))] w-full box-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isProcessingImages}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{t.publishAd}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
