import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =============================================================================
// Supabase Client Configuration
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Database features will not work.'
  );
}

// -----------------------------------------------------------------------------
// Browser Client (for client-side operations)
// -----------------------------------------------------------------------------

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// -----------------------------------------------------------------------------
// Server Client (for server-side operations with elevated privileges)
// -----------------------------------------------------------------------------

export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Using anon client.');
    return supabase;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected database error occurred';
}

// -----------------------------------------------------------------------------
// Type-safe query builders
// -----------------------------------------------------------------------------

export const queries = {
  cigars: {
    list: () => 
      supabase
        .from('cigars')
        .select(`
          *,
          line:lines(*, brand:brands(*)),
          current_price:price_aggregates(*)
        `)
        .eq('is_active', true),

    byId: (id: string) =>
      supabase
        .from('cigars')
        .select(`
          *,
          line:lines(*, brand:brands(*)),
          current_price:price_aggregates(*),
          box_codes(*)
        `)
        .eq('id', id)
        .single(),

    bySlug: (slug: string) =>
      supabase
        .from('cigars')
        .select(`
          *,
          line:lines(*, brand:brands(*)),
          current_price:price_aggregates(*),
          box_codes(*)
        `)
        .eq('slug', slug)
        .single(),

    search: (query: string, limit = 20) =>
      supabase
        .from('cigars')
        .select(`
          *,
          line:lines(*, brand:brands(*)),
          current_price:price_aggregates(*)
        `)
        .or(`full_name.ilike.%${query}%, vitola.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit),
  },

  brands: {
    list: () =>
      supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name'),

    byId: (id: string) =>
      supabase
        .from('brands')
        .select(`
          *,
          lines(*, cigars(*))
        `)
        .eq('id', id)
        .single(),

    bySlug: (slug: string) =>
      supabase
        .from('brands')
        .select(`
          *,
          lines(*, cigars(*))
        `)
        .eq('slug', slug)
        .single(),
  },

  prices: {
    history: (cigarId: string, periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily', limit = 90) =>
      supabase
        .from('price_aggregates')
        .select('*')
        .eq('cigar_id', cigarId)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(limit),

    latest: (cigarId: string) =>
      supabase
        .from('price_aggregates')
        .select('*')
        .eq('cigar_id', cigarId)
        .eq('period_type', 'daily')
        .order('period_start', { ascending: false })
        .limit(1)
        .single(),
  },

  transactions: {
    recent: (cigarId: string, limit = 20) =>
      supabase
        .from('transactions')
        .select('*')
        .eq('cigar_id', cigarId)
        .eq('verified', true)
        .order('transaction_date', { ascending: false })
        .limit(limit),
  },

  user: {
    watchlist: (userId: string) =>
      supabase
        .from('watchlist_items')
        .select(`
          *,
          cigar:cigars(*, line:lines(*, brand:brands(*)), current_price:price_aggregates(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

    portfolio: (userId: string) =>
      supabase
        .from('portfolio_items')
        .select(`
          *,
          cigar:cigars(*, line:lines(*, brand:brands(*)), current_price:price_aggregates(*)),
          box_code:box_codes(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
  },
};

export default supabase;
