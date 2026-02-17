'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  cn,
  formatCurrency,
  formatPercent,
  getPriceTrend,
  getTrendColor,
} from '@/lib/utils';
import type { CigarCardProps } from '@/types';

export function CigarCard({ cigar, showPrice = true, variant = 'default' }: CigarCardProps) {
  const priceData = cigar.current_price;
  const trend = priceData ? getPriceTrend(priceData.price_change_pct) : 'stable';
  const trendColor = getTrendColor(trend);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Extract brand and line info
  const brandName = cigar.brand?.name || cigar.line?.brand?.name || 'Unknown Brand';
  const lineName = cigar.line?.name || 'Unknown Line';

  if (variant === 'compact') {
    return (
      <Link href={`/cigar/${cigar.id}`}>
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          {/* Image */}
          <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {cigar.image_url ? (
              <Image
                src={cigar.image_url}
                alt={cigar.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{cigar.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{cigar.vitola}</p>
          </div>

          {/* Price */}
          {showPrice && priceData && (
            <div className="text-right flex-shrink-0">
              <p className="font-semibold">{formatCurrency(priceData.cmv)}</p>
              {priceData.price_change_pct !== null && (
                <div className={cn('flex items-center justify-end gap-1 text-xs', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  {formatPercent(priceData.price_change_pct)}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  if (variant === 'detailed') {
    return (
      <Link href={`/cigar/${cigar.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Image */}
          <div className="relative h-48 bg-muted">
            {cigar.image_url ? (
              <Image
                src={cigar.image_url}
                alt={cigar.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                <Package className="h-16 w-16" />
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {cigar.is_limited_edition && (
                <Badge variant="default" className="bg-amber-600">
                  Limited Edition
                </Badge>
              )}
              {cigar.is_discontinued && (
                <Badge variant="secondary">Discontinued</Badge>
              )}
            </div>
          </div>

          <CardContent className="p-4">
            {/* Brand & Line */}
            <p className="text-sm text-muted-foreground">{brandName}</p>
            <h3 className="font-semibold text-lg mb-1">{lineName}</h3>
            <p className="text-muted-foreground mb-3">{cigar.vitola}</p>

            {/* Specs */}
            <div className="flex gap-4 text-sm text-muted-foreground mb-3">
              {cigar.length_inches && cigar.ring_gauge && (
                <span>{cigar.length_inches}&quot; × {cigar.ring_gauge}</span>
              )}
              {cigar.strength && (
                <span className="capitalize">{cigar.strength.replace('-', ' ')}</span>
              )}
            </div>

            {/* Price */}
            {showPrice && priceData && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Market Value</p>
                  <p className="text-xl font-bold">{formatCurrency(priceData.cmv)}</p>
                </div>
                {priceData.price_change_pct !== null && (
                  <div className={cn('flex items-center gap-1', trendColor)}>
                    <TrendIcon className="h-5 w-5" />
                    <span className="font-semibold">
                      {formatPercent(priceData.price_change_pct)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/cigar/${cigar.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {/* Image */}
          <div className="relative h-32 w-32 bg-muted flex-shrink-0">
            {cigar.image_url ? (
              <Image
                src={cigar.image_url}
                alt={cigar.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                <Package className="h-10 w-10" />
              </div>
            )}
          </div>

          <CardContent className="flex-1 p-4">
            {/* Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{brandName}</p>
                <h3 className="font-semibold truncate">{lineName}</h3>
                <p className="text-sm text-muted-foreground">{cigar.vitola}</p>
              </div>
              {cigar.is_limited_edition && (
                <Badge variant="default" className="bg-amber-600 flex-shrink-0">
                  LE
                </Badge>
              )}
            </div>

            {/* Specs */}
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              {cigar.length_inches && cigar.ring_gauge && (
                <span>{cigar.length_inches}&quot; × {cigar.ring_gauge}</span>
              )}
              {cigar.strength && (
                <>
                  <span>•</span>
                  <span className="capitalize">{cigar.strength.replace('-', ' ')}</span>
                </>
              )}
            </div>

            {/* Price */}
            {showPrice && priceData && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="font-semibold">{formatCurrency(priceData.cmv)}</span>
                {priceData.price_change_pct !== null && (
                  <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
                    <TrendIcon className="h-3 w-3" />
                    {formatPercent(priceData.price_change_pct)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// Loading skeletons
export function CigarCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <CardContent className="p-4">
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="flex gap-4 mb-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="pt-3 border-t">
            <Skeleton className="h-7 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <Skeleton className="h-32 w-32" />
        <CardContent className="flex-1 p-4">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-20 mb-3" />
          <div className="pt-2 border-t">
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
