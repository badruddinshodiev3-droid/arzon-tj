import { ProductAd, Language } from '../types';
import { CITIES, CATEGORIES } from '../data/taxonomy';

/**
 * Normalizes text for forgiving Tajik/Russian/English search:
 * - Converts to lower case
 * - Maps accented Tajik Cyrillic characters (ӣ, ӯ, ҳ, ҷ, қ, ғ) to base Cyrillic equivalents (и, у, х, ч, к, г)
 * - Maps ё -> е
 * - Removes non-alphanumeric punctuation
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[ӣий]/g, 'и')
    .replace(/[ӯу]/g, 'у')
    .replace(/[ҳх]/g, 'х')
    .replace(/[ҷч]/g, 'ч')
    .replace(/[қк]/g, 'к')
    .replace(/[ғг]/g, 'г')
    .replace(/[ёе]/g, 'е')
    .replace(/[ъь]/g, '')
    .replace(/[^a-z0-9а-я]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Popular search suggestions commonly searched on Somon.tj
 */
export const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'Toyota Camry', query: 'toyota camry' },
  { label: 'iPhone 15 Pro', query: 'iphone' },
  { label: 'Хона дар Душанбе', query: 'хона душанбе' },
  { label: 'Samsung Galaxy', query: 'samsung' },
  { label: 'BYD Song EV', query: 'byd' },
  { label: 'Обогреватель / Радиатор', query: 'гармкунак' },
  { label: 'Hyundai Sonata', query: 'sonata' },
  { label: 'Диван / Мебел', query: 'диван' },
];

/**
 * Common bilingual synonym mappings for classifieds
 */
interface SynonymGroup {
  aliases: string[];
  expandedTokens: string[];
}

const SYNONYM_GROUPS: SynonymGroup[] = [
  // Cars / Vehicles
  {
    aliases: ['мошин', 'мошинхо', 'мошинҳо', 'машина', 'машины', 'авто', 'автомобиль', 'автомобили', 'автотранспорт', 'car', 'cars'],
    expandedTokens: ['auto', 'мошин', 'машина', 'автомобиль', 'toyota', 'hyundai', 'byd', 'camry', 'sonata', 'седан'],
  },
  // Apple / iPhone
  {
    aliases: ['айфон', 'айфоны', 'айфонхо', 'айфонҳо', 'iphone', 'apple', 'эппл'],
    expandedTokens: ['iphone', 'apple', 'айфон', '15 pro'],
  },
  // Samsung
  {
    aliases: ['самсунг', 'самсунги', 'самсунгҳо', 'samsung', 'galaxy', 'галакси'],
    expandedTokens: ['samsung', 'galaxy', 'самсунг', 's24'],
  },
  // Phones & Electronics
  {
    aliases: ['телефон', 'телефонхо', 'телефонҳо', 'смартфон', 'смартфоны', 'сотовый', 'мобильник', 'электроника', 'гаджет'],
    expandedTokens: ['electronics', 'телефон', 'смартфон', 'iphone', 'samsung'],
  },
  // Real Estate / Apartments
  {
    aliases: ['хона', 'хонахо', 'хонаҳо', 'квартира', 'квартиры', 'дом', 'новостройка', 'новостройки', 'амвол', 'недвижимость', 'манзил', 'бино'],
    expandedTokens: ['real-estate', 'хона', 'квартира', 'амвол', 'недвижимость', 'душанбе'],
  },
  // Heating / Heaters
  {
    aliases: ['гармкунак', 'гармкунанда', 'гармидихи', 'гармидиҳӣ', 'обогреватель', 'обогреватели', 'радиатор', 'печка', 'тепловентилятор', 'отопление'],
    expandedTokens: ['гармкунак', 'обогреватель', 'радиатор', 'печка', 'тепловентилятор', 'raf', 'керамика'],
  },
  // Furniture
  {
    aliases: ['диван', 'диванхо', 'диванҳо', 'мебел', 'мебель', 'раҳт'],
    expandedTokens: ['диван', 'мебел', 'мебель', 'home-garden'],
  },
  // Traditional Rugs / Carpets
  {
    aliases: ['қолин', 'колин', 'ковер', 'ковёр', 'палас', 'қолинбофӣ', 'carpet'],
    expandedTokens: ['қолин', 'колин', 'ковер', 'crafts', 'пашм'],
  },
  // Fashion / National Dresses
  {
    aliases: ['чакан', 'атлас', 'курта', 'либос', 'либосхо', 'либосҳо', 'одежда', 'платье'],
    expandedTokens: ['чакан', 'атлас', 'курта', 'либос', 'fashion'],
  },
  // Electric Cars
  {
    aliases: ['электромобил', 'электромобиль', 'электромобилҳо', 'электрокар', 'электрокары', 'ev'],
    expandedTokens: ['byd', 'электромобиль', 'электромобил', 'song plus', 'ev'],
  },
  // Dushanbe City
  {
    aliases: ['душанбе', 'dushanbe', 'ш душанбе', 'г душанбе'],
    expandedTokens: ['dushanbe', 'душанбе', 'сино', 'шоҳмансур', 'фирдавсӣ', 'сомонӣ'],
  },
  // Khujand City
  {
    aliases: ['хуҷанд', 'хучанд', 'худжан', 'khujand', 'ленинабад'],
    expandedTokens: ['khujand', 'хуҷанд', 'хучанд', 'панҷшанбе'],
  },
  // Bokhtar City
  {
    aliases: ['бохтар', 'bokhtar', 'кургантюбе', 'курган тюбе', 'қурғонтеппа', 'кургонтеппа'],
    expandedTokens: ['bokhtar', 'бохтар'],
  },
  // Kulob City
  {
    aliases: ['кӯлоб', 'кулоб', 'куляб', 'kulob'],
    expandedTokens: ['kulob', 'кӯлоб', 'кулоб'],
  },
];

/**
 * Builds a comprehensive normalized search index string for a product ad
 */
export function buildAdSearchCorpus(ad: ProductAd): string {
  const parts: string[] = [];

  // Title and Description
  parts.push(ad.title);
  parts.push(ad.description);

  // City info
  parts.push(ad.city);
  const cityObj = CITIES.find((c) => c.id === ad.city);
  if (cityObj) {
    parts.push(cityObj.name.tg, cityObj.name.ru, cityObj.name.en);
    parts.push(cityObj.region.tg, cityObj.region.ru, cityObj.region.en);
  }
  if (ad.district) {
    parts.push(ad.district);
  }

  // Category info
  parts.push(ad.category);
  const catObj = CATEGORIES.find((c) => c.id === ad.category);
  if (catObj) {
    parts.push(catObj.name.tg, catObj.name.ru, catObj.name.en);
  }

  // Seller info
  if (ad.sellerName) {
    parts.push(ad.sellerName);
  }

  // Specs keys and values (e.g., '2021', '256 GB', 'Автомат', '102 м²')
  if (ad.specs) {
    Object.entries(ad.specs).forEach(([k, v]) => {
      parts.push(k, String(v));
    });
  }

  // Condition words
  if (ad.condition === 'new') {
    parts.push('нав', 'новый', 'новое', 'new');
  } else {
    parts.push('истифодашуда', 'б/у', 'бу', 'used');
  }

  // If negotiable
  if (ad.isNegotiable) {
    parts.push('савдо', 'торг', 'муомила', 'negotiable');
  }

  // Inject known domain keywords based on category or content
  if (ad.category === 'auto') {
    parts.push('мошин', 'машина', 'автомобиль', 'нақлиёт', 'седан');
  } else if (ad.category === 'electronics') {
    parts.push('телефон', 'смартфон', 'сотовый', 'гаджет');
  } else if (ad.category === 'real-estate') {
    parts.push('хона', 'квартира', 'бино', 'манзил', 'дом', 'новостройка');
  } else if (ad.category === 'home-garden') {
    parts.push('хона', 'мебел', 'диван', 'гармкунак', 'радиатор', 'печка');
  }

  const rawCorpus = parts.join(' ');
  return normalizeSearchText(rawCorpus);
}

/**
 * Checks whether an ad matches a user's search query with tokenization,
 * normalization, and bilingual synonym expansion.
 */
export function matchesSearchQuery(ad: ProductAd, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const normalizedQuery = normalizeSearchText(trimmed);
  if (!normalizedQuery) return true;

  const corpus = buildAdSearchCorpus(ad);

  // Split query into individual words (e.g., "toyota 2021" -> ["toyota", "2021"])
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // Every token must match in the ad's corpus, or in synonym expansions
  return queryTokens.every((token) => {
    // 1. Direct substring match in normalized corpus
    if (corpus.includes(token)) {
      return true;
    }

    // 2. Check if this token matches any synonym group
    for (const group of SYNONYM_GROUPS) {
      const isAlias = group.aliases.some((alias) => {
        const normAlias = normalizeSearchText(alias);
        return normAlias === token || normAlias.includes(token) || token.includes(normAlias);
      });

      if (isAlias) {
        // Check if ANY expanded token is in the corpus
        const matchesAnyExpansion = group.expandedTokens.some((exp) => {
          const normExp = normalizeSearchText(exp);
          return corpus.includes(normExp);
        });
        if (matchesAnyExpansion) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Gets top search preview results for the live autocomplete dropdown
 */
export function getLiveSearchPreviews(ads: ProductAd[], query: string, limit: number = 5): ProductAd[] {
  if (!query.trim()) return [];
  return ads.filter((ad) => matchesSearchQuery(ad, query)).slice(0, limit);
}
