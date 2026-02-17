// =============================================================================
// Database Types (Generated from Supabase schema)
// Run `npx supabase gen types typescript` to regenerate
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          country_of_origin: string | null
          founded_year: number | null
          description: string | null
          logo_url: string | null
          website_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          country_of_origin?: string | null
          founded_year?: number | null
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          country_of_origin?: string | null
          founded_year?: number | null
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lines: {
        Row: {
          id: string
          brand_id: string
          name: string
          slug: string
          description: string | null
          wrapper_type: string | null
          strength: Database['public']['Enums']['strength_level'] | null
          is_limited_edition: boolean
          release_year: number | null
          is_discontinued: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          slug: string
          description?: string | null
          wrapper_type?: string | null
          strength?: Database['public']['Enums']['strength_level'] | null
          is_limited_edition?: boolean
          release_year?: number | null
          is_discontinued?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          slug?: string
          description?: string | null
          wrapper_type?: string | null
          strength?: Database['public']['Enums']['strength_level'] | null
          is_limited_edition?: boolean
          release_year?: number | null
          is_discontinued?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lines_brand_id_fkey'
            columns: ['brand_id']
            referencedRelation: 'brands'
            referencedColumns: ['id']
          }
        ]
      }
      cigars: {
        Row: {
          id: string
          line_id: string
          name: string
          slug: string
          full_name: string
          vitola: string
          length_inches: number | null
          ring_gauge: number | null
          box_count: number | null
          msrp_per_cigar: number | null
          msrp_per_box: number | null
          wrapper: string | null
          binder: string | null
          filler: string | null
          strength: Database['public']['Enums']['strength_level'] | null
          body: Database['public']['Enums']['body_level'] | null
          flavor_notes: string[]
          description: string | null
          image_url: string | null
          is_limited_edition: boolean
          is_discontinued: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_id: string
          name: string
          slug: string
          full_name?: string
          vitola: string
          length_inches?: number | null
          ring_gauge?: number | null
          box_count?: number | null
          msrp_per_cigar?: number | null
          msrp_per_box?: number | null
          wrapper?: string | null
          binder?: string | null
          filler?: string | null
          strength?: Database['public']['Enums']['strength_level'] | null
          body?: Database['public']['Enums']['body_level'] | null
          flavor_notes?: string[]
          description?: string | null
          image_url?: string | null
          is_limited_edition?: boolean
          is_discontinued?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_id?: string
          name?: string
          slug?: string
          full_name?: string
          vitola?: string
          length_inches?: number | null
          ring_gauge?: number | null
          box_count?: number | null
          msrp_per_cigar?: number | null
          msrp_per_box?: number | null
          wrapper?: string | null
          binder?: string | null
          filler?: string | null
          strength?: Database['public']['Enums']['strength_level'] | null
          body?: Database['public']['Enums']['body_level'] | null
          flavor_notes?: string[]
          description?: string | null
          image_url?: string | null
          is_limited_edition?: boolean
          is_discontinued?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cigars_line_id_fkey'
            columns: ['line_id']
            referencedRelation: 'lines'
            referencedColumns: ['id']
          }
        ]
      }
      box_codes: {
        Row: {
          id: string
          cigar_id: string
          code: string
          box_date: string | null
          factory_code: string | null
          notes: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          cigar_id: string
          code: string
          box_date?: string | null
          factory_code?: string | null
          notes?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          cigar_id?: string
          code?: string
          box_date?: string | null
          factory_code?: string | null
          notes?: string | null
          verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'box_codes_cigar_id_fkey'
            columns: ['cigar_id']
            referencedRelation: 'cigars'
            referencedColumns: ['id']
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          cigar_id: string
          source: Database['public']['Enums']['transaction_source']
          source_id: string | null
          source_url: string | null
          transaction_type: Database['public']['Enums']['transaction_type']
          quantity: number
          unit_price: number
          total_price: number
          condition: Database['public']['Enums']['cigar_condition']
          box_code_id: string | null
          transaction_date: string
          scraped_at: string
          verified: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cigar_id: string
          source: Database['public']['Enums']['transaction_source']
          source_id?: string | null
          source_url?: string | null
          transaction_type: Database['public']['Enums']['transaction_type']
          quantity?: number
          unit_price: number
          total_price: number
          condition?: Database['public']['Enums']['cigar_condition']
          box_code_id?: string | null
          transaction_date: string
          scraped_at?: string
          verified?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cigar_id?: string
          source?: Database['public']['Enums']['transaction_source']
          source_id?: string | null
          source_url?: string | null
          transaction_type?: Database['public']['Enums']['transaction_type']
          quantity?: number
          unit_price?: number
          total_price?: number
          condition?: Database['public']['Enums']['cigar_condition']
          box_code_id?: string | null
          transaction_date?: string
          scraped_at?: string
          verified?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_cigar_id_fkey'
            columns: ['cigar_id']
            referencedRelation: 'cigars'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_box_code_id_fkey'
            columns: ['box_code_id']
            referencedRelation: 'box_codes'
            referencedColumns: ['id']
          }
        ]
      }
      price_aggregates: {
        Row: {
          id: string
          cigar_id: string
          period_type: Database['public']['Enums']['period_type']
          period_start: string
          period_end: string
          avg_price: number
          median_price: number
          min_price: number
          max_price: number
          transaction_count: number
          total_volume: number
          price_change_pct: number | null
          cmv: number
          cmv_confidence: Database['public']['Enums']['confidence_level']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cigar_id: string
          period_type: Database['public']['Enums']['period_type']
          period_start: string
          period_end: string
          avg_price: number
          median_price: number
          min_price: number
          max_price: number
          transaction_count?: number
          total_volume?: number
          price_change_pct?: number | null
          cmv: number
          cmv_confidence?: Database['public']['Enums']['confidence_level']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cigar_id?: string
          period_type?: Database['public']['Enums']['period_type']
          period_start?: string
          period_end?: string
          avg_price?: number
          median_price?: number
          min_price?: number
          max_price?: number
          transaction_count?: number
          total_volume?: number
          price_change_pct?: number | null
          cmv?: number
          cmv_confidence?: Database['public']['Enums']['confidence_level']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_aggregates_cigar_id_fkey'
            columns: ['cigar_id']
            referencedRelation: 'cigars'
            referencedColumns: ['id']
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          subscription_tier: Database['public']['Enums']['subscription_tier']
          subscription_expires_at: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: Database['public']['Enums']['subscription_tier']
          subscription_expires_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: Database['public']['Enums']['subscription_tier']
          subscription_expires_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          id: string
          user_id: string
          cigar_id: string
          target_price: number | null
          alert_on_price_drop: boolean
          alert_on_new_listing: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cigar_id: string
          target_price?: number | null
          alert_on_price_drop?: boolean
          alert_on_new_listing?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cigar_id?: string
          target_price?: number | null
          alert_on_price_drop?: boolean
          alert_on_new_listing?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'watchlist_items_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'watchlist_items_cigar_id_fkey'
            columns: ['cigar_id']
            referencedRelation: 'cigars'
            referencedColumns: ['id']
          }
        ]
      }
      portfolio_items: {
        Row: {
          id: string
          user_id: string
          cigar_id: string
          quantity: number
          purchase_price: number | null
          purchase_date: string | null
          box_code_id: string | null
          storage_location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cigar_id: string
          quantity?: number
          purchase_price?: number | null
          purchase_date?: string | null
          box_code_id?: string | null
          storage_location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cigar_id?: string
          quantity?: number
          purchase_price?: number | null
          purchase_date?: string | null
          box_code_id?: string | null
          storage_location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'portfolio_items_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'portfolio_items_cigar_id_fkey'
            columns: ['cigar_id']
            referencedRelation: 'cigars'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'portfolio_items_box_code_id_fkey'
            columns: ['box_code_id']
            referencedRelation: 'box_codes'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      current_prices: {
        Row: {
          cigar_id: string | null
          cmv: number | null
          avg_price: number | null
          median_price: number | null
          min_price: number | null
          max_price: number | null
          price_change_pct: number | null
          cmv_confidence: Database['public']['Enums']['confidence_level'] | null
          transaction_count: number | null
          price_date: string | null
        }
        Relationships: []
      }
      trending_cigars: {
        Row: {
          id: string | null
          full_name: string | null
          vitola: string | null
          cmv: number | null
          price_change_pct: number | null
          cmv_confidence: Database['public']['Enums']['confidence_level'] | null
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {
      strength_level: 'mild' | 'mild-medium' | 'medium' | 'medium-full' | 'full'
      body_level: 'light' | 'light-medium' | 'medium' | 'medium-full' | 'full'
      transaction_source: 'ebay' | 'cigarbid' | 'cbid' | 'foxcigar' | 'manual' | 'user_reported'
      transaction_type: 'sale' | 'auction' | 'buy_now' | 'offer_accepted'
      cigar_condition: 'new_sealed' | 'new_opened' | 'aged' | 'vintage' | 'unknown'
      period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      confidence_level: 'high' | 'medium' | 'low' | 'insufficient_data'
      subscription_tier: 'free' | 'pro' | 'dealer'
    }
  }
}
