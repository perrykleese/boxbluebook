'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, AlertCircle, Check, X } from 'lucide-react';

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

interface PriceComparisonData {
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

interface PriceComparisonProps {
  cigarId: string;
  compact?: boolean;
}

export function PriceComparison({ cigarId, compact = false }: PriceComparisonProps) {
  const [data, setData] = useState<PriceComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/prices/compare/${cigarId}`);
        if (!res.ok) throw new Error('Failed to fetch prices');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [cigarId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>Unable to load prices</span>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (compact) {
    // Compact view for search results / cards
    return (
      <div className="text-sm">
        {data.best_price ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-green-600 dark:text-green-400">
              From {formatPrice(data.best_price.price_single)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              @ {data.competitors.find(c => c.code === data.best_price?.competitor)?.name}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">No prices available</span>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Price Comparison
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Updated {data.cache_age_minutes < 60 
            ? `${data.cache_age_minutes}m ago` 
            : `${Math.round(data.cache_age_minutes / 60)}h ago`}
        </p>
      </div>

      {/* Competitor Prices */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.competitors.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No competitor prices found
          </div>
        ) : (
          data.competitors.map((comp) => (
            <div
              key={comp.code}
              className={`px-4 py-3 flex items-center justify-between ${
                !comp.in_stock ? 'opacity-50' : ''
              } ${
                data.best_price?.competitor === comp.code
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Best price badge */}
                {data.best_price?.competitor === comp.code && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                    Best
                  </span>
                )}
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {comp.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {comp.in_stock ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" /> In Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        <X className="w-3 h-3" /> Out of Stock
                      </span>
                    )}
                    {comp.rating && (
                      <span>★ {comp.rating.toFixed(1)} ({comp.review_count})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  {comp.is_on_sale && comp.regular_price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(comp.regular_price)}
                    </span>
                  )}
                  <span className={`font-semibold ${
                    comp.is_on_sale 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatPrice(comp.price_single)}
                  </span>
                  {comp.url && (
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {comp.price_box && comp.box_count && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPrice(comp.price_box)} / box of {comp.box_count}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Market Value Section */}
      {(data.market_value.avg_sale || data.market_value.last_sale) && (
        <>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Secondary Market
            </h4>
          </div>
          <div className="px-4 py-3 space-y-2">
            {data.market_value.avg_sale && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Avg. Sale Price
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(data.market_value.avg_sale)}
                  </span>
                  {data.market_value.trend_90d !== null && (
                    <span className={`flex items-center text-xs ${
                      data.market_value.trend_90d >= 0 
                        ? 'text-green-600' 
                        : 'text-red-500'
                    }`}>
                      {data.market_value.trend_90d >= 0 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(data.market_value.trend_90d).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            {data.market_value.last_sale && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Last Sale ({data.market_value.last_sale.source})
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatPrice(data.market_value.last_sale.price)} · {formatDate(data.market_value.last_sale.date)}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* MSRP Reference */}
      {data.cigar.msrp_single && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          MSRP: {formatPrice(data.cigar.msrp_single)}/ea
          {data.cigar.msrp_box && ` · ${formatPrice(data.cigar.msrp_box)}/box`}
        </div>
      )}
    </div>
  );
}

export default PriceComparison;
