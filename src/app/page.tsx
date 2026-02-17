import Link from 'next/link';
import { TrendingUp, TrendingDown, Search, BookOpen, BarChart3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/search/SearchBar';

// Placeholder data - will be replaced with API calls
const FEATURED_CIGARS = [
  {
    id: '1',
    name: 'Opus X Robusto',
    brand: 'Arturo Fuente',
    cmv: 38.00,
    change: 2.5,
    image: null,
  },
  {
    id: '2',
    name: 'Padron 1926 No. 9',
    brand: 'Padron',
    cmv: 28.00,
    change: -1.2,
    image: null,
  },
  {
    id: '3',
    name: 'Liga Privada No. 9',
    brand: 'Drew Estate',
    cmv: 19.50,
    change: 0.5,
    image: null,
  },
  {
    id: '4',
    name: 'Lost City Robusto',
    brand: 'Opus X',
    cmv: 85.00,
    change: 8.5,
    image: null,
  },
];

const TOP_MOVERS = {
  gainers: [
    { name: 'Opus X Lost City Piramide', change: 15.2, cmv: 120.00 },
    { name: 'Padron Family Reserve 50', change: 12.8, cmv: 75.00 },
    { name: 'Davidoff Year of the Dragon', change: 11.5, cmv: 95.00 },
  ],
  losers: [
    { name: 'Aging Room Quattro T59', change: -8.5, cmv: 12.00 },
    { name: 'Oliva Serie V Melanio', change: -5.2, cmv: 14.50 },
    { name: 'My Father Le Bijou 1922', change: -4.1, cmv: 16.00 },
  ],
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Trusted by 10,000+ collectors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Know What Your Cigars Are{' '}
              <span className="text-primary">Really Worth</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              The authoritative price guide for collectible cigars. Track market values,
              discover trends, and make informed decisions.
            </p>
            <div className="max-w-xl mx-auto">
              <SearchBar placeholder="Search for Opus X, Padron, Liga Privada..." />
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/search">
                <Button size="lg" className="gap-2">
                  <Search className="h-4 w-4" />
                  Browse Cigars
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Cigars Tracked', value: '15,000+' },
              { label: 'Price Updates', value: 'Daily' },
              { label: 'Data Points', value: '2M+' },
              { label: 'Active Users', value: '10,000+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cigars */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Cigars</h2>
            <Link href="/search?featured=true">
              <Button variant="ghost">View All →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_CIGARS.map(cigar => (
              <Link key={cigar.id} href={`/cigar/${cigar.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <div className="h-40 bg-muted rounded-t-lg flex items-center justify-center">
                    <span className="text-4xl">🚬</span>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{cigar.brand}</p>
                    <h3 className="font-semibold mb-2">{cigar.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">${cigar.cmv.toFixed(2)}</span>
                      <span className={`flex items-center gap-1 text-sm ${cigar.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cigar.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {cigar.change >= 0 ? '+' : ''}{cigar.change}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Market Movers */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Market Movers</h2>
            <Link href="/trending">
              <Button variant="ghost">View Trends →</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Top Gainers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Top Gainers (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {TOP_MOVERS.gainers.map((cigar, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{cigar.name}</p>
                        <p className="text-sm text-muted-foreground">${cigar.cmv.toFixed(2)}</p>
                      </div>
                      <Badge variant="success">+{cigar.change}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Losers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Top Decliners (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {TOP_MOVERS.losers.map((cigar, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{cigar.name}</p>
                        <p className="text-sm text-muted-foreground">${cigar.cmv.toFixed(2)}</p>
                      </div>
                      <Badge variant="destructive">{cigar.change}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Everything You Need to Track Cigar Values
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              BoxBlueBook combines real-time market data, historical trends, and expert analysis
              to give you the most accurate cigar valuations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Real-Time Pricing',
                description: 'Track current market values with data from eBay, CigarBid, and major retailers.',
              },
              {
                icon: TrendingUp,
                title: 'Price History',
                description: 'See how prices have changed over time with detailed historical charts.',
              },
              {
                icon: Star,
                title: 'Collection Tracking',
                description: 'Build and track your humidor with automatic portfolio valuation.',
              },
            ].map(feature => (
              <Card key={feature.title} className="text-center p-6">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Know Your Cigars&apos; Value?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of collectors who trust BoxBlueBook for accurate cigar pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View Pro Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
