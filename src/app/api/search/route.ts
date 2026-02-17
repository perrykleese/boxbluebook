import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { autocomplete, isMeilisearchHealthy } from '@/lib/meilisearch';
import type { AutocompleteResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 20);
    const type = searchParams.get('type'); // 'cigar' | 'brand' | 'line' | null

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Try Meilisearch first (faster full-text search)
    const meilisearchHealthy = await isMeilisearchHealthy();
    
    if (meilisearchHealthy) {
      try {
        const results = await autocomplete(query, limit);
        
        // Filter by type if specified
        const filtered = type 
          ? results.filter(r => r.type === type)
          : results;

        return NextResponse.json({ 
          results: filtered,
          source: 'meilisearch',
        });
      } catch (error) {
        console.error('Meilisearch error, falling back to Supabase:', error);
      }
    }

    // Fallback to Supabase search
    const supabase = createServerClient();
    const results: AutocompleteResult[] = [];

    // Search brands
    if (!type || type === 'brand') {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name, country_of_origin, logo_url')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(3);

      brands?.forEach(brand => {
        results.push({
          id: brand.id,
          type: 'brand',
          name: brand.name,
          subtitle: brand.country_of_origin || undefined,
          image_url: brand.logo_url || undefined,
        });
      });
    }

    // Search lines
    if (!type || type === 'line') {
      const { data: lines } = await supabase
        .from('lines')
        .select('id, name, brand:brands(name)')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(3);

      lines?.forEach(line => {
        results.push({
          id: line.id,
          type: 'line',
          name: line.name,
          subtitle: (line.brand as { name?: string })?.name,
        });
      });
    }

    // Search cigars
    if (!type || type === 'cigar') {
      const { data: cigars } = await supabase
        .from('cigars')
        .select('id, full_name, vitola, image_url')
        .or(`full_name.ilike.%${query}%, vitola.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit - results.length);

      cigars?.forEach(cigar => {
        results.push({
          id: cigar.id,
          type: 'cigar',
          name: cigar.full_name,
          subtitle: cigar.vitola,
          image_url: cigar.image_url || undefined,
        });
      });
    }

    return NextResponse.json({ 
      results: results.slice(0, limit),
      source: 'supabase',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
