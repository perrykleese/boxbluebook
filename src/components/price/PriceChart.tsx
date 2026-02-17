'use client';

import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { PriceChartProps } from '@/types';

const PERIODS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '1Y', value: 365 },
  { label: 'ALL', value: -1 },
] as const;

interface ChartDataPoint {
  date: string;
  displayDate: string;
  price: number;
  min: number;
  max: number;
  volume: number;
}

export function PriceChart({ priceHistory }: PriceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  // Transform and filter data
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!priceHistory || priceHistory.length === 0) return [];

    const filtered = selectedPeriod === -1
      ? priceHistory
      : priceHistory.slice(0, selectedPeriod);

    return filtered
      .map((point) => ({
        date: point.date,
        displayDate: formatDate(point.date, { month: 'short', day: 'numeric' }),
        price: point.avg_price,
        min: point.min_price,
        max: point.max_price,
        volume: point.volume,
      }))
      .reverse(); // Show oldest to newest
  }, [priceHistory, selectedPeriod]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const prices = chartData.map((d) => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return { firstPrice, lastPrice, change, min, max };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as ChartDataPoint;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{label}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Avg:</span>{' '}
            <span className="font-medium">{formatCurrency(data.price)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Range:</span>{' '}
            {formatCurrency(data.min)} - {formatCurrency(data.max)}
          </p>
          <p>
            <span className="text-muted-foreground">Volume:</span>{' '}
            {data.volume} sales
          </p>
        </div>
      </div>
    );
  };

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No price history available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = stats && stats.change >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Price History</CardTitle>
          <div className="flex gap-1">
            {PERIODS.map(({ label, value }) => (
              <Button
                key={value}
                variant={selectedPeriod === value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {selectedPeriod === -1 ? 'All time' : `Last ${selectedPeriod} days`}:
            </span>
            <span className={cn('font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? '+' : ''}{stats.change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">
              Low: {formatCurrency(stats.min)}
            </span>
            <span className="text-muted-foreground">
              High: {formatCurrency(stats.max)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? '#22c55e' : '#ef4444'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? '#22c55e' : '#ef4444'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={60}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function PriceChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-12" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
