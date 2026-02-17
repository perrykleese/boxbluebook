'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Grid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/search/SearchBar';
import { CigarCard, CigarCardSkeleton } from '@/components/common/CigarCard';
import type { Cigar, StrengthLevel } from '@/types';

const STRENGTH_OPTIONS: { value: StrengthLevel; label: string }[] = [
  { value: 'mild', label: 'Mild' },
  { value: 'mild-medium', label: 'Mild-Medium' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-full', label: 'Medium-Full' },
  { value: 'full', label: 'Full' },
];

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'price:asc', label: 'Price (Low-High)' },
  { value: 'price:desc', label: 'Price (High-Low)' },
  { value: 'price_change:desc', label: 'Biggest Gainers' },
  { value: 'price_change:asc', label: 'Biggest Losers' },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [strength, setStrength] = useState<StrengthLevel | ''>(
    (searchParams.get('strength') as StrengthLevel) || ''
  );
  const [limitedOnly, setLimitedOnly] = useState(searchParams.get('limited') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name:asc');

  // Fetch cigars
  const fetchCigars = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const [sortField, sortOrder] = sortBy.split(':');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort_by: sortField,
        sort_order: sortOrder,
      });
      
      if (query) params.append('q', query);
      if (strength) params.append('strength', strength);
      if (limitedOnly) params.append('limited', 'true');

      const response = await fetch(`/api/cigars?${params}`);
      const data = await response.json();

      if (reset) {
        setCigars(data.cigars || []);
        setPage(1);
      } else {
        setCigars(prev => [...prev, ...(data.cigars || [])]);
      }
      
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
    } catch (error) {
      console.error('Failed to fetch cigars:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, strength, limitedOnly, sortBy, page]);

  // Initial load and filter changes
  useEffect(() => {
    fetchCigars(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, strength, limitedOnly, sortBy]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (strength) params.set('strength', strength);
    if (limitedOnly) params.set('limited', 'true');
    if (sortBy !== 'name:asc') params.set('sort', sortBy);
    
    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [query, strength, limitedOnly, sortBy, router]);

  // Load more
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchCigars(false);
  };

  // Handle search
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  // Clear filters
  const clearFilters = () => {
    setQuery('');
    setStrength('');
    setLimitedOnly(false);
    setSortBy('name:asc');
  };

  const activeFiltersCount = [
    strength,
    limitedOnly,
    sortBy !== 'name:asc',
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Cigars</h1>
        <p className="text-muted-foreground">
          Browse our database of {total > 0 ? total.toLocaleString() : '15,000+'} cigars
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          placeholder="Search by name, brand, or vitola..."
          onSearch={handleSearch}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total} results
          </span>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Strength Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Strength</label>
                <select
                  value={strength}
                  onChange={(e) => setStrength(e.target.value as StrengthLevel | '')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Strengths</option>
                  {STRENGTH_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limited Edition Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Edition</label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="limited"
                    checked={limitedOnly}
                    onChange={(e) => setLimitedOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="limited" className="text-sm">
                    Limited Editions Only
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading && cigars.length === 0 ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <CigarCardSkeleton key={i} variant={viewMode === 'grid' ? 'detailed' : 'default'} />
          ))}
        </div>
      ) : cigars.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No cigars found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </Card>
      ) : (
        <>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
            {cigars.map(cigar => (
              <CigarCard
                key={cigar.id}
                cigar={cigar}
                variant={viewMode === 'grid' ? 'detailed' : 'default'}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-1/4 mb-2" />
          <div className="h-6 bg-muted rounded w-1/3 mb-8" />
          <div className="h-12 bg-muted rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
