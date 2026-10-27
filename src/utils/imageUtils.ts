/**
 * Image resolution, fallback handling, and compression utilities for Arzon.tj
 * Handles standard image normalization, Android camera photo compression,
 * HTTPS upgrading for remote images, and Android WebView compatibility.
 */

// Universal high-fidelity category-tailored vector SVG fallbacks
// These require zero network, zero filesystem access, and NEVER fail in any Android WebView or TWA.
export const SVG_FALLBACK_AUTO =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="none">` +
      `<rect width="600" height="450" fill="#0f172a"/>` +
      `<circle cx="300" cy="200" r="140" fill="#059669" opacity="0.15"/>` +
      `<path d="M150 250 L200 170 L400 170 L460 250 L480 270 C480 280 470 290 460 290 L440 290 C435 270 415 255 390 255 C365 255 345 270 340 290 L260 290 C255 270 235 255 210 255 C185 255 165 270 160 290 L140 290 C130 290 120 280 120 270 Z" fill="#10b981"/>` +
      `<circle cx="210" cy="290" r="28" fill="#334155" stroke="#f8fafc" stroke-width="6"/>` +
      `<circle cx="390" cy="290" r="28" fill="#334155" stroke="#f8fafc" stroke-width="6"/>` +
      `<polygon points="215,185 270,185 265,235 175,235" fill="#e2e8f0" opacity="0.9"/>` +
      `<polygon points="285,185 385,185 435,235 285,235" fill="#e2e8f0" opacity="0.9"/>` +
      `<text x="300" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#34d399" text-anchor="middle">Arzon.tj · Мошинҳо / Авто</text>` +
      `<text x="300" y="388" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">Toyota, Mercedes, BYD, Hyundai</text>` +
    `</svg>`
  );

export const SVG_FALLBACK_ELECTRONICS =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="none">` +
      `<rect width="600" height="450" fill="#0f172a"/>` +
      `<circle cx="300" cy="190" r="130" fill="#059669" opacity="0.18"/>` +
      `<rect x="230" y="100" width="140" height="230" rx="24" fill="#1e293b" stroke="#34d399" stroke-width="5"/>` +
      `<rect x="245" y="125" width="110" height="175" rx="8" fill="#0f172a"/>` +
      `<circle cx="300" cy="115" r="5" fill="#475569"/>` +
      `<circle cx="300" cy="315" r="7" fill="#34d399"/>` +
      `<text x="300" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#34d399" text-anchor="middle">Arzon.tj · Телефон ва техника</text>` +
      `<text x="300" y="402" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">Apple iPhone, Samsung, Ноутбукҳо</text>` +
    `</svg>`
  );

export const SVG_FALLBACK_REAL_ESTATE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="none">` +
      `<rect width="600" height="450" fill="#0f172a"/>` +
      `<polygon points="300,90 170,190 430,190" fill="#10b981"/>` +
      `<rect x="200" y="190" width="200" height="150" fill="#1e293b" stroke="#34d399" stroke-width="4"/>` +
      `<rect x="230" y="215" width="40" height="45" rx="4" fill="#38bdf8"/>` +
      `<rect x="330" y="215" width="40" height="45" rx="4" fill="#38bdf8"/>` +
      `<rect x="275" y="275" width="50" height="65" rx="4" fill="#047857"/>` +
      `<text x="300" y="385" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#34d399" text-anchor="middle">Arzon.tj · Хонаҳо ва манзил</text>` +
      `<text x="300" y="412" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">Душанбе, Хуҷанд, Бохтар</text>` +
    `</svg>`
  );

export const SVG_FALLBACK_HOME =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="none">` +
      `<rect width="600" height="450" fill="#0f172a"/>` +
      `<rect x="180" y="140" width="240" height="160" rx="16" fill="#1e293b" stroke="#34d399" stroke-width="4"/>` +
      `<path d="M200 160 L400 160 L380 280 L220 280 Z" fill="#065f46" stroke="#34d399" stroke-dasharray="6,4"/>` +
      `<circle cx="300" cy="220" r="30" fill="#fbbf24"/>` +
      `<text x="300" y="350" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#34d399" text-anchor="middle">Arzon.tj · Хонаву боғ ва мебел</text>` +
      `<text x="300" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">Қолинҳо, гармкунакҳо, таҷҳизот</text>` +
    `</svg>`
  );

export const SVG_FALLBACK_DEFAULT =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="none">` +
      `<rect width="600" height="450" fill="#0f172a"/>` +
      `<rect x="230" y="145" width="140" height="110" rx="18" fill="#1e293b" stroke="#10b981" stroke-width="4"/>` +
      `<circle cx="275" cy="185" r="16" fill="#34d399" opacity="0.9"/>` +
      `<path d="M245 235l30-28 25 25 35-35 30 38h-120z" fill="#059669"/>` +
      `<text x="300" y="310" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#10b981" text-anchor="middle">Arzon.tj</text>` +
      `<text x="300" y="338" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">Бозори миллии Тоҷикистон</text>` +
    `</svg>`
  );

export const FALLBACK_SVG_DATA_URL = SVG_FALLBACK_DEFAULT;
export const FALLBACK_IMAGE = SVG_FALLBACK_DEFAULT;
export const FALLBACK_LOCAL_IMAGE = '/images/ad_toyota_camry_1792056773231.jpg';

/**
 * Returns a category-specific guaranteed vector SVG data URI.
 */
export function getCategoryFallbackSvg(category?: string): string {
  if (!category) return SVG_FALLBACK_DEFAULT;
  const c = category.toLowerCase();
  if (c.includes('auto') || c.includes('car') || c.includes('мошин')) {
    return SVG_FALLBACK_AUTO;
  }
  if (c.includes('electr') || c.includes('phone') || c.includes('телефон')) {
    return SVG_FALLBACK_ELECTRONICS;
  }
  if (c.includes('estate') || c.includes('real') || c.includes('хона') || c.includes('манзил') || c.includes('apart')) {
    return SVG_FALLBACK_REAL_ESTATE;
  }
  if (c.includes('home') || c.includes('garden') || c.includes('мебел') || c.includes('боғ')) {
    return SVG_FALLBACK_HOME;
  }
  return SVG_FALLBACK_DEFAULT;
}

/**
 * Resolves image paths across Vite dev, web preview, production, and Android Capacitor builds.
 * 1. Preserves data: and blob: URLs from user camera uploads.
 * 2. Guarantees remote URLs use secure HTTPS addresses to avoid Android cleartext / mixed-content blocks.
 * 3. Normalizes legacy repository paths (/src/assets/images/, /public/images/ -> /images/).
 * 4. Supports both Capacitor WebView HTTPS scheme and file: protocol on Android.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return SVG_FALLBACK_DEFAULT;
  }

  let clean = url.trim();

  // 1. Data URLs and Blob URLs (user uploaded photos or inline SVG fallbacks)
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // 2. Protocol-relative URLs (e.g. //images.unsplash.com/...) -> Upgrade to HTTPS
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  }

  // 3. Insecure HTTP URLs -> Upgrade to HTTPS for Android WebView security
  if (clean.startsWith('http://')) {
    clean = 'https://' + clean.slice(7);
  }

  // 4. Remote HTTPS URLs
  if (clean.startsWith('https://')) {
    return clean;
  }

  // 5. Normalize legacy repository paths
  if (clean.startsWith('/src/assets/images/')) {
    clean = clean.replace('/src/assets/images/', '/images/');
  } else if (clean.startsWith('src/assets/images/')) {
    clean = clean.replace('src/assets/images/', '/images/');
  } else if (clean.startsWith('/public/images/')) {
    clean = clean.replace('/public/images/', '/images/');
  } else if (clean.startsWith('public/images/')) {
    clean = clean.replace('public/images/', '/images/');
  }

  // Strip leading dot-slash if present to avoid relative resolution duplication
  if (clean.startsWith('./')) {
    clean = clean.slice(2);
  }

  // 6. Ensure leading slash for web/https schemes, or relative path for file: protocol
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    if (clean.startsWith('/')) {
      return '.' + clean;
    }
    return './' + clean;
  }

  // Normal local web path: ensure single leading slash
  if (!clean.startsWith('/')) {
    return '/' + clean;
  }

  return clean;
}

/**
 * Gracefully handles image load errors in the Android APK and web.
 * Prevents infinite error loops:
 * 1. If custom fallback is provided and untried, tries it.
 * 2. If image fails, immediately falls back to category-tailored vector SVG data URI that never fails.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  categoryOrFallback?: string
): void {
  const img = event.currentTarget;
  if (!img) return;

  const currentSrc = img.getAttribute('src') || img.src || '';

  // Terminate immediately if already on an SVG or resolved
  if (currentSrc.startsWith('data:image/svg+xml') || img.dataset.errorResolved === 'true') {
    return;
  }

  const tries = Number(img.dataset.failTries || 0);

  // Stage 1: If a custom fallback image is provided (not SVG) and not yet tried
  if (
    tries === 0 &&
    categoryOrFallback &&
    !categoryOrFallback.startsWith('data:image/svg') &&
    categoryOrFallback.includes('/')
  ) {
    img.dataset.failTries = '1';
    img.src = resolveImageUrl(categoryOrFallback);
    return;
  }

  // Stage 2: Guaranteed inline vector SVG data URI matching category
  img.dataset.failTries = '2';
  img.dataset.errorResolved = 'true';
  img.src = getCategoryFallbackSvg(categoryOrFallback);
}

/**
 * Compresses and reads an uploaded image file on Android/mobile.
 * Resizes large camera photos (often 10-15MB from modern Android cameras)
 * down to max 1280px maintaining aspect ratio, and exports high-quality JPEG (quality 0.82).
 * This ensures lightning-fast preview rendering, zero lag, and prevents localStorage quota crashes.
 */
export function compressAndReadImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    // If not a standard image, fallback to raw read
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || SVG_FALLBACK_DEFAULT);
      reader.onerror = () => resolve(SVG_FALLBACK_DEFAULT);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        resolve(SVG_FALLBACK_DEFAULT);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve(SVG_FALLBACK_DEFAULT);
    reader.readAsDataURL(file);
  });
}
