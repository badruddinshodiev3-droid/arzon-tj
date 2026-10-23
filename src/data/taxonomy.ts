import { CityItem, CategoryItem } from '../types';

export const CITIES: CityItem[] = [
  {
    id: 'dushanbe',
    name: { tg: 'Душанбе', ru: 'Душанбе', en: 'Dushanbe' },
    region: { tg: 'Шаҳри Душанбе', ru: 'г. Душанбе', en: 'Dushanbe City' },
    districts: [
      { tg: 'Исмоили Сомонӣ', ru: 'Исмоили Сомони', en: 'Ismoili Somoni' },
      { tg: 'Сино', ru: 'Сино', en: 'Sino' },
      { tg: 'Фирдавсӣ', ru: 'Фирдавси', en: 'Firdavsi' },
      { tg: 'Шоҳмансур', ru: 'Шохмансур', en: 'Shohmansur' },
    ]
  },
  {
    id: 'khujand',
    name: { tg: 'Хуҷанд', ru: 'Худжанд', en: 'Khujand' },
    region: { tg: 'Вилояти Суғд', ru: 'Согдийская область', en: 'Sughd Region' },
    districts: [
      { tg: 'Марказ', ru: 'Центр', en: 'Center' },
      { tg: 'Панҷшанбе', ru: 'Панчшанбе', en: 'Panjshanbe' },
      { tg: 'Маҳаллаи 19', ru: '19-й микрорайон', en: '19th Microdistrict' }
    ]
  },
  {
    id: 'bokhtar',
    name: { tg: 'Бохтар', ru: 'Бохтар (Курган-Тюбе)', en: 'Bokhtar' },
    region: { tg: 'Вилояти Хатлон', ru: 'Хатлонская область', en: 'Khatlon Region' },
  },
  {
    id: 'kulob',
    name: { tg: 'Кӯлоб', ru: 'Куляб', en: 'Kulob' },
    region: { tg: 'Вилояти Хатлон', ru: 'Хатлонская область', en: 'Khatlon Region' },
  },
  {
    id: 'istaravshan',
    name: { tg: 'Истаравшан', ru: 'Истаравшан', en: 'Istaravshan' },
    region: { tg: 'Вилояти Суғд', ru: 'Согдийская область', en: 'Sughd Region' },
  },
  {
    id: 'isfara',
    name: { tg: 'Исфара', ru: 'Исфара', en: 'Isfara' },
    region: { tg: 'Вилояти Суғд', ru: 'Согдийская область', en: 'Sughd Region' },
  },
  {
    id: 'panjakent',
    name: { tg: 'Панҷакент', ru: 'Пенджикент', en: 'Panjakent' },
    region: { tg: 'Вилояти Суғд', ru: 'Согдийская область', en: 'Sughd Region' },
  },
  {
    id: 'tursunzoda',
    name: { tg: 'Турсунзода', ru: 'Турсунзаде', en: 'Tursunzoda' },
    region: { tg: 'Ноҳияҳои тобеи ҷумҳурӣ', ru: 'РРП', en: 'Districts of Rep. Subordination' },
  },
  {
    id: 'vahdat',
    name: { tg: 'Ваҳдат', ru: 'Вахдат', en: 'Vahdat' },
    region: { tg: 'Ноҳияҳои тобеи ҷумҳурӣ', ru: 'РРП', en: 'Districts of Rep. Subordination' },
  },
  {
    id: 'hisor',
    name: { tg: 'Ҳисор', ru: 'Гиссар', en: 'Hisor' },
    region: { tg: 'Ноҳияҳои тобеи ҷумҳурӣ', ru: 'РРП', en: 'Districts of Rep. Subordination' },
  },
  {
    id: 'khorog',
    name: { tg: 'Хоруғ', ru: 'Хорог', en: 'Khorog' },
    region: { tg: 'ВМКБ', ru: 'ГБАО', en: 'GBAO' },
  },
  {
    id: 'konibodom',
    name: { tg: 'Конибодом', ru: 'Канибадам', en: 'Konibodom' },
    region: { tg: 'Вилояти Суғд', ru: 'Согдийская область', en: 'Sughd Region' },
  }
];

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'auto',
    name: { tg: 'Мошинҳо ва нақлиёт', ru: 'Авто и транспорт', en: 'Vehicles & Transport' },
    icon: 'Car',
    count: 1420
  },
  {
    id: 'real-estate',
    name: { tg: 'Амволи ғайриманқул', ru: 'Недвижимость', en: 'Real Estate' },
    icon: 'Home',
    count: 890
  },
  {
    id: 'electronics',
    name: { tg: 'Телефон ва электроника', ru: 'Телефоны и электроника', en: 'Phones & Electronics' },
    icon: 'Smartphone',
    count: 2310
  },
  {
    id: 'home-garden',
    name: { tg: 'Хона ва боғ', ru: 'Для дома и дачи', en: 'Home & Garden' },
    icon: 'Armchair',
    count: 670
  },
  {
    id: 'fashion',
    name: { tg: 'Либос ва пойафзол', ru: 'Одежда и обувь', en: 'Fashion & Clothing' },
    icon: 'Shirt',
    count: 1150
  },
  {
    id: 'crafts',
    name: { tg: 'Ҳунармандӣ ва суннатӣ', ru: 'Ремесла и традиции', en: 'Crafts & Heritage' },
    icon: 'Sparkles',
    count: 340
  },
  {
    id: 'services',
    name: { tg: 'Хизматрасонӣ ва кор', ru: 'Услуги и работа', en: 'Jobs & Services' },
    icon: 'Briefcase',
    count: 520
  },
  {
    id: 'animals',
    name: { tg: 'Ҳайвонот ва чорво', ru: 'Животные', en: 'Animals & Livestock' },
    icon: 'PawPrint',
    count: 280
  }
];
