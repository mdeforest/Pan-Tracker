// Auto-generated types matching the Supabase database schema.
// Regenerate after schema changes: supabase gen types typescript --linked > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          google_id: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          google_id: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          google_id?: string
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          user_id: string
          brand: string
          name: string
          category: Database["public"]["Enums"]["product_category"]
          photo_url: string | null
          notes: string | null
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand: string
          name: string
          category: Database["public"]["Enums"]["product_category"]
          photo_url?: string | null
          notes?: string | null
          archived_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand?: string
          name?: string
          category?: Database["public"]["Enums"]["product_category"]
          photo_url?: string | null
          notes?: string | null
          archived_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pan_entries: {
        Row: {
          id: string
          user_id: string
          product_id: string
          status: Database["public"]["Enums"]["pan_entry_status"]
          usage_level: Database["public"]["Enums"]["usage_level"]
          started_month: number
          started_year: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          status?: Database["public"]["Enums"]["pan_entry_status"]
          usage_level?: Database["public"]["Enums"]["usage_level"]
          started_month: number
          started_year: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          status?: Database["public"]["Enums"]["pan_entry_status"]
          usage_level?: Database["public"]["Enums"]["usage_level"]
          started_month?: number
          started_year?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pan_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pan_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_picks: {
        Row: {
          id: string
          user_id: string
          pan_entry_id: string
          month: number
          year: number
          carried_over_from_month: number | null
          carried_over_from_year: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pan_entry_id: string
          month: number
          year: number
          carried_over_from_month?: number | null
          carried_over_from_year?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pan_entry_id?: string
          month?: number
          year?: number
          carried_over_from_month?: number | null
          carried_over_from_year?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_picks_pan_entry_id_fkey"
            columns: ["pan_entry_id"]
            isOneToOne: false
            referencedRelation: "pan_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      empties: {
        Row: {
          id: string
          user_id: string
          pan_entry_id: string
          product_id: string
          finished_month: number
          finished_year: number
          rating: number | null
          would_repurchase: Database["public"]["Enums"]["would_repurchase"] | null
          review_notes: string | null
          replacement_product_id: string | null
          replacement_free_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pan_entry_id: string
          product_id: string
          finished_month: number
          finished_year: number
          rating?: number | null
          would_repurchase?: Database["public"]["Enums"]["would_repurchase"] | null
          review_notes?: string | null
          replacement_product_id?: string | null
          replacement_free_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pan_entry_id?: string
          product_id?: string
          finished_month?: number
          finished_year?: number
          rating?: number | null
          would_repurchase?: Database["public"]["Enums"]["would_repurchase"] | null
          review_notes?: string | null
          replacement_product_id?: string | null
          replacement_free_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empties_pan_entry_id_fkey"
            columns: ["pan_entry_id"]
            isOneToOne: false
            referencedRelation: "pan_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empties_replacement_product_id_fkey"
            columns: ["replacement_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category: "makeup" | "skincare" | "haircare" | "bodycare" | "fragrance" | "tools" | "other"
      pan_entry_status: "active" | "empty" | "paused"
      usage_level: "just_started" | "quarter" | "half" | "three_quarters" | "almost_done"
      would_repurchase: "yes" | "no" | "maybe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
