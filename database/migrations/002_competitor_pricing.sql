-- =============================================================================
-- BoxBlueBook: Competitor Pricing Feature
-- Migration: 002_competitor_pricing
-- =============================================================================

-- Competitor retailers we track
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    scrape_priority INTEGER DEFAULT 5,
    last_full_scrape TIMESTAMPTZ,
    avg_response_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current competitor prices (latest snapshot per cigar+competitor)
CREATE TABLE competitor_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID REFERENCES cigars(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    
    -- Product identification
    competitor_sku VARCHAR(100),
    competitor_url VARCHAR(1000),
    product_name VARCHAR(500),
    
    -- Pricing
    price_single DECIMAL(10,2),
    price_box DECIMAL(10,2),
    box_count INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Availability
    in_stock BOOLEAN,
    stock_level VARCHAR(50),
    
    -- Sale info
    is_on_sale BOOLEAN DEFAULT false,
    regular_price DECIMAL(10,2),
    sale_ends_at TIMESTAMPTZ,
    
    -- Ratings
    rating DECIMAL(2,1),
    review_count INTEGER,
    
    -- Metadata
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    match_confidence DECIMAL(3,2) DEFAULT 1.0,
    is_verified BOOLEAN DEFAULT false,
    
    UNIQUE(cigar_id, competitor_id)
);

CREATE INDEX idx_competitor_prices_cigar ON competitor_prices(cigar_id);
CREATE INDEX idx_competitor_prices_competitor ON competitor_prices(competitor_id);
CREATE INDEX idx_competitor_prices_scraped ON competitor_prices(scraped_at DESC);
CREATE INDEX idx_competitor_prices_in_stock ON competitor_prices(in_stock) WHERE in_stock = true;

-- Historical competitor prices (for trend charts)
CREATE TABLE competitor_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID REFERENCES cigars(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    price_single DECIMAL(10,2),
    price_box DECIMAL(10,2),
    in_stock BOOLEAN,
    is_on_sale BOOLEAN DEFAULT false,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for efficient querying (optional, for scale)
CREATE INDEX idx_price_history_lookup ON competitor_price_history(cigar_id, competitor_id, recorded_at DESC);
CREATE INDEX idx_price_history_date ON competitor_price_history(recorded_at DESC);

-- Product matching table (maps competitor products to our cigars)
CREATE TABLE competitor_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cigar_id UUID REFERENCES cigars(id) ON DELETE SET NULL,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(100),
    competitor_url VARCHAR(1000) NOT NULL,
    competitor_product_name VARCHAR(500),
    
    -- Extracted data
    extracted_brand VARCHAR(255),
    extracted_line VARCHAR(255),
    extracted_vitola VARCHAR(100),
    extracted_box_count INTEGER,
    
    -- Matching
    match_confidence DECIMAL(3,2),
    match_method VARCHAR(50),  -- 'exact_sku', 'fuzzy_name', 'manual'
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    -- Status
    needs_review BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(competitor_id, competitor_url)
);

CREATE INDEX idx_mappings_cigar ON competitor_product_mappings(cigar_id);
CREATE INDEX idx_mappings_competitor ON competitor_product_mappings(competitor_id);
CREATE INDEX idx_mappings_needs_review ON competitor_product_mappings(needs_review) WHERE needs_review = true;
CREATE INDEX idx_mappings_unmatched ON competitor_product_mappings(cigar_id) WHERE cigar_id IS NULL;

-- Price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cigar_id UUID NOT NULL REFERENCES cigars(id) ON DELETE CASCADE,
    
    -- Alert conditions
    alert_type VARCHAR(50) NOT NULL,  -- 'price_drop', 'back_in_stock', 'sale'
    target_price DECIMAL(10,2),  -- For price_drop alerts
    competitor_id UUID REFERENCES competitors(id),  -- NULL = any competitor
    
    -- State
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, cigar_id, alert_type, competitor_id)
);

CREATE INDEX idx_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_alerts_cigar ON price_alerts(cigar_id);
CREATE INDEX idx_alerts_active ON price_alerts(is_active) WHERE is_active = true;

-- Scrape jobs (for tracking/debugging)
CREATE TABLE scrape_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id),
    job_type VARCHAR(50) NOT NULL,  -- 'full_catalog', 'price_update', 'single_product'
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    
    -- Stats
    products_scraped INTEGER DEFAULT 0,
    products_matched INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Details
    error_message TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_competitor ON scrape_jobs(competitor_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- =============================================================================
-- SEED DATA: Competitors
-- =============================================================================

INSERT INTO competitors (code, name, base_url, scrape_priority) VALUES
    ('famous', 'Famous Smoke Shop', 'https://www.famous-smoke.com', 1),
    ('ci', 'Cigars International', 'https://www.cigarsinternational.com', 2),
    ('jr', 'JR Cigars', 'https://www.jrcigars.com', 3),
    ('holts', 'Holts', 'https://www.holts.com', 4),
    ('atlantic', 'Atlantic Cigar', 'https://www.atlanticcigar.com', 5),
    ('cigarpage', 'CigarPage', 'https://www.cigarpage.com', 6);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to find matching cigars for a competitor product name
CREATE OR REPLACE FUNCTION match_competitor_product(
    p_product_name TEXT,
    p_similarity_threshold DECIMAL DEFAULT 0.5
) RETURNS TABLE (
    cigar_id UUID,
    cigar_full_name TEXT,
    brand_name TEXT,
    similarity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.full_name,
        b.name as brand,
        similarity(c.full_name, p_product_name)::DECIMAL as sim
    FROM cigars c
    JOIN lines l ON c.line_id = l.id
    JOIN brands b ON l.brand_id = b.id
    WHERE c.is_active = true
      AND similarity(c.full_name, p_product_name) > p_similarity_threshold
    ORDER BY sim DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get best price for a cigar
CREATE OR REPLACE FUNCTION get_best_price(p_cigar_id UUID)
RETURNS TABLE (
    competitor_code VARCHAR,
    competitor_name VARCHAR,
    price_single DECIMAL,
    price_box DECIMAL,
    in_stock BOOLEAN,
    competitor_url VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        comp.code,
        comp.name,
        cp.price_single,
        cp.price_box,
        cp.in_stock,
        cp.competitor_url
    FROM competitor_prices cp
    JOIN competitors comp ON cp.competitor_id = comp.id
    WHERE cp.cigar_id = p_cigar_id
      AND cp.in_stock = true
      AND cp.price_single IS NOT NULL
    ORDER BY cp.price_single ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to archive prices to history (call before updating)
CREATE OR REPLACE FUNCTION archive_competitor_price()
RETURNS TRIGGER AS $$
BEGIN
    -- Only archive if price actually changed
    IF OLD.price_single IS DISTINCT FROM NEW.price_single 
       OR OLD.price_box IS DISTINCT FROM NEW.price_box
       OR OLD.in_stock IS DISTINCT FROM NEW.in_stock THEN
        INSERT INTO competitor_price_history (
            cigar_id, competitor_id, price_single, price_box, in_stock, is_on_sale, recorded_at
        ) VALUES (
            OLD.cigar_id, OLD.competitor_id, OLD.price_single, OLD.price_box, 
            OLD.in_stock, OLD.is_on_sale, OLD.scraped_at
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_competitor_price
    BEFORE UPDATE ON competitor_prices
    FOR EACH ROW
    EXECUTE FUNCTION archive_competitor_price();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Public read for competitor info and prices
CREATE POLICY "Competitors are publicly readable"
    ON competitors FOR SELECT TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Competitor prices are publicly readable"
    ON competitor_prices FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Price history is publicly readable"
    ON competitor_price_history FOR SELECT TO authenticated, anon
    USING (true);

-- Price alerts: users can only see/manage their own
CREATE POLICY "Users can view own alerts"
    ON price_alerts FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
    ON price_alerts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
    ON price_alerts FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON price_alerts FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
