import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Handle missing environment variables gracefully
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface CompetitorPrice {
  code: string;
  name: string;
  price_single: number | null;
  price_box: number | null;
  box_count: number | null;
  in_stock: boolean;
  is_on_sale: boolean;
  regular_price: number | null;
  url: string | null;
  rating: number | null;
  review_count: number | null;
  scraped_at: string;
}

interface PriceComparisonResponse {
  cigar: {
    id: string;
    name: string;
    brand: string;
    line: string;
    vitola: string;
    msrp_single: number | null;
    msrp_box: number | null;
  };
  competitors: CompetitorPrice[];
  best_price: {
    competitor: string;
    price_single: number;
    savings_percent: number;
  } | null;
  market_value: {
    avg_sale: number | null;
    trend_90d: number | null;
    last_sale: {
      price: number;
      source: string;
      date: string;
    } | null;
  };
  cache_age_minutes: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { cigarId: string } }
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase credentials.' },
        { status: 503 }
      );
    }

    const { cigarId } = params;

    // Get cigar details
    const { data: cigar, error: cigarError } = await supabase
      .from('cigars')
      .select(`
        id,
        name,
        full_name,
        vitola,
        msrp_per_cigar,
        msrp_per_box,
        lines!inner (
          name,
          brands!inner (
            name
          )
        )
      `)
      .eq('id', cigarId)
      .single();

    if (cigarError || !cigar) {
      return NextResponse.json(
        { error: 'Cigar not found' },
        { status: 404 }
      );
    }

    // Get competitor prices
    const { data: prices, error: pricesError } = await supabase
      .from('competitor_prices')
      .select(`
        price_single,
        price_box,
        box_count,
        in_stock,
        is_on_sale,
        regular_price,
        competitor_url,
        rating,
        review_count,
        scraped_at,
        competitors!inner (
          code,
          name
        )
      `)
      .eq('cigar_id', cigarId)
      .order('price_single', { ascending: true, nullsFirst: false });

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
    }

    // Format competitor prices
    const competitorPrices: CompetitorPrice[] = (prices || []).map((p: any) => ({
      code: p.competitors.code,
      name: p.competitors.name,
      price_single: p.price_single,
      price_box: p.price_box,
      box_count: p.box_count,
      in_stock: p.in_stock,
      is_on_sale: p.is_on_sale,
      regular_price: p.regular_price,
      url: p.competitor_url,
      rating: p.rating,
      review_count: p.review_count,
      scraped_at: p.scraped_at,
    }));

    // Calculate best price
    const inStockPrices = competitorPrices.filter(p => p.in_stock && p.price_single);
    const bestPrice = inStockPrices.length > 0
      ? {
          competitor: inStockPrices[0].code,
          price_single: inStockPrices[0].price_single!,
          savings_percent: competitorPrices.length > 1
            ? Math.round((1 - inStockPrices[0].price_single! / 
                (competitorPrices.reduce((sum, p) => sum + (p.price_single || 0), 0) / 
                 competitorPrices.filter(p => p.price_single).length)) * 100)
            : 0,
        }
      : null;

    // Get market value from transactions (secondary market)
    const { data: marketData } = await supabase
      .from('price_aggregates')
      .select('avg_price, price_change_90d')
      .eq('cigar_id', cigarId)
      .eq('period_type', 'monthly')
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    const { data: lastSale } = await supabase
      .from('transactions')
      .select('price_per_cigar, source, transaction_date')
      .eq('cigar_id', cigarId)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single();

    // Calculate cache age
    const oldestScrape = competitorPrices.reduce((oldest, p) => {
      const scrapeDate = new Date(p.scraped_at);
      return scrapeDate < oldest ? scrapeDate : oldest;
    }, new Date());
    const cacheAgeMinutes = Math.round((Date.now() - oldestScrape.getTime()) / 60000);

    const response: PriceComparisonResponse = {
      cigar: {
        id: cigar.id,
        name: cigar.full_name,
        brand: (cigar.lines as any).brands.name,
        line: (cigar.lines as any).name,
        vitola: cigar.vitola,
        msrp_single: cigar.msrp_per_cigar,
        msrp_box: cigar.msrp_per_box,
      },
      competitors: competitorPrices,
      best_price: bestPrice,
      market_value: {
        avg_sale: marketData?.avg_price || null,
        trend_90d: marketData?.price_change_90d || null,
        last_sale: lastSale
          ? {
              price: lastSale.price_per_cigar,
              source: lastSale.source,
              date: lastSale.transaction_date,
            }
          : null,
      },
      cache_age_minutes: cacheAgeMinutes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Price comparison error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
