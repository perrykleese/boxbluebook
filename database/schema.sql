-- =============================================================================
-- BoxBlueBook Database Schema
-- Supabase/PostgreSQL
-- Version: 1.0.0
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE strength_level AS ENUM ('mild', 'mild-medium', 'medium', 'medium-full', 'full');
CREATE TYPE body_level AS ENUM ('light', 'light-medium', 'medium', 'medium-full', 'full');
CREATE TYPE transaction_source AS ENUM ('ebay', 'cigarbid', 'cbid', 'foxcigar', 'manual', 'user_reported');
CREATE TYPE transaction_type AS ENUM ('sale', 'auction', 'buy_now', 'offer_accepted');
CREATE TYPE cigar_condition AS ENUM ('new_sealed', 'new_opened', 'aged', 'vintage', 'unknown');
CREATE TYPE period_type AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low', 'insufficient_data');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'dealer');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Brands
-- -----------------------------------------------------------------------------
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    country_of_origin VARCHAR(100),
    founded_year INTEGER,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- Lines (Product Lines within a Brand)
-- -----------------------------------------------------------------------------
CREATE TABLE lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    wrapper_type VARCHAR(100),
    strength strength_level,
    is_limited_edition BOOLEAN DEFAULT false,
    release_year INTEGER,
    is_discontinued BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id, slug)
);

CREATE INDEX idx_lines_brand ON lines(brand_id);
CREATE INDEX idx_lines_slug ON lines(slug);
CREATE INDEX idx_lines_active ON lines(is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- Cigars (Individual SKUs/Vitolas)
-- -----------------------------------------------------------------------------
CREATE TABLE cigars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,  -- "Brand - Line - Vitola" for search
    vitola VARCHAR(100) NOT NULL,
    length_inches DECIMAL(4,2),
    ring_gauge INTEGER,
    box_count INTEGER,
    msrp_per_cigar DECIMAL(10,2),
    msrp_per_box DECIMAL(10,2),
    wrapper VARCHAR(100),
    binder VARCHAR(100),
    filler TEXT,
    strength strength_level,
    body body_level,
    flavor_notes TEXT[],
    description TEXT,
    image_url VARCHAR(500),
    is_limited_edition BOOLEAN DEFAULT false,
    is_discontinued BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(line_id, slug)
);

CREATE INDEX idx_cigars_line ON cigars(line_id);
CREATE INDEX idx_cigars_slug ON cigars(slug);
CREATE INDEX idx_cigars_full_name ON cigars USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_cigars_vitola ON cigars(vitola);
CREATE INDEX idx_cigars_strength ON cigars(strength);
CREATE INDEX idx_cigars_active ON cigars(is_active) WHERE is_active = true;
CREATE INDEX idx_cigars_limited ON cigars(is_limited_edition) WHERE is_limited_edition = true;

-- -----------------------------------------------------------------------------
-- Box Codes (For aging/vintage tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE box_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    box_date DATE,
    factory_code VARCHAR(20),
    notes TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cigar_id, code)
);

CREATE INDEX idx_box_codes_cigar ON box_codes(cigar_id);
CREATE INDEX idx_box_codes_date ON box_codes(box_date);
CREATE INDEX idx_box_codes_code ON box_codes(code);

-- =============================================================================
-- PRICING & TRANSACTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transactions (Raw price data from sales)
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    source transaction_source NOT NULL,
    source_id VARCHAR(255),  -- External ID (eBay listing ID, etc.)
    source_url VARCHAR(1000),
    transaction_type transaction_type NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    condition cigar_condition DEFAULT 'unknown',
    box_code_id UUID REFERENCES box_codes(id),
    transaction_date TIMESTAMPTZ NOT NULL,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate transactions
    UNIQUE(source, source_id)
);

CREATE INDEX idx_transactions_cigar ON transactions(cigar_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_source ON transactions(source);
CREATE INDEX idx_transactions_verified ON transactions(verified) WHERE verified = true;
CREATE INDEX idx_transactions_cigar_date ON transactions(cigar_id, transaction_date DESC);

-- -----------------------------------------------------------------------------
-- Price Aggregates (Pre-computed price statistics)
-- -----------------------------------------------------------------------------
CREATE TABLE price_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_price DECIMAL(10,2) NOT NULL,
    median_price DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    total_volume INTEGER NOT NULL DEFAULT 0,  -- Total cigars sold
    price_change_pct DECIMAL(6,2),  -- % change from previous period
    cmv DECIMAL(10,2) NOT NULL,  -- Current Market Value (our best estimate)
    cmv_confidence confidence_level DEFAULT 'insufficient_data',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cigar_id, period_type, period_start)
);

CREATE INDEX idx_price_agg_cigar ON price_aggregates(cigar_id);
CREATE INDEX idx_price_agg_period ON price_aggregates(period_type, period_start);
CREATE INDEX idx_price_agg_cigar_period ON price_aggregates(cigar_id, period_type, period_start DESC);
CREATE INDEX idx_price_agg_cmv ON price_aggregates(cmv);
CREATE INDEX idx_price_agg_change ON price_aggregates(price_change_pct);

-- =============================================================================
-- USER TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users (Extends Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{
        "default_currency": "USD",
        "notifications_enabled": true,
        "price_alert_threshold": 10,
        "favorite_brands": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- -----------------------------------------------------------------------------
-- Watchlist Items
-- -----------------------------------------------------------------------------
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    target_price DECIMAL(10,2),
    alert_on_price_drop BOOLEAN DEFAULT true,
    alert_on_new_listing BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, cigar_id)
);

CREATE INDEX idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX idx_watchlist_cigar ON watchlist_items(cigar_id);
CREATE INDEX idx_watchlist_alerts ON watchlist_items(alert_on_price_drop) WHERE alert_on_price_drop = true;

-- -----------------------------------------------------------------------------
-- Portfolio Items (User's collection)
-- -----------------------------------------------------------------------------
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    box_code_id UUID REFERENCES box_codes(id),
    storage_location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_cigar ON portfolio_items(cigar_id);
CREATE INDEX idx_portfolio_user_created ON portfolio_items(user_id, created_at DESC);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lines_updated_at
    BEFORE UPDATE ON lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cigars_updated_at
    BEFORE UPDATE ON cigars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_aggregates_updated_at
    BEFORE UPDATE ON price_aggregates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Auto-generate full_name for cigars
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_cigar_full_name()
RETURNS TRIGGER AS $$
DECLARE
    brand_name VARCHAR(255);
    line_name VARCHAR(255);
BEGIN
    SELECT b.name, l.name INTO brand_name, line_name
    FROM lines l
    JOIN brands b ON l.brand_id = b.id
    WHERE l.id = NEW.line_id;
    
    NEW.full_name = CONCAT(brand_name, ' ', line_name, ' ', NEW.vitola);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_cigar_full_name
    BEFORE INSERT OR UPDATE OF line_id, vitola ON cigars
    FOR EACH ROW EXECUTE FUNCTION generate_cigar_full_name();

-- -----------------------------------------------------------------------------
-- Create user profile on auth signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cigars ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Public read access for product data
CREATE POLICY "Public read access for brands"
    ON brands FOR SELECT USING (true);

CREATE POLICY "Public read access for lines"
    ON lines FOR SELECT USING (true);

CREATE POLICY "Public read access for cigars"
    ON cigars FOR SELECT USING (true);

CREATE POLICY "Public read access for box_codes"
    ON box_codes FOR SELECT USING (true);

CREATE POLICY "Public read access for price_aggregates"
    ON price_aggregates FOR SELECT USING (true);

-- Verified transactions are public
CREATE POLICY "Public read access for verified transactions"
    ON transactions FOR SELECT USING (verified = true);

-- User data policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE USING (auth.uid() = id);

-- Watchlist policies
CREATE POLICY "Users can view own watchlist"
    ON watchlist_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items"
    ON watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items"
    ON watchlist_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items"
    ON watchlist_items FOR DELETE USING (auth.uid() = user_id);

-- Portfolio policies
CREATE POLICY "Users can view own portfolio"
    ON portfolio_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio items"
    ON portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio items"
    ON portfolio_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio items"
    ON portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View for current prices (latest daily aggregate)
CREATE OR REPLACE VIEW current_prices AS
SELECT DISTINCT ON (cigar_id)
    cigar_id,
    cmv,
    avg_price,
    median_price,
    min_price,
    max_price,
    price_change_pct,
    cmv_confidence,
    transaction_count,
    period_start as price_date
FROM price_aggregates
WHERE period_type = 'daily'
ORDER BY cigar_id, period_start DESC;

-- View for trending cigars
CREATE OR REPLACE VIEW trending_cigars AS
SELECT 
    c.*,
    cp.cmv,
    cp.price_change_pct,
    cp.cmv_confidence
FROM cigars c
JOIN current_prices cp ON c.id = cp.cigar_id
WHERE c.is_active = true
  AND cp.cmv_confidence IN ('high', 'medium')
ORDER BY ABS(cp.price_change_pct) DESC;

-- =============================================================================
-- SEED DATA STRUCTURE (Example data for development)
-- =============================================================================

-- Note: Run this separately for development/testing
-- INSERT INTO brands (name, slug, country_of_origin, founded_year, description)
-- VALUES 
--     ('Arturo Fuente', 'arturo-fuente', 'Dominican Republic', 1912, 'Premium Dominican cigars since 1912'),
--     ('Padron', 'padron', 'Nicaragua', 1964, 'Box-pressed Nicaraguan excellence'),
--     ('Davidoff', 'davidoff', 'Dominican Republic', 1968, 'Luxury Swiss cigar brand');
