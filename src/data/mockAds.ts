import { ProductAd } from '../types';
import { resolveImageUrl } from '../utils/imageUtils';
import { getSupabase } from '../utils/supabaseClient';

const INITIAL_ADS_DATA: ProductAd[] = [
  {
    id: 'ad-01',
    title: 'Toyota Camry 2.5 LE (2021) Тоза',
    description: 'Мошин дар ҳолати беҳтарин қарор дорад. Бе ягон хароҷот, ҳуҷҷатҳояш то охири сол, утилизатсия ва техосмотр гузаштагӣ. Мотор ва коробка 100%. Кондиционер кор мекунад, салон тоза. Савдо дорад назди мошин.',
    price: 185000,
    isNegotiable: true,
    category: 'auto',
    city: 'dushanbe',
    district: 'Исмоили Сомонӣ',
    images: [
      '/images/ad_toyota_camry_1792056773231.jpg',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 90 123 4567',
    sellerName: 'Ҷамшед Раҳимов',
    sellerJoined: '2023',
    createdAt: '2026-10-14T08:30:00Z',
    views: 412,
    condition: 'used',
    featured: true,
    specs: {
      'Сол': '2021',
      'Муҳаррик': '2.5 л бензин',
      'Қуттии редуктор': 'Автомат',
      'Масофа': '48 000 км'
    }
  },
  {
    id: 'ad-02',
    title: 'Apple iPhone 15 Pro 256GB Natural Titanium',
    description: 'iPhone 15 Pro, хотира 256GB. Ҳолаташ 10 аз 10, бе ягон харошида, ҳама вақт бо чехол ва шишаи муҳофиз истифода бурда шудааст. Батарея 98%. Қуттӣ ва кабел дорад. Регистрацияи сим-корт шудааст.',
    price: 10400,
    isNegotiable: true,
    category: 'electronics',
    city: 'dushanbe',
    district: 'Сино',
    images: [
      '/images/ad_iphone_15_pro_1792056804198.jpg',
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 98 765 4321',
    sellerName: 'Парвиз Назаров',
    sellerJoined: '2024',
    createdAt: '2026-10-15T01:15:00Z',
    views: 689,
    condition: 'used',
    featured: true,
    specs: {
      'Хотира': '256 GB',
      'Ранг': 'Natural Titanium',
      'Батарея': '98%',
      'Растаможка': 'Ҳаст'
    }
  },
  {
    id: 'ad-03',
    title: 'Хонаи 3-ҳуҷрагӣ бо таъмир дар маркази Душанбе',
    description: 'Хонаи замонавӣ дар ошёнаи 8-ум, бинои нави замонавӣ бо 2 лифт. 102 метри мураббаъ, тирезаҳо ба сӯи майдони Исмоили Сомонӣ ва кӯҳҳои зебо нигаронида шудаанд. Гармидиҳии марказӣ, ҳама шароит муҳайёст. Техпаспорт дорад.',
    price: 680000,
    isNegotiable: true,
    category: 'real-estate',
    city: 'dushanbe',
    district: 'Шоҳмансур',
    images: [
      '/images/ad_dushanbe_apartment_1792056839832.jpg',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 93 500 1122',
    sellerName: 'Наргис Саидова',
    sellerJoined: '2022',
    createdAt: '2026-10-13T14:20:00Z',
    views: 1250,
    condition: 'new',
    featured: true,
    specs: {
      'Майдон': '102 м²',
      'Ошёна': '8 аз 16',
      'Ҳуҷраҳо': '3',
      'Таъмир': 'Евротаъмир'
    }
  },
  {
    id: 'ad-04',
    title: 'Қолини дастибофти пашмини суннатии Тоҷикӣ',
    description: 'Қолини дастӣ бофташуда аз пашми табиӣ бо рангҳои табиии гиёҳӣ. Андоза 2x3 метр. Нақшу нигори миллии кӯҳистонӣ. Сифати олӣ ва беназир барои меҳмонхона ё тӯҳфаи хотиравӣ.',
    price: 3200,
    isNegotiable: false,
    category: 'crafts',
    city: 'khujand',
    district: 'Панҷшанбе',
    images: [
      '/images/ad_tajik_carpet_1792056885098.jpg',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 92 888 7766',
    sellerName: 'Маъруф Устоев',
    sellerJoined: '2023',
    createdAt: '2026-10-12T11:00:00Z',
    views: 310,
    condition: 'new',
    featured: false,
    specs: {
      'Андоза': '200x300 см',
      'Мавод': '100% пашми табиӣ',
      'Тарз': 'Бофти дастӣ'
    }
  },
  {
    id: 'ad-05',
    title: 'Дивани бароҳат барои меҳмонхона бо болиштҳо',
    description: 'Дивани нав бо тарҳи зебои аврупоӣ, кушодашаванда бо ҷои либосмонӣ. Матоъаш тозашаванда (антикоготь), ранги хокистарӣ. Истеҳсоли фабрикаи Хуҷанд.',
    price: 2400,
    isNegotiable: true,
    category: 'home-garden',
    city: 'khujand',
    district: 'Марказ',
    images: [
      '/images/ad_dushanbe_apartment_1792056839832.jpg',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 92 444 3322',
    sellerName: 'Олимҷон',
    sellerJoined: '2024',
    createdAt: '2026-10-14T16:45:00Z',
    views: 195,
    condition: 'new',
    featured: false,
    specs: {
      'Андоза': '220x150 см',
      'Механизм': 'Еврокитоб',
      'Ҳолат': 'Нав'
    }
  },
  {
    id: 'ad-06',
    title: 'Либоси миллии чакан ва атласи дастидӯзӣ',
    description: 'Куртаи атласи тозаи хуҷандӣ бо дӯхти чакани боҳашамат барои тӯю маъракаҳо. Андозаи 42-46 танзим мешавад. Комилан нав ва бо риштаҳои шоҳӣ дӯхта шудааст.',
    price: 650,
    isNegotiable: true,
    category: 'fashion',
    city: 'kulob',
    district: '',
    images: [
      '/images/ad_tajik_carpet_1792056885098.jpg',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 93 111 2233',
    sellerName: 'Шаҳло',
    sellerJoined: '2025',
    createdAt: '2026-10-14T09:10:00Z',
    views: 280,
    condition: 'new',
    featured: false,
    specs: {
      'Андоза': 'M (44)',
      'Матоъ': 'Атласи тоза',
      'Навъ': 'Дастидӯз'
    }
  },
  {
    id: 'ad-07',
    title: 'Hyundai Sonata 2.0 (2018) Дар ҳолати хуб',
    description: 'Сонатаи тоза, газ-бензин евро 4. Ба наздикӣ равғанҳо ва колодкаҳо иваз шудаанд. Салон чармӣ, монитори калон, камераи қафо. Фурӯши фаврӣ бо сабаби сафар.',
    price: 118000,
    isNegotiable: true,
    category: 'auto',
    city: 'bokhtar',
    district: '',
    images: [
      '/images/ad_toyota_camry_1792056773231.jpg',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 90 777 9900',
    sellerName: 'Фарҳод',
    sellerJoined: '2024',
    createdAt: '2026-10-11T12:00:00Z',
    views: 520,
    condition: 'used',
    featured: false,
    specs: {
      'Сол': '2018',
      'Сӯзишворӣ': 'Бензин + Газ',
      'Пробег': '110 000 км'
    }
  },
  {
    id: 'ad-08',
    title: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    description: 'Samsung S24 Ultra, 512GB, 12GB RAM. Бо тамоми ҳуҷҷатҳо, кафолати расмӣ дар Тоҷикистон. Стилуси S-Pen кор мекунад, камераҳои 200MP бо зуми аъло.',
    price: 9200,
    isNegotiable: false,
    category: 'electronics',
    city: 'dushanbe',
    district: 'Фирдавсӣ',
    images: [
      '/images/ad_iphone_15_pro_1792056804198.jpg',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 91 999 5544',
    sellerName: 'Алишер Содиқов',
    sellerJoined: '2023',
    createdAt: '2026-10-15T02:00:00Z',
    views: 340,
    condition: 'new',
    featured: true,
    specs: {
      'Хотира': '512 GB',
      'Камера': '200 MP',
      'Ҳолат': 'Комилан нав'
    }
  },
  {
    id: 'ad-09',
    title: 'Тепловентилятор RAF Ceramic Fan Heater 1500W',
    description: 'Гармкунандаи барқии сафолӣ (керамический). Барои хона ва офис, гармиро зуд паҳн мекунад, сарфаи барқ (энергосберегающий). 2 реҷаи гармдиҳӣ ва термостат. Дастрасии ройгон дар ш. Душанбе.',
    price: 300,
    isNegotiable: true,
    category: 'home-garden',
    city: 'dushanbe',
    district: 'Сино',
    images: [
      '/images/somon_heater_appliance_1792065954779.jpg',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 90 400 5566',
    sellerName: 'Мағозаи Техникаи Нав',
    sellerJoined: '2024',
    createdAt: '2026-10-15T04:20:00Z',
    views: 890,
    condition: 'new',
    featured: true,
    isUrgent: true,
    specs: {
      'Қувват': '1500 W',
      'Гармдиҳӣ': 'Керамика',
      'Ҳолат': 'Нав дар қуттӣ'
    }
  },
  {
    id: 'ad-10',
    title: 'Радиатор равғанӣ 13 сексия бо терморегулятор',
    description: 'Радиатори равғании 13-бахша бо вентилятори иловагӣ. Барои хонаҳои калон то 30 кв.м мувофиқ аст. Бехатар ва солим, ҳаворо хушк намекунад.',
    price: 445,
    isNegotiable: false,
    category: 'home-garden',
    city: 'dushanbe',
    district: 'Шоҳмансур',
    images: [
      '/images/somon_heater_appliance_1792065954779.jpg',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 98 333 2211',
    sellerName: 'Элёр',
    sellerJoined: '2025',
    createdAt: '2026-10-15T03:50:00Z',
    views: 620,
    condition: 'new',
    featured: true,
    specs: {
      'Сексия': '13 бахш',
      'Қувват': '2500 W',
      'Навъ': 'Равғанӣ (Масляный)'
    }
  },
  {
    id: 'ad-11',
    title: 'BYD Song Plus EV (2024) Электромобили нав',
    description: 'Электромобили замонавӣ, бо 1 бор қувватгирӣ 520 км масофа мегардад. Салони чарми мулоим, панорама, круиз-контроли интеллектуалӣ, камераи 360 дараҷа. Кафолати расмӣ.',
    price: 198000,
    isNegotiable: true,
    category: 'auto',
    city: 'dushanbe',
    district: 'Исмоили Сомонӣ',
    images: [
      '/images/somon_ev_car_1792065986929.jpg',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 93 888 0099',
    sellerName: 'Автосалони Сомон',
    sellerJoined: '2023',
    createdAt: '2026-10-15T04:40:00Z',
    views: 1430,
    condition: 'new',
    featured: true,
    isVip: true,
    specs: {
      'Сол': '2024',
      'Захираи роҳ': '520 км',
      'Муҳаррик': 'Электрикӣ (EV)',
      'Ранг': 'Сиёҳи бриллиант'
    },
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    installmentAvailable: true,
  },
  {
    id: 'ad-12',
    title: 'Apple iPhone 16 Pro Max 256GB Desert Titanium (Нав)',
    description: 'iPhone 16 Pro Max, нав дар қуттӣ бо кафолати 1-солаи расмӣ. Регистрацияи сим-корт шудааст (бо чеки расмӣ). Камераи 48MP бо Camera Control, протсессори A18 Pro. Савдо ва насия бо Алиф Салом мувофиқ аст.',
    price: 14200,
    isNegotiable: true,
    category: 'electronics',
    city: 'dushanbe',
    district: 'Сино',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      '/images/ad_iphone_15_pro_1792056804198.jpg',
    ],
    phone: '+992 90 999 1122',
    sellerName: 'iStore Tajikistan',
    sellerJoined: '2023',
    createdAt: '2026-10-23T08:00:00Z',
    views: 1850,
    condition: 'new',
    featured: true,
    isVip: true,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 5.0,
    installmentAvailable: true,
    allowsBarter: true,
    barterNote: 'Иваз танҳо бо iPhone 15 Pro Max бо иловаи маблағ',
    specs: {
      'Хотира': '256 GB',
      'Ранг': 'Desert Titanium',
      'Модел': 'iPhone 16 Pro Max',
      'Кафолат': '1 сол'
    }
  },
  {
    id: 'ad-13',
    title: 'Hyundai Elantra 1.6 (2023) Корея тоза, бензин',
    description: 'Мошин бе ягон садама, ранг нахӯрдааст (родной краска). Салони сиёҳ, дистроник, круиз-контрол, CarPlay ва климат-контрол. Ҳуҷҷатҳо пурра бо утилизатсия.',
    price: 168000,
    isNegotiable: true,
    category: 'auto',
    city: 'dushanbe',
    district: 'Исмоили Сомонӣ',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      '/images/ad_toyota_camry_1792056773231.jpg',
    ],
    phone: '+992 98 888 4400',
    sellerName: 'Муҳаммадҷон',
    sellerJoined: '2023',
    createdAt: '2026-10-22T14:30:00Z',
    views: 740,
    condition: 'used',
    featured: true,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 4.8,
    installmentAvailable: true,
    allowsBarter: true,
    barterNote: 'Иваз бо хонаи навсохт дар Душанбе',
    specs: {
      'Сол': '2023',
      'Муҳаррик': '1.6 л бензин',
      'Пробег': '26 000 км',
      'Истеҳсол': 'Кореяи Ҷанубӣ'
    }
  },
  {
    id: 'ad-14',
    title: 'Хонаи 2-ҳуҷрагӣ навсохт 68 м² дар 82 мкрн',
    description: 'Бинои замонавии 16-ошёна, хона дар ошёнаи 7-ум. Таъмири сифатноки неоклассикӣ, гармидиҳии марказӣ, тирезаҳои пластикӣ бо панорама. Ҳамаи мебел ва техника боқӣ мемонад.',
    price: 435000,
    isNegotiable: true,
    category: 'real-estate',
    city: 'dushanbe',
    district: 'Сино',
    images: [
      '/images/ad_dushanbe_apartment_1792056839832.jpg',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 90 333 7711',
    sellerName: 'Агентии Амволи Пойтахт',
    sellerJoined: '2022',
    createdAt: '2026-10-23T06:15:00Z',
    views: 1120,
    condition: 'new',
    featured: true,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    specs: {
      'Майдон': '68 м²',
      'Ошёна': '7 аз 16',
      'Ҳуҷраҳо': '2',
      'Техпаспорт': 'Тайёр'
    }
  },
  {
    id: 'ad-15',
    title: 'Apple MacBook Air 13 M3 16GB / 512GB Midnight',
    description: 'Ноутбуки пуриқтидор ва сабук бо протсессори M3. Хотираи фаврӣ 16GB, SSD 512GB. Батарея то 18 соат нигоҳ медорад. Барои барномасозӣ, дизайн ва таҳсил беҳтарин интихоб аст.',
    price: 13200,
    isNegotiable: true,
    category: 'electronics',
    city: 'khujand',
    district: 'Марказ',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 92 770 0055',
    sellerName: 'Далер Умаров',
    sellerJoined: '2024',
    createdAt: '2026-10-22T19:00:00Z',
    views: 480,
    condition: 'new',
    featured: false,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    installmentAvailable: true,
    specs: {
      'Чип': 'Apple M3 8-Core',
      'Хотира': '16 GB RAM',
      'Диск': '512 GB SSD',
      'Экран': '13.6 Liquid Retina'
    }
  },
  {
    id: 'ad-16',
    title: 'Sony PlayStation 5 Slim 1TB + 2 Ҷойстик ва бозиҳо',
    description: 'PS5 Slim дар ҳолати идеалӣ, кам истифода шудааст. 2 дона джойстик DualSense, бозиҳои FC 25 ва Mortal Kombat 1 сабт шудаанд. Қуттӣ ва кабелҳо комиланд.',
    price: 5600,
    isNegotiable: true,
    category: 'electronics',
    city: 'dushanbe',
    district: 'Фирдавсӣ',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 91 555 3388',
    sellerName: 'Беҳрӯз',
    sellerJoined: '2024',
    createdAt: '2026-10-23T04:00:00Z',
    views: 610,
    condition: 'used',
    featured: false,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 4.7,
    specs: {
      'Модел': 'PS5 Slim 1TB',
      'Ҷойстикҳо': '2x DualSense',
      'Ҳолат': '10/10'
    }
  },
  {
    id: 'ad-17',
    title: 'Kia K5 GT-Line 1.6 Turbo (2022) Беҳтарин ҳолат',
    description: 'Kia K5 GT-Line, ранги сафеди марворид. Панорама, системаи аудиоии Bose, муҳаррики турбо пурқувват ва сарфакор (6.8 л дар 100 км). Мошин баҳогузорӣ шудааст ва савдо дорад.',
    price: 195000,
    isNegotiable: true,
    category: 'auto',
    city: 'dushanbe',
    district: 'Шоҳмансур',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
      '/images/ad_toyota_camry_1792056773231.jpg',
    ],
    phone: '+992 90 000 5588',
    sellerName: 'Саидҷаъфар',
    sellerJoined: '2023',
    createdAt: '2026-10-21T18:20:00Z',
    views: 990,
    condition: 'used',
    featured: true,
    isVip: true,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 5.0,
    installmentAvailable: true,
    allowsBarter: true,
    barterNote: 'Иваз бо мошини арзонтар бо иловаи пул',
    specs: {
      'Сол': '2022',
      'Комплектатсия': 'GT-Line Turbo',
      'Пробег': '38 000 км'
    }
  },
  {
    id: 'ad-18',
    title: 'Ҳавлии замонавӣ 6 сотих дар Чорбоғ бо ҳавз ва боғ',
    description: 'Ҳавлии боҳашамати 2-ошёна бо ҳавои тозаи кӯҳистон дар даромадгоҳи Варзоб. 5 хонаи калон, сауна, ҳавзи шиноварӣ (бассейн), манқал ва дарахтони мевадиҳанда. Ҳамаи ҳуҷҷатҳо ба номи соҳибмулк.',
    price: 920000,
    isNegotiable: true,
    category: 'real-estate',
    city: 'dushanbe',
    district: 'Исмоили Сомонӣ',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      '/images/ad_dushanbe_apartment_1792056839832.jpg',
    ],
    phone: '+992 93 444 8822',
    sellerName: 'Рустам Ғафуров',
    sellerJoined: '2022',
    createdAt: '2026-10-20T11:45:00Z',
    views: 2150,
    condition: 'new',
    featured: true,
    isVip: true,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    specs: {
      'Замин': '6 сотих',
      'Ошёна': '2 ошёна',
      'Ҳуҷраҳо': '5 ҳуҷра + айвон',
      'Ҳавз': 'Ҳаст'
    }
  },
  {
    id: 'ad-19',
    title: 'Устои касбии сантехник ва барқкор дар ш. Душанбе',
    description: 'Таъмир ва насби ҳама гуна қубурҳо, насосҳо, бойлерҳо, гармидиҳии фарш (теплый пол) ва ноқилҳои барқӣ. Кафолати сифати кор ва омадан дар давоми 30 дақиқа ба ҳамаи ноҳияҳои Душанбе.',
    price: 150,
    isNegotiable: true,
    category: 'services',
    city: 'dushanbe',
    district: 'Сино',
    images: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 98 123 7890',
    sellerName: 'Усто Азиз',
    sellerJoined: '2021',
    createdAt: '2026-10-23T07:10:00Z',
    views: 410,
    condition: 'new',
    featured: false,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 5.0,
    specs: {
      'Таҷриба': '12 сол',
      'Омадан': 'Бепул барои муоина',
      'Кафолат': '1 сол'
    }
  },
  {
    id: 'ad-20',
    title: 'Кондиционери инвертории Gree Fairy 18000 BTU',
    description: 'Кондиционери касбӣ барои тобистони гарм ва зимистони сард (кор то -20 дараҷа). То 55 кв.м фазоро зуд сард ва гарм мекунад. Сарфаи баланди барқ A+++.',
    price: 4900,
    isNegotiable: true,
    category: 'home-garden',
    city: 'khujand',
    district: 'Панҷшанбе',
    images: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      '/images/somon_heater_appliance_1792065954779.jpg',
    ],
    phone: '+992 92 654 3210',
    sellerName: 'Климат Согд',
    sellerJoined: '2023',
    createdAt: '2026-10-22T10:00:00Z',
    views: 520,
    condition: 'new',
    featured: false,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 4.8,
    installmentAvailable: true,
    specs: {
      'Иқтидор': '18 000 BTU',
      'Масоҳат': 'То 55 м²',
      'Синфи сарфа': 'A+++'
    }
  },
  {
    id: 'ad-21',
    title: 'Хонаи 1-ҳуҷрагӣ ба иҷора (Аренда) маркази Душанбе',
    description: 'Барои оила ё шахсони корманд ба иҷора дода мешавад. Дар назди Боғи Рӯдакӣ. Таъмири нав, кондитсионер, мошини либосшӯӣ, яхдон ва интернети баландсуръат. Ба муддати тӯлонӣ.',
    price: 3600,
    isNegotiable: false,
    category: 'real-estate',
    city: 'dushanbe',
    district: 'Шоҳмансур',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      '/images/ad_dushanbe_apartment_1792056839832.jpg',
    ],
    phone: '+992 90 771 2244',
    sellerName: 'Замира',
    sellerJoined: '2024',
    createdAt: '2026-10-23T05:30:00Z',
    views: 890,
    condition: 'new',
    featured: false,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    specs: {
      'Ҳуҷра': '1',
      'Ошёна': '5 аз 12',
      'Мӯҳлат': 'Аз 3 моҳ боло'
    }
  },
  {
    id: 'ad-22',
    title: 'Барномасози Веб ва Сомона (Frontend React & Fullstack)',
    description: 'Сохтани сомонаҳои тиҷоратӣ, мағозаҳои интернетӣ, ботҳои Telegram ва барномаҳои мобилӣ барои корхонаҳо ва тиҷоратҳои Тоҷикистон бо пардохти Корти Миллӣ ва Alif Pay.',
    price: 3500,
    isNegotiable: true,
    category: 'services',
    city: 'dushanbe',
    district: 'Исмоили Сомонӣ',
    images: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 91 888 7700',
    sellerName: 'DevSolutions TJ',
    sellerJoined: '2023',
    createdAt: '2026-10-21T12:00:00Z',
    views: 670,
    condition: 'new',
    featured: false,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 5.0,
    specs: {
      'Технологияҳо': 'React, Node.js, Next.js',
      'Мӯҳлат': 'Аз 7 рӯз',
      'Дастгирӣ': 'Бепул барои 1 моҳ'
    }
  },
  {
    id: 'ad-23',
    title: 'Daewoo Labo (2020) Барои тиҷорат ва боркашонӣ',
    description: 'Лабо дар ҳолати аълои техникӣ. Гази насбшуда, борбардорӣ то 800 кг, чархҳои нав, мотор бе ягон садо. Ҳуҷҷатҳои яксола бо патент ва утилизатсия.',
    price: 59000,
    isNegotiable: true,
    category: 'auto',
    city: 'istaravshan',
    district: '',
    images: [
      'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80',
      '/images/ad_toyota_camry_1792056773231.jpg',
    ],
    phone: '+992 92 333 4455',
    sellerName: 'Ҳоҷи Маҳмуд',
    sellerJoined: '2023',
    createdAt: '2026-10-22T09:15:00Z',
    views: 430,
    condition: 'used',
    featured: false,
    dealRating: 'super_deal',
    isVerifiedSeller: true,
    sellerRating: 4.8,
    specs: {
      'Сол': '2020',
      'Сӯзишворӣ': 'Газ',
      'Борбардорӣ': '800 кг'
    }
  },
  {
    id: 'ad-24',
    title: 'Қӯчқори асили зоти Ҳисорӣ (Калон ва фарбеҳ)',
    description: 'Қӯчқори асил аз чарогоҳҳои баландкӯҳ, вазни зинда тақрибан 110 кг. Барои маърака, туҳфа ё парвариш беҳтарин интихоб аст. Саломатӣ 100%, бо эмкуниҳои байторӣ.',
    price: 4200,
    isNegotiable: true,
    category: 'animals',
    city: 'hisor',
    district: '',
    images: [
      'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80',
    ],
    phone: '+992 90 222 6677',
    sellerName: 'Нусратулло',
    sellerJoined: '2024',
    createdAt: '2026-10-23T06:00:00Z',
    views: 310,
    condition: 'new',
    featured: false,
    dealRating: 'fair_price',
    isVerifiedSeller: true,
    sellerRating: 4.9,
    specs: {
      'Зот': 'Ҳисории асил',
      'Вазн': '~110 кг',
      'Синн': '2 сола'
    }
  }
];

export const INITIAL_ADS: ProductAd[] = INITIAL_ADS_DATA.map((ad) => ({
  ...ad,
  isSample: true,
  status: ad.status || 'active',
}));

export const STORAGE_KEY = 'arzontj_advertisements_2026_v9';
export const FAVORITES_KEY = 'arzontj_favorites_v1';

export function getStoredAds(): ProductAd[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let candidateList: ProductAd[] = [];

    if (raw) {
      try {
        candidateList = JSON.parse(raw);
      } catch {
        candidateList = [];
      }
    } else {
      // Check legacy storage keys to preserve user-created ads
      const legacyRaw =
        localStorage.getItem('arzontj_advertisements_v7') ||
        localStorage.getItem('arzontj_advertisements_v6') ||
        localStorage.getItem('arzontj_advertisements_v5') ||
        localStorage.getItem('arzontj_advertisements_v4') ||
        localStorage.getItem('arzontj_advertisements');
      if (legacyRaw) {
        try {
          candidateList = JSON.parse(legacyRaw);
        } catch {
          candidateList = [];
        }
      }
    }

    const initialMap = new Map(INITIAL_ADS.map((ad) => [ad.id, ad]));
    const userCustomAds: ProductAd[] = [];

    if (Array.isArray(candidateList)) {
      for (const item of candidateList) {
        if (!item || !item.id) continue;
        if (!initialMap.has(item.id)) {
          userCustomAds.push({
            ...item,
            images:
              Array.isArray(item.images) && item.images.length > 0
                ? item.images.map((img) => resolveImageUrl(img))
                : ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'],
          });
        }
      }
    }

    // Always guarantee all 24 fresh INITIAL_ADS are included + user created ads at the top!
    const guaranteed24Ads = [...userCustomAds, ...INITIAL_ADS];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guaranteed24Ads));
    return guaranteed24Ads;
  } catch {
    return INITIAL_ADS;
  }
}

export function saveStoredAds(ads: ProductAd[]) {
  try {
    const sanitized = ads.map((ad) => ({
      ...ad,
      images: Array.isArray(ad.images) && ad.images.length > 0
        ? ad.images.map((img) => resolveImageUrl(img))
        : ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'],
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save ads to localStorage', e);
  }
}

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteInStorage(id: string): string[] {
  try {
    const favs = getFavorites();
    const updated = favs.includes(id) ? favs.filter(item => item !== id) : [...favs, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Persists an ad to Supabase database if configured
 */
export async function saveAdToSupabase(ad: ProductAd): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('ads').upsert({
      id: ad.id,
      title: ad.title,
      description: ad.description || '',
      price: ad.price,
      is_negotiable: ad.isNegotiable,
      category: ad.category,
      city: ad.city,
      district: ad.district || '',
      images: ad.images || [],
      phone: ad.phone,
      seller_id: ad.sellerId || (ad.phone ? `user-${ad.phone.replace(/\D/g, '')}` : `seller-${ad.id}`),
      seller_name: ad.sellerName,
      seller_joined: ad.sellerJoined || '2026',
      views: ad.views || 1,
      condition: ad.condition || 'used',
      featured: Boolean(ad.featured),
      is_vip: Boolean(ad.isVip),
      is_urgent: Boolean(ad.isUrgent),
      is_highlighted: Boolean(ad.isHighlighted),
      promoted_until: ad.promotedUntil || null,
      specs: ad.specs || {},
      created_at: ad.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to upsert ad to Supabase:', err);
  }
}

/**
 * Removes an ad from Supabase database
 */
export async function deleteAdFromSupabase(adId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('ads').delete().eq('id', adId);
  } catch (err) {
    console.warn('Failed to delete ad from Supabase:', err);
  }
}

/**
 * Loads and synchronizes ads from Supabase database
 */
export async function syncAdsFromSupabase(): Promise<ProductAd[]> {
  const supabase = getSupabase();
  if (!supabase) return getStoredAds();

  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error && !error.message?.includes('schema cache') && error.code !== 'PGRST205') {
        console.warn('Could not fetch ads from Supabase:', error);
      }
      return getStoredAds();
    }

    if (data.length === 0) {
      return getStoredAds();
    }

    const remoteAds: ProductAd[] = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: Number(item.price),
      isNegotiable: Boolean(item.is_negotiable),
      category: item.category,
      city: item.city,
      district: item.district || undefined,
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : ['/images/ad_toyota_camry_1792056773231.jpg'],
      phone: item.phone,
      sellerId: item.seller_id,
      sellerName: item.seller_name,
      sellerJoined: item.seller_joined || '2026',
      createdAt: item.created_at,
      views: item.views || 1,
      condition: item.condition === 'new' ? 'new' : 'used',
      featured: Boolean(item.featured),
      isVip: Boolean(item.is_vip),
      isUrgent: Boolean(item.is_urgent),
      isHighlighted: Boolean(item.is_highlighted),
      promotedUntil: item.promoted_until || undefined,
      specs: item.specs || {},
    }));

    const local = getStoredAds();
    const merged: ProductAd[] = [...remoteAds];
    for (const l of local) {
      if (!merged.some((m) => m.id === l.id)) {
        merged.push(l);
      }
    }

    saveStoredAds(merged);
    return merged;
  } catch (err) {
    console.error('Error syncing ads from Supabase:', err);
    return getStoredAds();
  }
}
