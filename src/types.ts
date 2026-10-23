export type Language = 'tg' | 'ru' | 'en';

export type ProductCondition = 'all' | 'new' | 'used';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export interface CategoryItem {
  id: string;
  name: Record<Language, string>;
  icon: string;
  count?: number;
}

export interface CityItem {
  id: string;
  name: Record<Language, string>;
  region: Record<Language, string>;
  districts?: Record<Language, string>[];
}

export interface ProductAd {
  id: string;
  title: string;
  description: string;
  price: number; // in Somoni (TJS)
  isNegotiable: boolean;
  category: string;
  city: string;
  district?: string;
  images: string[];
  phone: string;
  sellerId?: string;
  sellerName: string;
  sellerJoined: string;
  createdAt: string;
  views: number;
  condition: 'new' | 'used';
  featured?: boolean;
  isVip?: boolean;
  isUrgent?: boolean;
  isHighlighted?: boolean;
  promotedUntil?: string;
  specs?: Record<string, string>;
  dealRating?: 'super_deal' | 'fair_price' | 'market_price';
  isVerifiedSeller?: boolean;
  sellerRating?: number;
  allowsBarter?: boolean;
  barterNote?: string;
  installmentAvailable?: boolean;
}

export interface FilterState {
  query: string;
  category: string;
  city: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  condition: ProductCondition;
  onlyNegotiable: boolean;
  onlyWithPhotos: boolean;
  sortBy: SortOption;
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number; // in Somoni
  joinedDate: string;
  isVerified: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  adId: string;
  adTitle: string;
  adPrice: number;
  adImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  messages: ChatMessage[];
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCountForUser: Record<string, number>;
  updatedAt: string;
}

export interface InstallmentApplication {
  id: string;
  adId: string;
  adTitle: string;
  adPrice: number;
  adCategory: string;
  adImage?: string;
  type: 'auto_loan' | 'installment';
  applicantName: string;
  applicantPhone: string;
  applicantCity?: string;
  applicantIncome?: string;
  durationMonths: number;
  monthlyEstimate: number;
  downPayment: number;
  userConsent: boolean;
  status: 'pending' | 'reviewing';
  createdAt: string;
}

