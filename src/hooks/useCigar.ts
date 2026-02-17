import { useState, useEffect, useCallback } from 'react';
import type { Cigar, PriceHistory } from '@/types';

interface UseCigarOptions {
  includePriceHistory?: boolean;
  priceHistoryDays?: number;
}

interface UseCigarReturn {
  cigar: Cigar | null;
  priceHistory: PriceHistory[];
  related: Cigar[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCigar(
  cigarId: string | null,
  options: UseCigarOptions = {}
): UseCigarReturn {
  const { includePriceHistory = true, priceHistoryDays = 90 } = options;

  const [cigar, setCigar] = useState<Cigar | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [related, setRelated] = useState<Cigar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCigar = useCallback(async () => {
    if (!cigarId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch cigar details
      const response = await fetch(`/api/cigars/${cigarId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Cigar not found');
        } else {
          throw new Error('Failed to fetch cigar');
        }
        return;
      }

      const data = await response.json();
      setCigar(data.cigar);
      setRelated(data.related || []);

      // Fetch price history if requested
      if (includePriceHistory) {
        const priceResponse = await fetch(
          `/api/cigars/${cigarId}/prices?period=daily&limit=${priceHistoryDays}`
        );
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          setPriceHistory(priceData.price_history || []);
        }
      }
    } catch (err) {
      console.error('Error fetching cigar:', err);
      setError('Failed to load cigar details');
    } finally {
      setIsLoading(false);
    }
  }, [cigarId, includePriceHistory, priceHistoryDays]);

  useEffect(() => {
    fetchCigar();
  }, [fetchCigar]);

  return {
    cigar,
    priceHistory,
    related,
    isLoading,
    error,
    refetch: fetchCigar,
  };
}

// Hook for searching cigars
interface UseSearchCigarsOptions {
  query?: string;
  brandId?: string;
  strength?: string;
  limitedOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface UseSearchCigarsReturn {
  cigars: Cigar[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  refetch: () => void;
}

export function useSearchCigars(
  options: UseSearchCigarsOptions = {}
): UseSearchCigarsReturn {
  const {
    query = '',
    brandId,
    strength,
    limitedOnly,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  } = options;

  const [cigars, setCigars] = useState<Cigar[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCigars = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchPage = reset ? 1 : currentPage;
      const params = new URLSearchParams({
        page: fetchPage.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (query) params.append('q', query);
      if (brandId) params.append('brand_id', brandId);
      if (strength) params.append('strength', strength);
      if (limitedOnly) params.append('limited', 'true');

      const response = await fetch(`/api/cigars?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cigars');
      }

      const data = await response.json();

      if (reset) {
        setCigars(data.cigars || []);
        setCurrentPage(1);
      } else {
        setCigars(prev => [...prev, ...(data.cigars || [])]);
      }

      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
    } catch (err) {
      console.error('Error fetching cigars:', err);
      setError('Failed to load cigars');
    } finally {
      setIsLoading(false);
    }
  }, [query, brandId, strength, limitedOnly, sortBy, sortOrder, currentPage, limit]);

  // Refetch when filters change
  useEffect(() => {
    fetchCigars(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, brandId, strength, limitedOnly, sortBy, sortOrder]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchCigars(false);
    }
  }, [isLoading, hasMore, fetchCigars]);

  return {
    cigars,
    total,
    hasMore,
    isLoading,
    error,
    loadMore,
    refetch: () => fetchCigars(true),
  };
}
