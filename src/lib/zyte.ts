/**
 * Zyte Web Scraping API Integration
 * 
 * Handles scraping competitor cigar retailers for price data.
 */

const ZYTE_API_KEY = process.env.ZYTE_API_KEY;
const ZYTE_API_URL = 'https://api.zyte.com/v1/extract';

// Competitor configuration
export const COMPETITORS = {
  famous: {
    code: 'famous',
    name: 'Famous Smoke Shop',
    baseUrl: 'https://www.famous-smoke.com',
    catalogUrl: 'https://www.famous-smoke.com/cigars',
    productUrlPattern: /famous-smoke\.com\/([^\/]+)-cigars/,
  },
  ci: {
    code: 'ci',
    name: 'Cigars International',
    baseUrl: 'https://www.cigarsinternational.com',
    catalogUrl: 'https://www.cigarsinternational.com/shop/cigars/1800000/',
    productUrlPattern: /cigarsinternational\.com\/p\/([^\/]+)/,
  },
  jr: {
    code: 'jr',
    name: 'JR Cigars',
    baseUrl: 'https://www.jrcigars.com',
    catalogUrl: 'https://www.jrcigars.com/cigars',
    productUrlPattern: /jrcigars\.com\/item\/([^\/]+)/,
  },
  holts: {
    code: 'holts',
    name: 'Holts',
    baseUrl: 'https://www.holts.com',
    catalogUrl: 'https://www.holts.com/cigars.html',
    productUrlPattern: /holts\.com\/([^\.]+)\.html/,
  },
  atlantic: {
    code: 'atlantic',
    name: 'Atlantic Cigar',
    baseUrl: 'https://www.atlanticcigar.com',
    catalogUrl: 'https://www.atlanticcigar.com/All-Cigars',
    productUrlPattern: /atlanticcigar\.com\/([^\.]+)/,
  },
  cigarpage: {
    code: 'cigarpage',
    name: 'CigarPage',
    baseUrl: 'https://www.cigarpage.com',
    catalogUrl: 'https://www.cigarpage.com/cigars.html',
    productUrlPattern: /cigarpage\.com\/([^\.]+)/,
  },
} as const;

export type CompetitorCode = keyof typeof COMPETITORS;

// Types
export interface ZyteProduct {
  name?: string;
  price?: number;
  currency?: string;
  availability?: string;
  sku?: string;
  url?: string;
  regularPrice?: number;
  description?: string;
  brand?: string;
  aggregateRating?: {
    ratingValue?: number;
    reviewCount?: number;
  };
  images?: string[];
}

export interface ZyteProductListItem {
  name?: string;
  price?: number;
  currency?: string;
  url?: string;
  availability?: string;
}

export interface ZyteProductListResponse {
  products: ZyteProductListItem[];
}

export interface ScrapedProduct {
  name: string;
  priceSingle: number | null;
  priceBox: number | null;
  boxCount: number | null;
  currency: string;
  inStock: boolean;
  isOnSale: boolean;
  regularPrice: number | null;
  url: string;
  sku: string | null;
  rating: number | null;
  reviewCount: number | null;
  competitorCode: CompetitorCode;
  scrapedAt: Date;
}

// API request helper
async function zyteRequest<T>(payload: Record<string, unknown>): Promise<T | null> {
  if (!ZYTE_API_KEY) {
    console.error('ZYTE_API_KEY not configured');
    return null;
  }

  const auth = Buffer.from(`${ZYTE_API_KEY}:`).toString('base64');

  try {
    const response = await fetch(ZYTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Zyte API error ${response.status}: ${errorText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Zyte API request failed:', error);
    return null;
  }
}

/**
 * Scrape a single product page
 */
export async function scrapeProduct(url: string): Promise<ZyteProduct | null> {
  const result = await zyteRequest<{ product?: ZyteProduct }>({
    url,
    browserHtml: true,
    product: true,
    productOptions: { extractFrom: 'browserHtml' },
  });

  return result?.product || null;
}

/**
 * Scrape a product listing page
 */
export async function scrapeProductList(url: string): Promise<ZyteProductListItem[]> {
  const result = await zyteRequest<{ productList?: ZyteProductListResponse }>({
    url,
    browserHtml: true,
    productList: true,
    productListOptions: { extractFrom: 'browserHtml' },
  });

  return result?.productList?.products || [];
}

/**
 * Scrape all products from a competitor's catalog page
 */
export async function scrapeCompetitorCatalog(
  competitorCode: CompetitorCode
): Promise<ScrapedProduct[]> {
  const competitor = COMPETITORS[competitorCode];
  if (!competitor) {
    console.error(`Unknown competitor: ${competitorCode}`);
    return [];
  }

  const rawProducts = await scrapeProductList(competitor.catalogUrl);
  const scrapedAt = new Date();

  return rawProducts.map((p) => normalizeProduct(p, competitorCode, scrapedAt));
}

/**
 * Normalize raw Zyte product data to our schema
 */
function normalizeProduct(
  raw: ZyteProductListItem | ZyteProduct,
  competitorCode: CompetitorCode,
  scrapedAt: Date
): ScrapedProduct {
  // Parse box count from name if present (e.g., "Padron 1926 No. 2 (Box of 24)")
  const boxMatch = raw.name?.match(/box\s*of\s*(\d+)/i) || raw.name?.match(/(\d+)\s*(?:ct|count|pack)/i);
  const boxCount = boxMatch ? parseInt(boxMatch[1], 10) : null;

  // Determine if this is a box price or single price based on price magnitude and name
  const price = raw.price || null;
  let priceSingle: number | null = null;
  let priceBox: number | null = null;

  if (price !== null) {
    if (boxCount && boxCount > 1) {
      priceBox = price;
      priceSingle = Math.round((price / boxCount) * 100) / 100;
    } else if (price > 50) {
      // Likely a box price
      priceBox = price;
    } else {
      priceSingle = price;
    }
  }

  // Check availability
  const availability = (raw as ZyteProduct).availability?.toLowerCase() || '';
  const inStock = !availability.includes('out') && !availability.includes('unavailable');

  // Check for sale
  const regularPrice = (raw as ZyteProduct).regularPrice || null;
  const isOnSale = regularPrice !== null && price !== null && price < regularPrice;

  return {
    name: raw.name || 'Unknown',
    priceSingle,
    priceBox,
    boxCount,
    currency: raw.currency || 'USD',
    inStock,
    isOnSale,
    regularPrice,
    url: raw.url || '',
    sku: (raw as ZyteProduct).sku || null,
    rating: (raw as ZyteProduct).aggregateRating?.ratingValue || null,
    reviewCount: (raw as ZyteProduct).aggregateRating?.reviewCount || null,
    competitorCode,
    scrapedAt,
  };
}

/**
 * Scrape a specific product URL and return normalized data
 */
export async function scrapeProductUrl(
  url: string,
  competitorCode: CompetitorCode
): Promise<ScrapedProduct | null> {
  const raw = await scrapeProduct(url);
  if (!raw) return null;

  return normalizeProduct(raw, competitorCode, new Date());
}

/**
 * Detect which competitor a URL belongs to
 */
export function detectCompetitor(url: string): CompetitorCode | null {
  const urlLower = url.toLowerCase();

  for (const [code, config] of Object.entries(COMPETITORS)) {
    if (urlLower.includes(new URL(config.baseUrl).hostname)) {
      return code as CompetitorCode;
    }
  }

  return null;
}

/**
 * Health check - verify API key works
 */
export async function checkZyteHealth(): Promise<boolean> {
  const result = await scrapeProduct('https://www.famous-smoke.com/cigars');
  return result !== null;
}
