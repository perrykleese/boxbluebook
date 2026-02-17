import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type TrendPeriod = '7d' | '30d' | '90d' | '1y';
type TrendDirection = 'up' | 'down' | 'both';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = createServerClient();

    const period = (searchParams.get('period') as TrendPeriod) || '30d';
    const direction = (searchParams.get('direction') as TrendDirection) || 'both';
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
    const category = searchParams.get('category'); // 'gainers' | 'losers' | 'volume' | 'new'

    // Calculate date range based on period
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }[period];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get trending cigars based on price changes
    let query = supabase
      .from('price_aggregates')
      .select(`
        cigar_id,
        cmv,
        price_change_pct,
        cmv_confidence,
        transaction_count,
        total_volume,
        cigar:cigars(
          *,
          line:lines(
            *,
            brand:brands(*)
          )
        )
      `)
      .eq('period_type', 'weekly')
      .gte('period_start', startDate.toISOString().split('T')[0])
      .in('cmv_confidence', ['high', 'medium'])
      .not('price_change_pct', 'is', null);

    // Filter by direction
    if (direction === 'up') {
      query = query.gt('price_change_pct', 0);
    } else if (direction === 'down') {
      query = query.lt('price_change_pct', 0);
    }

    // Sort based on category
    switch (category) {
      case 'gainers':
        query = query.order('price_change_pct', { ascending: false });
        break;
      case 'losers':
        query = query.order('price_change_pct', { ascending: true });
        break;
      case 'volume':
        query = query.order('total_volume', { ascending: false });
        break;
      default:
        // Sort by absolute change for 'both' direction
        query = query.order('price_change_pct', { ascending: direction === 'down' });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trends' },
        { status: 500 }
      );
    }

    // Deduplicate by cigar_id (keep most recent)
    const seenCigars = new Set<string>();
    const trends = data?.filter(row => {
      if (seenCigars.has(row.cigar_id)) return false;
      seenCigars.add(row.cigar_id);
      return true;
    }).map(row => ({
      cigar_id: row.cigar_id,
      cigar: {
        ...row.cigar,
        brand: (row.cigar as { line?: { brand?: unknown } })?.line?.brand,
        current_price: {
          cmv: row.cmv,
          price_change_pct: row.price_change_pct,
          cmv_confidence: row.cmv_confidence,
        },
      },
      price_change_pct: row.price_change_pct,
      cmv: row.cmv,
      volume: row.total_volume,
      transactions: row.transaction_count,
    })) || [];

    // Get market summary
    const { data: summaryData } = await supabase
      .from('price_aggregates')
      .select('price_change_pct, total_volume')
      .eq('period_type', 'weekly')
      .gte('period_start', startDate.toISOString().split('T')[0])
      .in('cmv_confidence', ['high', 'medium'])
      .not('price_change_pct', 'is', null);

    const summary = summaryData ? {
      total_cigars: summaryData.length,
      avg_price_change: summaryData.reduce((sum, d) => sum + (d.price_change_pct || 0), 0) / summaryData.length,
      gainers: summaryData.filter(d => (d.price_change_pct || 0) > 0).length,
      losers: summaryData.filter(d => (d.price_change_pct || 0) < 0).length,
      total_volume: summaryData.reduce((sum, d) => sum + (d.total_volume || 0), 0),
    } : null;

    return NextResponse.json({
      period,
      trends,
      summary,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
