'use client';

import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  cn,
  formatCurrency,
  formatPercent,
  getPriceTrend,
  getTrendColor,
  getConfidenceBadge,
} from '@/lib/utils';
import type { PriceCardProps } from '@/types';

export function PriceCard({ cigar, priceData, compact = false }: PriceCardProps) {
  const trend = getPriceTrend(priceData.price_change_pct);
  const trendColor = getTrendColor(trend);
  const confidence = getConfidenceBadge(priceData.cmv_confidence);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Current Market Value</p>
          <p className="text-2xl font-bold">{formatCurrency(priceData.cmv)}</p>
        </div>
        {priceData.price_change_pct !== null && (
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {formatPercent(priceData.price_change_pct)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Market Value</CardTitle>
          <Badge variant={confidence.variant}>{confidence.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* CMV */}
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-4xl font-bold tracking-tight">
            {formatCurrency(priceData.cmv)}
          </div>
          {priceData.price_change_pct !== null && (
            <div className={cn('flex items-center gap-1 text-lg', trendColor)}>
              <TrendIcon className="h-5 w-5" />
              <span className="font-semibold">
                {formatPercent(priceData.price_change_pct)}
              </span>
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Price Range</span>
            <span className="font-medium">
              {formatCurrency(priceData.min_price)} - {formatCurrency(priceData.max_price)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Average Price</span>
            <span className="font-medium">{formatCurrency(priceData.avg_price)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Median Price</span>
            <span className="font-medium">{formatCurrency(priceData.median_price)}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Sales Volume</span>
            <span className="font-medium">
              {priceData.transaction_count} transactions
            </span>
          </div>
        </div>

        {/* MSRP Comparison */}
        {cigar.msrp_per_cigar && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">MSRP Comparison</span>
            </div>
            <p className="text-sm text-muted-foreground">
              MSRP: {formatCurrency(cigar.msrp_per_cigar)}
              <span className="mx-2">•</span>
              {priceData.cmv > cigar.msrp_per_cigar ? (
                <span className="text-green-600">
                  Trading {formatPercent(((priceData.cmv - cigar.msrp_per_cigar) / cigar.msrp_per_cigar) * 100)} above MSRP
                </span>
              ) : priceData.cmv < cigar.msrp_per_cigar ? (
                <span className="text-red-600">
                  Trading {formatPercent(((cigar.msrp_per_cigar - priceData.cmv) / cigar.msrp_per_cigar) * 100)} below MSRP
                </span>
              ) : (
                <span>Trading at MSRP</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function PriceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini price display for lists
export function PriceBadge({ price, change }: { price: number; change?: number | null }) {
  const trend = getPriceTrend(change || null);
  const trendColor = getTrendColor(trend);

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{formatCurrency(price)}</span>
      {change !== null && change !== undefined && (
        <span className={cn('text-sm', trendColor)}>
          {formatPercent(change)}
        </span>
      )}
    </div>
  );
}
