'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Package, 
  Heart, 
  Share2, 
  ExternalLink,
  AlertCircle,
  Ruler,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceCard, PriceCardSkeleton } from '@/components/price/PriceCard';
import { PriceChart, PriceChartSkeleton } from '@/components/price/PriceChart';
import { CigarCard } from '@/components/common/CigarCard';
import type { Cigar, PriceHistory } from '@/types';

interface CigarDetailData {
  cigar: Cigar;
  related: Cigar[];
}

export default function CigarDetailPage() {
  const params = useParams();
  const cigarId = params.id as string;

  const [data, setData] = useState<CigarDetailData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cigar details
  useEffect(() => {
    const fetchCigar = async () => {
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
        const cigarData = await response.json();
        setData(cigarData);

        // Fetch price history
        const priceResponse = await fetch(`/api/cigars/${cigarId}/prices?period=daily&limit=90`);
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          setPriceHistory(priceData.price_history || []);
        }
      } catch (err) {
        console.error('Error fetching cigar:', err);
        setError('Failed to load cigar details');
      } finally {
        setIsLoading(false);
      }
    };

    if (cigarId) {
      fetchCigar();
    }
  }, [cigarId]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">{error}</h1>
        <p className="text-muted-foreground mb-6">
          The cigar you&apos;re looking for might have been removed or doesn&apos;t exist.
        </p>
        <Link href="/search">
          <Button>Browse All Cigars</Button>
        </Link>
      </div>
    );
  }

  const cigar = data?.cigar;
  const brandName = cigar?.brand?.name || cigar?.line?.brand?.name || 'Unknown Brand';
  const lineName = cigar?.line?.name || 'Unknown Line';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/search" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Link>

      {isLoading ? (
        <LoadingSkeleton />
      ) : cigar ? (
        <>
          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Image and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="relative h-64 md:h-80 w-full md:w-72 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {cigar.image_url ? (
                    <Image
                      src={cigar.image_url}
                      alt={cigar.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-20 w-20 text-muted-foreground" />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {cigar.is_limited_edition && (
                      <Badge className="bg-amber-600">Limited Edition</Badge>
                    )}
                    {cigar.is_discontinued && (
                      <Badge variant="secondary">Discontinued</Badge>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-muted-foreground mb-1">
                    <Link href={`/brand/${cigar.brand?.id}`} className="hover:underline">
                      {brandName}
                    </Link>
                    {' › '}
                    <Link href={`/line/${cigar.line?.id}`} className="hover:underline">
                      {lineName}
                    </Link>
                  </p>
                  <h1 className="text-3xl font-bold mb-2">{cigar.vitola}</h1>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground my-4">
                    {cigar.length_inches && cigar.ring_gauge && (
                      <div className="flex items-center gap-1">
                        <Ruler className="h-4 w-4" />
                        {cigar.length_inches}&quot; × {cigar.ring_gauge} RG
                      </div>
                    )}
                    {cigar.strength && (
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        <span className="capitalize">{cigar.strength.replace('-', ' ')}</span>
                      </div>
                    )}
                    {cigar.box_count && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Box of {cigar.box_count}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Add to Watchlist
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <PriceChart
                cigarId={cigar.id}
                priceHistory={priceHistory}
              />

              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Specs */}
                    <div>
                      <h4 className="font-semibold mb-3">Specifications</h4>
                      <dl className="space-y-2 text-sm">
                        {cigar.wrapper && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Wrapper</dt>
                            <dd>{cigar.wrapper}</dd>
                          </div>
                        )}
                        {cigar.binder && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Binder</dt>
                            <dd>{cigar.binder}</dd>
                          </div>
                        )}
                        {cigar.filler && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Filler</dt>
                            <dd>{cigar.filler}</dd>
                          </div>
                        )}
                        {cigar.length_inches && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Length</dt>
                            <dd>{cigar.length_inches}&quot;</dd>
                          </div>
                        )}
                        {cigar.ring_gauge && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Ring Gauge</dt>
                            <dd>{cigar.ring_gauge}</dd>
                          </div>
                        )}
                        {cigar.strength && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Strength</dt>
                            <dd className="capitalize">{cigar.strength.replace('-', ' ')}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Flavor Notes */}
                    {cigar.flavor_notes && cigar.flavor_notes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Flavor Notes</h4>
                        <div className="flex flex-wrap gap-2">
                          {cigar.flavor_notes.map(note => (
                            <Badge key={note} variant="secondary">
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {cigar.description && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-2">About</h4>
                      <p className="text-muted-foreground">{cigar.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Price Card */}
            <div className="space-y-6">
              {cigar.current_price ? (
                <PriceCard cigar={cigar} priceData={cigar.current_price} />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Price Data</h3>
                    <p className="text-sm text-muted-foreground">
                      We don&apos;t have enough recent sales to estimate a market value.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* MSRP Card */}
              {cigar.msrp_per_cigar && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">MSRP (per cigar)</span>
                      <span className="font-semibold">${cigar.msrp_per_cigar.toFixed(2)}</span>
                    </div>
                    {cigar.msrp_per_box && cigar.box_count && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-muted-foreground">MSRP (box of {cigar.box_count})</span>
                        <span className="font-semibold">${cigar.msrp_per_box.toFixed(2)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Where to Buy */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Where to Buy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['eBay', 'CigarBid', 'Famous Smoke'].map(retailer => (
                    <a
                      key={retailer}
                      href="#"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span>{retailer}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Cigars */}
          {data?.related && data.related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">More from {lineName}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.related.map(relatedCigar => (
                  <CigarCard key={relatedCigar.id} cigar={relatedCigar} variant="detailed" />
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-80 w-full md:w-72" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <PriceChartSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <PriceCardSkeleton />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4" />
            <Skeleton className="h-4 mt-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
