import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = createServerClient();

    const includeCigarCount = searchParams.get('include_count') === 'true';

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brands' },
        { status: 500 }
      );
    }

    // Optionally add cigar count
    if (includeCigarCount && data) {
      // Get cigar counts per brand
      const { data: counts } = await supabase
        .from('cigars')
        .select('line:lines(brand_id)')
        .eq('is_active', true);

      const countByBrand: Record<string, number> = {};
      counts?.forEach(c => {
        const lineData = c.line as { brand_id?: string } | null;
        const brandId = lineData?.brand_id;
        if (brandId) {
          countByBrand[brandId] = (countByBrand[brandId] || 0) + 1;
        }
      });

      const brandsWithCount = data.map(brand => ({
        ...brand,
        cigar_count: countByBrand[brand.id] || 0,
      }));

      return NextResponse.json({ brands: brandsWithCount });
    }

    return NextResponse.json({ brands: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
