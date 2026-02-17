# Feature: Competitive Price Comparison

## Overview

Real-time and cached price data from major online cigar retailers, integrated into BoxBlueBook to show market pricing alongside historical auction/secondary market data.

## Competitors Tracked

| Retailer | Code | URL | Est. Products |
|----------|------|-----|---------------|
| Famous Smoke Shop | `famous` | famous-smoke.com | ~15,000 |
| Cigars International | `ci` | cigarsinternational.com | ~10,000 |
| JR Cigars | `jr` | jrcigars.com | ~8,000 |
| Holts | `holts` | holts.com | ~3,000 |
| Atlantic Cigar | `atlantic` | atlanticcigar.com | ~2,000 |
| CigarPage | `cigarpage` | cigarpage.com | ~5,000 |

## User Experience

### Search Results
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Padron 1926 No. 2 Maduro                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RETAIL PRICES (Live)                                   │
│  ├─ Famous Smoke    $24.95/ea  ($498/box)   ✓ In Stock │
│  ├─ JR Cigars       $26.99/ea  ($539/box)   ✓ In Stock │
│  ├─ Atlantic        $25.50/ea  ($510/box)   ⚠ Low Stock│
│  └─ CI              $27.95/ea  (Out of Stock)          │
│                                                         │
│  MARKET VALUE (Secondary)                               │
│  ├─ Avg Sale Price  $22.50/ea                          │
│  ├─ 90-Day Trend    ↑ +8.2%                            │
│  └─ Last Sale       $21.00 (eBay, 3 days ago)          │
│                                                         │
│  [View Full Price History] [Set Price Alert]           │
└─────────────────────────────────────────────────────────┘
```

### Price Comparison Page (`/compare/[cigar_id]`)
- Full breakdown by retailer
- Price per stick vs box pricing
- Shipping estimates
- Historical competitor pricing chart
- "Best Deal" badge

### Price Alerts
- Notify when price drops below threshold
- Notify when back in stock
- Notify when competitor has sale

---

## Database Schema Additions

```sql
-- =============================================================================
-- COMPETITOR PRICING
-- =============================================================================

-- Competitor retailers we track
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,  -- 'famous', 'ci', 'jr', etc.
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    scrape_priority INTEGER DEFAULT 5,  -- 1=highest priority
    last_full_scrape TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current competitor prices (latest snapshot)
CREATE TABLE competitor_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID REFERENCES cigars(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Product identification
    competitor_sku VARCHAR(100),
    competitor_url VARCHAR(1000),
    product_name VARCHAR(500),  -- Their name for it
    
    -- Pricing
    price_single DECIMAL(10,2),
    price_box DECIMAL(10,2),
    box_count INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Availability
    in_stock BOOLEAN,
    stock_level VARCHAR(50),  -- 'in_stock', 'low_stock', 'out_of_stock'
    
    -- Sale info
    is_on_sale BOOLEAN DEFAULT false,
    regular_price DECIMAL(10,2),
    sale_ends_at TIMESTAMPTZ,
    
    -- Metadata
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence DECIMAL(3,2) DEFAULT 1.0,  -- Match confidence 0-1
    
    -- Composite unique constraint
    UNIQUE(cigar_id, competitor_id)
);

CREATE INDEX idx_competitor_prices_cigar ON competitor_prices(cigar_id);
CREATE INDEX idx_competitor_prices_competitor ON competitor_prices(competitor_id);
CREATE INDEX idx_competitor_prices_scraped ON competitor_prices(scraped_at);

-- Historical competitor prices (for trends)
CREATE TABLE competitor_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID REFERENCES cigars(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    price_single DECIMAL(10,2),
    price_box DECIMAL(10,2),
    in_stock BOOLEAN,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_cigar_date ON competitor_price_history(cigar_id, recorded_at DESC);

-- Product matching table (maps competitor SKUs to our cigars)
CREATE TABLE competitor_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(100),
    competitor_url VARCHAR(1000) NOT NULL,
    competitor_product_name VARCHAR(500),
    match_confidence DECIMAL(3,2) DEFAULT 1.0,  -- 0-1, how sure are we this is the same product
    is_verified BOOLEAN DEFAULT false,  -- Manually verified match
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(competitor_id, competitor_url)
);

CREATE INDEX idx_mappings_cigar ON competitor_product_mappings(cigar_id);
CREATE INDEX idx_mappings_competitor ON competitor_product_mappings(competitor_id);
```

---

## API Routes

### GET `/api/prices/compare/[cigar_id]`

Returns current prices from all competitors for a specific cigar.

**Response:**
```json
{
  "cigar": {
    "id": "uuid",
    "name": "Padron 1926 No. 2",
    "brand": "Padron",
    "vitola": "Belicoso"
  },
  "competitors": [
    {
      "code": "famous",
      "name": "Famous Smoke Shop",
      "price_single": 24.95,
      "price_box": 498.00,
      "box_count": 24,
      "in_stock": true,
      "is_on_sale": false,
      "url": "https://www.famous-smoke.com/padron-1926...",
      "scraped_at": "2026-02-16T19:00:00Z"
    },
    // ...more competitors
  ],
  "best_price": {
    "competitor": "famous",
    "price_single": 24.95,
    "savings_vs_avg": "12%"
  },
  "market_value": {
    "avg_sale": 22.50,
    "trend_90d": 8.2,
    "last_sale": {
      "price": 21.00,
      "source": "ebay",
      "date": "2026-02-13"
    }
  }
}
```

### POST `/api/prices/scrape`

Triggers a scrape for specific cigars or competitors (admin/cron only).

**Request:**
```json
{
  "cigar_ids": ["uuid1", "uuid2"],  // Optional: specific cigars
  "competitor_codes": ["famous", "jr"],  // Optional: specific competitors
  "force_refresh": false  // Skip cache
}
```

### GET `/api/prices/history/[cigar_id]`

Returns historical competitor pricing for charts.

**Query params:**
- `competitor` - Filter to specific competitor
- `days` - Number of days (default 90)

---

## Scraping Integration

### Zyte API Integration (`/src/lib/zyte.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const ZYTE_API_KEY = process.env.ZYTE_API_KEY;
const ZYTE_API_URL = 'https://api.zyte.com/v1/extract';

interface ZyteProduct {
  name: string;
  price: number;
  currency: string;
  availability: string;
  sku?: string;
  url: string;
  regularPrice?: number;
}

export async function scrapeCompetitorProduct(url: string): Promise<ZyteProduct | null> {
  const auth = Buffer.from(`${ZYTE_API_KEY}:`).toString('base64');
  
  const response = await fetch(ZYTE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      browserHtml: true,
      product: true,
      productOptions: { extractFrom: 'browserHtml' },
    }),
  });

  if (!response.ok) {
    console.error(`Zyte error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.product;
}

export async function scrapeCompetitorProductList(url: string): Promise<ZyteProduct[]> {
  const auth = Buffer.from(`${ZYTE_API_KEY}:`).toString('base64');
  
  const response = await fetch(ZYTE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      browserHtml: true,
      productList: true,
      productListOptions: { extractFrom: 'browserHtml' },
    }),
  });

  if (!response.ok) {
    console.error(`Zyte error: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.productList?.products || [];
}
```

### Cron Job (Vercel)

```typescript
// /api/cron/scrape-prices/route.ts

import { scrapeCompetitorProductList } from '@/lib/zyte';
import { supabase } from '@/lib/supabase';

const COMPETITOR_URLS = {
  famous: 'https://www.famous-smoke.com/cigars',
  ci: 'https://www.cigarsinternational.com/shop/cigars/',
  jr: 'https://www.jrcigars.com/cigars',
  // ...
};

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results = [];

  for (const [code, url] of Object.entries(COMPETITOR_URLS)) {
    try {
      const products = await scrapeCompetitorProductList(url);
      results.push({ competitor: code, count: products.length });
      
      // Store in database...
      // Match to our products...
      // Update competitor_prices table...
      
    } catch (error) {
      results.push({ competitor: code, error: error.message });
    }
  }

  return Response.json({ success: true, results });
}
```

---

## Product Matching Strategy

### 1. Exact Match
- SKU matching (where available)
- UPC/barcode matching

### 2. Fuzzy Match
- Normalize product names
- Match: Brand + Line + Vitola + Box Count
- Use pg_trgm for similarity scoring

### 3. Manual Review Queue
- Low-confidence matches flagged for review
- Admin UI to verify/correct mappings

```sql
-- Fuzzy matching function
CREATE OR REPLACE FUNCTION match_competitor_product(
  p_competitor_name TEXT,
  p_similarity_threshold DECIMAL DEFAULT 0.6
) RETURNS TABLE (
  cigar_id UUID,
  cigar_name TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    similarity(c.full_name, p_competitor_name) as sim
  FROM cigars c
  WHERE similarity(c.full_name, p_competitor_name) > p_similarity_threshold
  ORDER BY sim DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

---

## Monetization

| Tier | Price Comparisons | Features |
|------|-------------------|----------|
| **Free** | 3/day | Basic comparison, no alerts |
| **Pro** ($9/mo) | Unlimited | Price alerts, history, API (100 calls) |
| **Dealer** ($49/mo) | Unlimited | Bulk API, export, white-label |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add database tables
- [ ] Create Zyte integration library
- [ ] Build `/api/prices/compare` route
- [ ] Seed competitors table

### Phase 2: Scraping Pipeline (Week 2)
- [ ] Build product matching algorithm
- [ ] Create cron job for daily scrapes
- [ ] Admin UI for match verification
- [ ] Historical price storage

### Phase 3: UI Integration (Week 3)
- [ ] Price comparison component
- [ ] Cigar detail page integration
- [ ] Price history charts
- [ ] "Best Deal" badges in search

### Phase 4: Alerts & Polish (Week 4)
- [ ] Price alert system
- [ ] Email notifications
- [ ] Usage metering for tiers
- [ ] Performance optimization

---

## Files to Create/Modify

```
boxbluebook/
├── database/
│   └── migrations/
│       └── 002_competitor_pricing.sql   # NEW
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── prices/
│   │       │   ├── compare/[cigarId]/route.ts   # NEW
│   │       │   ├── history/[cigarId]/route.ts   # NEW
│   │       │   └── scrape/route.ts              # NEW
│   │       └── cron/
│   │           └── scrape-prices/route.ts       # NEW
│   ├── components/
│   │   └── price/
│   │       ├── PriceComparison.tsx              # NEW
│   │       ├── CompetitorPriceCard.tsx          # NEW
│   │       └── PriceHistoryChart.tsx            # MODIFY
│   ├── lib/
│   │   ├── zyte.ts                              # NEW
│   │   └── product-matching.ts                  # NEW
│   └── types/
│       └── competitor.ts                        # NEW
└── docs/
    └── FEATURE-PRICE-COMPARISON.md              # THIS FILE
```
