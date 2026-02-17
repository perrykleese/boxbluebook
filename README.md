# BoxBlueBook.com

The authoritative price guide for collectible cigars.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Search**: Meilisearch
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- Meilisearch instance (for search)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/boxbluebook/boxbluebook.git
cd boxbluebook
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your credentials:
- Supabase URL and keys
- Meilisearch host and keys

5. Set up the database:
```bash
# In Supabase SQL Editor, run:
# database/schema.sql (creates tables, indexes, RLS)
# database/seed.sql (optional: adds sample data)
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
boxbluebook/
├── database/
│   ├── schema.sql      # Database schema (tables, indexes, RLS)
│   └── seed.sql        # Sample data for development
├── public/
│   └── images/         # Static images
├── src/
│   ├── app/
│   │   ├── api/        # API routes
│   │   │   ├── cigars/
│   │   │   ├── brands/
│   │   │   ├── search/
│   │   │   └── market/
│   │   ├── cigar/[id]/ # Cigar detail page
│   │   ├── search/     # Search page
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── components/
│   │   ├── common/     # Shared components (CigarCard)
│   │   ├── layout/     # Header, Footer
│   │   ├── price/      # PriceCard, PriceChart
│   │   ├── search/     # SearchBar
│   │   └── ui/         # shadcn/ui primitives
│   ├── hooks/          # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts # Supabase client
│   │   ├── meilisearch.ts # Search client
│   │   └── utils.ts    # Utility functions
│   └── types/
│       ├── index.ts    # Application types
│       └── database.ts # Supabase generated types
├── .env.local.example  # Environment template
├── tailwind.config.ts  # Tailwind configuration
├── vercel.json         # Vercel deployment config
└── README.md
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cigars` | GET | List/search cigars |
| `/api/cigars/[id]` | GET | Get cigar details |
| `/api/cigars/[id]/prices` | GET | Get price history |
| `/api/brands` | GET | List all brands |
| `/api/search` | GET | Autocomplete search |
| `/api/market/trends` | GET | Market trends |

### Query Parameters

**GET /api/cigars**
- `q` - Search query
- `brand_id` - Filter by brand
- `strength` - Filter by strength
- `limited` - Filter limited editions
- `sort_by` - Sort field (name, price, price_change)
- `sort_order` - Sort direction (asc, desc)
- `page` - Page number
- `limit` - Results per page (max 100)

**GET /api/cigars/[id]/prices**
- `period` - Period type (daily, weekly, monthly)
- `start_date` - Start date filter
- `end_date` - End date filter
- `limit` - Number of records

**GET /api/market/trends**
- `period` - Time period (7d, 30d, 90d, 1y)
- `direction` - Trend direction (up, down, both)
- `category` - Category (gainers, losers, volume)
- `limit` - Number of results

## Database Schema

### Core Tables
- `brands` - Cigar manufacturers
- `lines` - Product lines within brands
- `cigars` - Individual SKUs/vitolas
- `box_codes` - Box date codes for vintage tracking

### Pricing Tables
- `transactions` - Raw sale data from sources
- `price_aggregates` - Computed price statistics

### User Tables
- `users` - User profiles (extends Supabase Auth)
- `watchlist_items` - Price alerts
- `portfolio_items` - Collection tracking

## Development

### Adding New Components

Using shadcn/ui:
```bash
npx shadcn-ui@latest add [component-name]
```

### Database Migrations

Create migrations in `database/migrations/` and run in Supabase SQL Editor.

### Testing

```bash
npm run lint
npm run type-check
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### Environment Variables (Production)

Required in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MEILISEARCH_HOST`
- `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY`
- `MEILISEARCH_ADMIN_KEY`

## Roadmap

- [ ] User authentication
- [ ] Watchlist with price alerts
- [ ] Portfolio tracking
- [ ] Mobile app
- [ ] Data scraping pipeline
- [ ] Dealer/API subscriptions

## License

Proprietary - All rights reserved.
