import { MeiliSearch } from 'meilisearch';
import type { AutocompleteResult, Cigar } from '@/types';

// =============================================================================
// Meilisearch Client Configuration
// =============================================================================

const host = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700';
const searchKey = process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || '';
const adminKey = process.env.MEILISEARCH_ADMIN_KEY || '';

// Browser client (search-only key)
export const searchClient = new MeiliSearch({
  host,
  apiKey: searchKey,
});

// Admin client (for indexing operations - server-side only)
export const adminClient = new MeiliSearch({
  host,
  apiKey: adminKey,
});

// -----------------------------------------------------------------------------
// Index Names
// -----------------------------------------------------------------------------

export const INDEXES = {
  CIGARS: 'cigars',
  BRANDS: 'brands',
  LINES: 'lines',
} as const;

// -----------------------------------------------------------------------------
// Search Functions
// -----------------------------------------------------------------------------

/**
 * Search cigars with full-text search
 */
export async function searchCigars(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    filter?: string[];
    sort?: string[];
  }
) {
  const index = searchClient.index(INDEXES.CIGARS);
  
  return index.search<Cigar>(query, {
    limit: options?.limit ?? 20,
    offset: options?.offset ?? 0,
    filter: options?.filter,
    sort: options?.sort,
    attributesToHighlight: ['full_name', 'vitola'],
    attributesToCrop: ['description'],
    cropLength: 100,
  });
}

/**
 * Autocomplete search across cigars, brands, and lines
 */
export async function autocomplete(query: string, limit = 10): Promise<AutocompleteResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const [cigarsResult, brandsResult, linesResult] = await Promise.all([
      searchClient.index(INDEXES.CIGARS).search(query, { limit: limit - 2 }),
      searchClient.index(INDEXES.BRANDS).search(query, { limit: 3 }),
      searchClient.index(INDEXES.LINES).search(query, { limit: 3 }),
    ]);

    const results: AutocompleteResult[] = [];

    // Add brand results first (highest priority)
    for (const hit of brandsResult.hits) {
      results.push({
        id: hit.id as string,
        type: 'brand',
        name: hit.name as string,
        subtitle: hit.country_of_origin as string,
        image_url: hit.logo_url as string,
      });
    }

    // Add line results
    for (const hit of linesResult.hits) {
      results.push({
        id: hit.id as string,
        type: 'line',
        name: hit.name as string,
        subtitle: hit.brand_name as string,
        image_url: hit.image_url as string,
      });
    }

    // Add cigar results
    for (const hit of cigarsResult.hits) {
      results.push({
        id: hit.id as string,
        type: 'cigar',
        name: hit.full_name as string,
        subtitle: hit.vitola as string,
        image_url: hit.image_url as string,
      });
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error('Meilisearch autocomplete error:', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Index Management (Server-side only)
// -----------------------------------------------------------------------------

/**
 * Configure the cigars index with proper settings
 */
export async function configureCigarsIndex() {
  const index = adminClient.index(INDEXES.CIGARS);

  await index.updateSettings({
    searchableAttributes: [
      'full_name',
      'vitola',
      'wrapper',
      'binder',
      'filler',
      'description',
      'flavor_notes',
    ],
    filterableAttributes: [
      'brand_id',
      'line_id',
      'strength',
      'body',
      'is_limited_edition',
      'is_discontinued',
      'ring_gauge',
      'length_inches',
      'price_range',
    ],
    sortableAttributes: [
      'full_name',
      'cmv',
      'price_change_pct',
      'popularity_score',
      'created_at',
    ],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    },
    pagination: {
      maxTotalHits: 1000,
    },
  });

  return index;
}

/**
 * Configure the brands index
 */
export async function configureBrandsIndex() {
  const index = adminClient.index(INDEXES.BRANDS);

  await index.updateSettings({
    searchableAttributes: ['name', 'country_of_origin', 'description'],
    filterableAttributes: ['country_of_origin', 'is_active'],
    sortableAttributes: ['name', 'cigar_count'],
  });

  return index;
}

/**
 * Configure the lines index
 */
export async function configureLinesIndex() {
  const index = adminClient.index(INDEXES.LINES);

  await index.updateSettings({
    searchableAttributes: ['name', 'brand_name', 'description'],
    filterableAttributes: ['brand_id', 'strength', 'is_limited_edition', 'is_discontinued'],
    sortableAttributes: ['name', 'brand_name'],
  });

  return index;
}

// -----------------------------------------------------------------------------
// Indexing Functions
// -----------------------------------------------------------------------------

/**
 * Index cigars into Meilisearch
 */
export async function indexCigars(cigars: Cigar[]) {
  const index = adminClient.index(INDEXES.CIGARS);
  
  const documents = cigars.map(cigar => ({
    ...cigar,
    // Flatten for easier filtering
    brand_name: cigar.brand?.name,
    line_name: cigar.line?.name,
    cmv: cigar.current_price?.cmv,
    price_change_pct: cigar.current_price?.price_change_pct,
  }));

  return index.addDocuments(documents, { primaryKey: 'id' });
}

/**
 * Remove a cigar from the index
 */
export async function removeCigarFromIndex(cigarId: string) {
  const index = adminClient.index(INDEXES.CIGARS);
  return index.deleteDocument(cigarId);
}

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------

/**
 * Check if Meilisearch is properly configured and healthy
 */
export async function isMeilisearchHealthy(): Promise<boolean> {
  try {
    const health = await searchClient.health();
    return health.status === 'available';
  } catch {
    return false;
  }
}

export default searchClient;
