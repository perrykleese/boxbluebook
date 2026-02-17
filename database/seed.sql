-- =============================================================================
-- BoxBlueBook Seed Data
-- Development/Testing Data
-- =============================================================================

-- Clear existing data (be careful in production!)
-- TRUNCATE brands, lines, cigars, box_codes, transactions, price_aggregates CASCADE;

-- =============================================================================
-- BRANDS
-- =============================================================================

INSERT INTO brands (id, name, slug, country_of_origin, founded_year, description, is_active) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Arturo Fuente', 'arturo-fuente', 'Dominican Republic', 1912, 
     'One of the most respected names in premium cigars, founded by Arturo Fuente in West Tampa, Florida.', true),
    
    ('b1000000-0000-0000-0000-000000000002', 'Padron', 'padron', 'Nicaragua', 1964, 
     'Family-owned company known for box-pressed, Nicaraguan puro cigars with exceptional quality control.', true),
    
    ('b1000000-0000-0000-0000-000000000003', 'Davidoff', 'davidoff', 'Dominican Republic', 1968, 
     'Swiss luxury cigar brand known for refined, elegant blends crafted in the Dominican Republic.', true),
    
    ('b1000000-0000-0000-0000-000000000004', 'Opus X', 'opus-x', 'Dominican Republic', 1995, 
     'The legendary Dominican puro from Arturo Fuente, often considered the holy grail of cigars.', true),
    
    ('b1000000-0000-0000-0000-000000000005', 'My Father', 'my-father', 'Nicaragua', 2008, 
     'Created by the Garcia family, known for rich, complex Nicaraguan blends.', true),
    
    ('b1000000-0000-0000-0000-000000000006', 'Liga Privada', 'liga-privada', 'Nicaragua', 2008, 
     'Drew Estate''s premium line featuring rare Connecticut Broadleaf wrappers.', true);

-- =============================================================================
-- LINES
-- =============================================================================

INSERT INTO lines (id, brand_id, name, slug, description, wrapper_type, strength, is_limited_edition, is_active) VALUES
    -- Arturo Fuente Lines
    ('l1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 
     'Hemingway', 'hemingway', 'Perfecto-shaped cigars named after literary works', 'Cameroon', 'medium', false, true),
    
    ('l1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 
     'Don Carlos', 'don-carlos', 'Named after Carlos Fuente Sr., featuring African Cameroon wrapper', 'Cameroon', 'medium', false, true),
    
    ('l1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 
     'Añejo', 'anejo', 'Aged in cognac barrels, released annually', 'Connecticut Broadleaf', 'medium-full', true, true),
    
    -- Opus X Lines
    ('l1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 
     'Opus X', 'opus-x', 'The original Opus X line - all Dominican puro', 'Fuente Rosado', 'full', true, true),
    
    ('l1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 
     'Lost City', 'lost-city', 'Ultra-rare release with tobacco from Chateau de la Fuente', 'Fuente Rosado', 'full', true, true),
    
    -- Padron Lines
    ('l1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 
     '1926 Serie', '1926-serie', 'Commemorating Jose O. Padron''s birth year', 'Habano', 'full', false, true),
    
    ('l1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 
     '1964 Anniversary', '1964-anniversary', 'Celebrating 30 years of Padron', 'Habano', 'medium-full', false, true),
    
    ('l1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 
     'Family Reserve', 'family-reserve', 'Limited annual releases with extra-aged tobacco', 'Habano', 'full', true, true),
    
    -- Liga Privada Lines
    ('l1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000006', 
     'No. 9', 'no-9', 'The original Liga Privada blend', 'Connecticut Broadleaf', 'full', false, true),
    
    ('l1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000006', 
     'T52', 't52', 'Named after the stalk-cut tobacco type', 'Stalk Cut Habano', 'full', false, true);

-- =============================================================================
-- CIGARS
-- =============================================================================

INSERT INTO cigars (id, line_id, name, slug, vitola, length_inches, ring_gauge, box_count, msrp_per_cigar, wrapper, strength, flavor_notes, is_limited_edition, is_active) VALUES
    -- Opus X
    ('c1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000004', 
     'Opus X Robusto', 'robusto', 'Robusto', 5.25, 50, 29, 32.00, 
     'Fuente Rosado', 'full', ARRAY['cedar', 'pepper', 'cocoa', 'leather'], true, true),
    
    ('c1000000-0000-0000-0000-000000000002', 'l1000000-0000-0000-0000-000000000004', 
     'Opus X Super Belicoso', 'super-belicoso', 'Super Belicoso', 5.50, 52, 29, 35.00, 
     'Fuente Rosado', 'full', ARRAY['espresso', 'dark chocolate', 'spice'], true, true),
    
    ('c1000000-0000-0000-0000-000000000003', 'l1000000-0000-0000-0000-000000000004', 
     'Opus X Perfecxion No. 5', 'perfecxion-no-5', 'Perfecxion No. 5', 4.875, 40, 32, 28.00, 
     'Fuente Rosado', 'full', ARRAY['citrus', 'pepper', 'honey'], true, true),
    
    ('c1000000-0000-0000-0000-000000000004', 'l1000000-0000-0000-0000-000000000005', 
     'Lost City Robusto', 'lost-city-robusto', 'Robusto', 5.25, 50, 10, 45.00, 
     'Fuente Rosado', 'full', ARRAY['cedar', 'cream', 'spice', 'earth'], true, true),
    
    -- Padron 1926 Serie
    ('c1000000-0000-0000-0000-000000000005', 'l1000000-0000-0000-0000-000000000006', 
     'Padron 1926 No. 9', '1926-no-9', 'No. 9 (Robusto)', 5.25, 56, 24, 26.00, 
     'Habano Maduro', 'full', ARRAY['cocoa', 'coffee', 'earth', 'pepper'], false, true),
    
    ('c1000000-0000-0000-0000-000000000006', 'l1000000-0000-0000-0000-000000000006', 
     'Padron 1926 No. 1', '1926-no-1', 'No. 1 (Double Corona)', 6.75, 54, 24, 32.00, 
     'Habano Natural', 'full', ARRAY['leather', 'cedar', 'cocoa', 'nuts'], false, true),
    
    ('c1000000-0000-0000-0000-000000000007', 'l1000000-0000-0000-0000-000000000006', 
     'Padron 1926 40th Anniversary', '1926-40th', '40th Anniversary', 6.50, 54, 20, 50.00, 
     'Habano Maduro', 'full', ARRAY['dark chocolate', 'espresso', 'spice'], true, true),
    
    -- Liga Privada No. 9
    ('c1000000-0000-0000-0000-000000000008', 'l1000000-0000-0000-0000-000000000009', 
     'Liga Privada No. 9 Robusto', 'no-9-robusto', 'Robusto', 5.00, 54, 24, 18.00, 
     'Connecticut Broadleaf', 'full', ARRAY['dark chocolate', 'cream', 'earth'], false, true),
    
    ('c1000000-0000-0000-0000-000000000009', 'l1000000-0000-0000-0000-000000000009', 
     'Liga Privada No. 9 Belicoso', 'no-9-belicoso', 'Belicoso', 6.00, 52, 24, 19.00, 
     'Connecticut Broadleaf', 'full', ARRAY['coffee', 'pepper', 'leather'], false, true),
    
    -- Arturo Fuente Hemingway
    ('c1000000-0000-0000-0000-000000000010', 'l1000000-0000-0000-0000-000000000001', 
     'Hemingway Short Story', 'short-story', 'Short Story', 4.00, 49, 25, 12.00, 
     'Cameroon', 'medium', ARRAY['cedar', 'nuts', 'cream'], false, true),
    
    ('c1000000-0000-0000-0000-000000000011', 'l1000000-0000-0000-0000-000000000001', 
     'Hemingway Best Seller', 'best-seller', 'Best Seller', 4.50, 55, 25, 14.00, 
     'Cameroon', 'medium', ARRAY['cedar', 'pepper', 'cream'], false, true),
    
    ('c1000000-0000-0000-0000-000000000012', 'l1000000-0000-0000-0000-000000000001', 
     'Hemingway Masterpiece', 'masterpiece', 'Masterpiece', 9.00, 52, 10, 22.00, 
     'Cameroon', 'medium', ARRAY['wood', 'leather', 'spice'], false, true);

-- =============================================================================
-- SAMPLE PRICE AGGREGATES
-- =============================================================================

INSERT INTO price_aggregates (cigar_id, period_type, period_start, period_end, avg_price, median_price, min_price, max_price, transaction_count, total_volume, price_change_pct, cmv, cmv_confidence) VALUES
    -- Opus X Robusto prices
    ('c1000000-0000-0000-0000-000000000001', 'daily', CURRENT_DATE - 1, CURRENT_DATE, 38.50, 38.00, 32.00, 48.00, 15, 45, 2.5, 38.00, 'high'),
    ('c1000000-0000-0000-0000-000000000001', 'weekly', CURRENT_DATE - 7, CURRENT_DATE, 37.80, 37.50, 30.00, 52.00, 85, 320, 3.2, 37.80, 'high'),
    ('c1000000-0000-0000-0000-000000000001', 'monthly', CURRENT_DATE - 30, CURRENT_DATE, 36.50, 36.00, 28.00, 55.00, 340, 1250, 5.1, 36.50, 'high'),
    
    -- Padron 1926 No. 9 prices
    ('c1000000-0000-0000-0000-000000000005', 'daily', CURRENT_DATE - 1, CURRENT_DATE, 28.00, 27.50, 24.00, 34.00, 22, 88, -1.2, 28.00, 'high'),
    ('c1000000-0000-0000-0000-000000000005', 'weekly', CURRENT_DATE - 7, CURRENT_DATE, 28.30, 28.00, 23.00, 36.00, 145, 580, 0.8, 28.30, 'high'),
    
    -- Lost City Robusto (limited data)
    ('c1000000-0000-0000-0000-000000000004', 'daily', CURRENT_DATE - 1, CURRENT_DATE, 85.00, 82.00, 70.00, 110.00, 3, 6, 8.5, 85.00, 'medium'),
    ('c1000000-0000-0000-0000-000000000004', 'weekly', CURRENT_DATE - 7, CURRENT_DATE, 82.00, 80.00, 65.00, 120.00, 12, 28, 12.3, 82.00, 'medium'),
    
    -- Liga Privada No. 9
    ('c1000000-0000-0000-0000-000000000008', 'daily', CURRENT_DATE - 1, CURRENT_DATE, 19.50, 19.00, 16.00, 24.00, 35, 140, 0.5, 19.50, 'high'),
    
    -- Hemingway Short Story
    ('c1000000-0000-0000-0000-000000000010', 'daily', CURRENT_DATE - 1, CURRENT_DATE, 14.00, 13.50, 10.00, 18.00, 28, 112, -0.8, 14.00, 'high');

-- =============================================================================
-- SAMPLE TRANSACTIONS (for price history)
-- =============================================================================

INSERT INTO transactions (cigar_id, source, source_id, transaction_type, quantity, unit_price, total_price, condition, transaction_date, verified) VALUES
    -- Recent Opus X sales
    ('c1000000-0000-0000-0000-000000000001', 'ebay', 'eb-123456', 'auction', 5, 38.00, 190.00, 'new_sealed', CURRENT_DATE - 1, true),
    ('c1000000-0000-0000-0000-000000000001', 'ebay', 'eb-123457', 'buy_now', 10, 40.00, 400.00, 'new_sealed', CURRENT_DATE - 2, true),
    ('c1000000-0000-0000-0000-000000000001', 'cigarbid', 'cb-789012', 'auction', 5, 36.00, 180.00, 'new_sealed', CURRENT_DATE - 3, true),
    
    -- Padron sales
    ('c1000000-0000-0000-0000-000000000005', 'ebay', 'eb-234567', 'auction', 10, 27.50, 275.00, 'new_sealed', CURRENT_DATE - 1, true),
    ('c1000000-0000-0000-0000-000000000005', 'cigarbid', 'cb-890123', 'auction', 5, 28.00, 140.00, 'new_sealed', CURRENT_DATE - 2, true);

-- =============================================================================
-- NOTE: This is sample data for development
-- Production should have a proper data ingestion pipeline
-- =============================================================================
