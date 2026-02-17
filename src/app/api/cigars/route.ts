import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { SearchParams } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = createServerClient();

    // Parse query parameters
    const params: SearchParams = {
      query: searchParams.get('q') || undefined,
      brand_id: searchParams.get('brand_id') || undefined,
      strength: searchParams.get('strength') as SearchParams['strength'] || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      is_limited_edition: searchParams.get('limited') === 'true' ? true : undefined,
      sort_by: (searchParams.get('sort_by') as SearchParams['sort_by']) || 'name',
      sort_order: (searchParams.get('sort_order') as SearchParams['sort_order']) || 'asc',
      page: Number(searchParams.get('page')) || 1,
      limit: Math.min(Number(searchParams.get('limit')) || 20, 100),
    };

    // Build query
    let query = supabase
      .from('cigars')
      .select(`
        *,
        line:lines(
          *,
          brand:brands(*)
        ),
        current_price:price_aggregates(*)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (params.query) {
      query = query.or(`full_name.ilike.%${params.query}%, vitola.ilike.%${params.query}%`);
    }

    if (params.brand_id) {
      query = query.eq('line.brand_id', params.brand_id);
    }

    if (params.strength) {
      query = query.eq('strength', params.strength);
    }

    if (params.is_limited_edition !== undefined) {
      query = query.eq('is_limited_edition', params.is_limited_edition);
    }

    // Apply sorting
    const sortColumn = params.sort_by === 'price' ? 'msrp_per_cigar' : params.sort_by || 'full_name';
    query = query.order(sortColumn, { ascending: params.sort_order === 'asc' });

    // Apply pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20);
    query = query.range(offset, offset + (params.limit || 20) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cigars' },
        { status: 500 }
      );
    }

    // Filter price aggregates to get only the latest daily
    interface PriceAgg { period_type: string; }
    const cigars = data?.map(cigar => ({
      ...cigar,
      current_price: Array.isArray(cigar.current_price) 
        ? cigar.current_price.find((p: PriceAgg) => p.period_type === 'daily') || cigar.current_price[0]
        : cigar.current_price,
    }));

    return NextResponse.json({
      cigars,
      total: count || 0,
      page: params.page || 1,
      limit: params.limit || 20,
      has_more: (count || 0) > offset + (params.limit || 20),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
