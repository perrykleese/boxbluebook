import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('cigars')
      .select(`
        *,
        line:lines(
          *,
          brand:brands(*)
        ),
        price_history:price_aggregates(
          *
        ),
        box_codes(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Cigar not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cigar' },
        { status: 500 }
      );
    }

    // Get current price (latest daily aggregate)
    interface PriceAgg { period_type: string; period_start: string; }
    const currentPrice = Array.isArray(data.price_history)
      ? data.price_history
          .filter((p: PriceAgg) => p.period_type === 'daily')
          .sort((a: PriceAgg, b: PriceAgg) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())[0]
      : null;

    // Get related cigars from same line
    const { data: relatedCigars } = await supabase
      .from('cigars')
      .select(`
        *,
        current_price:price_aggregates(*)
      `)
      .eq('line_id', data.line_id)
      .neq('id', id)
      .eq('is_active', true)
      .limit(4);

    return NextResponse.json({
      cigar: {
        ...data,
        current_price: currentPrice,
        brand: data.line?.brand,
      },
      related: relatedCigars?.map(cigar => ({
        ...cigar,
        current_price: Array.isArray(cigar.current_price)
          ? cigar.current_price.find((p: PriceAgg) => p.period_type === 'daily')
          : cigar.current_price,
      })) || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
