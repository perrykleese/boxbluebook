// =============================================================================
// BoxBlueBook Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Core Entities
// -----------------------------------------------------------------------------

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country_of_origin: string | null;
  founded_year: number | null;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Line {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string | null;
  wrapper_type: string | null;
  strength: StrengthLevel | null;
  is_limited_edition: boolean;
  release_year: number | null;
  is_discontinued: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  brand?: Brand;
}

export interface Cigar {
  id: string;
  line_id: string;
  name: string;
  slug: string;
  full_name: string; // "Brand - Line - Vitola"
  vitola: string;
  length_inches: number | null;
  ring_gauge: number | null;
  box_count: number | null;
  msrp_per_cigar: number | null;
  msrp_per_box: number | null;
  wrapper: string | null;
  binder: string | null;
  filler: string | null;
  strength: StrengthLevel | null;
  body: BodyLevel | null;
  flavor_notes: string[];
  description: string | null;
  image_url: string | null;
  is_limited_edition: boolean;
  is_discontinued: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  line?: Line;
  brand?: Brand;
  current_price?: PriceAggregate;
}

export interface BoxCode {
  id: string;
  cigar_id: string;
  code: string;
  box_date: string; // Date string
  factory_code: string | null;
  notes: string | null;
  verified: boolean;
  created_at: string;
  // Relations
  cigar?: Cigar;
}

// -----------------------------------------------------------------------------
// Pricing & Transactions
// -----------------------------------------------------------------------------

export interface Transaction {
  id: string;
  cigar_id: string;
  source: TransactionSource;
  source_id: string | null;
  source_url: string | null;
  transaction_type: TransactionType;
  quantity: number;
  unit_price: number;
  total_price: number;
  condition: CigarCondition;
  box_code_id: string | null;
  transaction_date: string;
  scraped_at: string;
  verified: boolean;
  notes: string | null;
  created_at: string;
  // Relations
  cigar?: Cigar;
  box_code?: BoxCode;
}

export interface PriceAggregate {
  id: string;
  cigar_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  transaction_count: number;
  total_volume: number;
  price_change_pct: number | null;
  cmv: number; // Current Market Value
  cmv_confidence: ConfidenceLevel;
  created_at: string;
  updated_at: string;
  // Relations
  cigar?: Cigar;
}

export interface PriceHistory {
  date: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  volume: number;
}

export interface MarketTrend {
  cigar_id: string;
  cigar: Cigar;
  price_change_pct: number;
  price_change_abs: number;
  volume_change_pct: number;
  period: string;
}

// -----------------------------------------------------------------------------
// User-related
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  default_currency: string;
  notifications_enabled: boolean;
  price_alert_threshold: number;
  favorite_brands: string[];
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  cigar_id: string;
  target_price: number | null;
  alert_on_price_drop: boolean;
  alert_on_new_listing: boolean;
  notes: string | null;
  created_at: string;
  // Relations
  cigar?: Cigar;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  cigar_id: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string | null;
  box_code_id: string | null;
  storage_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  cigar?: Cigar;
  box_code?: BoxCode;
}

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type StrengthLevel = 'mild' | 'mild-medium' | 'medium' | 'medium-full' | 'full';
export type BodyLevel = 'light' | 'light-medium' | 'medium' | 'medium-full' | 'full';
export type TransactionSource = 'ebay' | 'cigarbid' | 'cbid' | 'foxcigar' | 'manual' | 'user_reported';
export type TransactionType = 'sale' | 'auction' | 'buy_now' | 'offer_accepted';
export type CigarCondition = 'new_sealed' | 'new_opened' | 'aged' | 'vintage' | 'unknown';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_data';
export type SubscriptionTier = 'free' | 'pro' | 'dealer';

// -----------------------------------------------------------------------------
// API Request/Response Types
// -----------------------------------------------------------------------------

export interface SearchParams {
  query?: string;
  brand_id?: string;
  strength?: StrengthLevel;
  min_price?: number;
  max_price?: number;
  is_limited_edition?: boolean;
  sort_by?: 'name' | 'price' | 'popularity' | 'price_change';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  cigars: Cigar[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface AutocompleteResult {
  id: string;
  type: 'brand' | 'line' | 'cigar';
  name: string;
  subtitle?: string;
  image_url?: string;
}

export interface PriceHistoryParams {
  period?: PeriodType;
  start_date?: string;
  end_date?: string;
}

export interface TrendingParams {
  period?: '7d' | '30d' | '90d' | '1y';
  direction?: 'up' | 'down' | 'both';
  limit?: number;
}

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

export interface PriceCardProps {
  cigar: Cigar;
  priceData: PriceAggregate;
  compact?: boolean;
}

export interface PriceChartProps {
  cigarId: string;
  priceHistory: PriceHistory[];
  period?: PeriodType;
}

export interface CigarCardProps {
  cigar: Cigar;
  showPrice?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelect?: (result: AutocompleteResult) => void;
  className?: string;
}
