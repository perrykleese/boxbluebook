import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { PeriodType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const supabase = createServerClient();

    // Parse query parameters
    const periodType = (searchParams.get('period') as PeriodType) || 'daily';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(Number(searchParams.get('limit')) || 90, 365);

    // Build query
    let query = supabase
      .from('price_aggregates')
      .select('*')
      .eq('cigar_id', id)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      query = query.lte('period_end', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price history' },
        { status: 500 }
      );
    }

    // Transform to chart-friendly format
    const priceHistory = data?.map(row => ({
      date: row.period_start,
      avg_price: row.avg_price,
      min_price: row.min_price,
      max_price: row.max_price,
      volume: row.total_volume,
      cmv: row.cmv,
    })) || [];

    // Calculate summary stats
    const summary = data && data.length > 0 ? {
      current_cmv: data[0].cmv,
      current_confidence: data[0].cmv_confidence,
      period_high: Math.max(...data.map(d => d.max_price)),
      period_low: Math.min(...data.map(d => d.min_price)),
      total_transactions: data.reduce((sum, d) => sum + d.transaction_count, 0),
      total_volume: data.reduce((sum, d) => sum + d.total_volume, 0),
    } : null;

    return NextResponse.json({
      cigar_id: id,
      period_type: periodType,
      price_history: priceHistory,
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
