export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      empties: {
        Row: {
          created_at: string
          finished_month: number
          finished_year: number
          id: string
          pan_entry_id: string
          product_id: string
          rating: number | null
          replacement_free_text: string | null
          replacement_product_id: string | null
          review_notes: string | null
          user_id: string
          would_repurchase:
            | Database["public"]["Enums"]["would_repurchase"]
            | null
        }
        Insert: {
          created_at?: string
          finished_month: number
          finished_year: number
          id?: string
          pan_entry_id: string
          product_id: string
          rating?: number | null
          replacement_free_text?: string | null
          replacement_product_id?: string | null
          review_notes?: string | null
          user_id: string
          would_repurchase?:
            | Database["public"]["Enums"]["would_repurchase"]
            | null
        }
        Update: {
          created_at?: string
          finished_month?: number
          finished_year?: number
          id?: string
          pan_entry_id?: string
          product_id?: string
          rating?: number | null
          replacement_free_text?: string | null
          replacement_product_id?: string | null
          review_notes?: string | null
          user_id?: string
          would_repurchase?:
            | Database["public"]["Enums"]["would_repurchase"]
            | null
        }
        Relationships: [
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
          {
            foreignKeyName: "empties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_picks: {
        Row: {
          carried_over_from_month: number | null
          carried_over_from_year: number | null
          created_at: string
          id: string
          month: number
          pan_entry_id: string
          user_id: string
          year: number
        }
        Insert: {
          carried_over_from_month?: number | null
          carried_over_from_year?: number | null
          created_at?: string
          id?: string
          month: number
          pan_entry_id: string
          user_id: string
          year: number
        }
        Update: {
          carried_over_from_month?: number | null
          carried_over_from_year?: number | null
          created_at?: string
          id?: string
          month?: number
          pan_entry_id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_picks_pan_entry_id_fkey"
            columns: ["pan_entry_id"]
            isOneToOne: false
            referencedRelation: "pan_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_picks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pan_entries: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          started_month: number
          started_year: number
          status: Database["public"]["Enums"]["pan_entry_status"]
          updated_at: string
          usage_level: Database["public"]["Enums"]["usage_level"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          started_month: number
          started_year: number
          status?: Database["public"]["Enums"]["pan_entry_status"]
          updated_at?: string
          usage_level?: Database["public"]["Enums"]["usage_level"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          started_month?: number
          started_year?: number
          status?: Database["public"]["Enums"]["pan_entry_status"]
          updated_at?: string
          usage_level?: Database["public"]["Enums"]["usage_level"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pan_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pan_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          brand: string
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          name: string
          notes: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          brand: string
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          brand?: string
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          user_id?: string
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
      wishlist_items: {
        Row: {
          brand: string
          created_at: string
          estimated_price: number | null
          id: string
          name: string
          notes: string | null
          product_id: string | null
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          estimated_price?: number | null
          id?: string
          name: string
          notes?: string | null
          product_id?: string | null
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          estimated_price?: number | null
          id?: string
          name?: string
          notes?: string | null
          product_id?: string | null
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          google_id: string
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          google_id: string
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          google_id?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pan_entry_status: "active" | "empty" | "paused"
      product_category:
        | "makeup"
        | "skincare"
        | "haircare"
        | "bodycare"
        | "fragrance"
        | "tools"
        | "other"
      usage_level:
        | "just_started"
        | "quarter"
        | "half"
        | "three_quarters"
        | "almost_done"
      would_repurchase: "yes" | "no" | "maybe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pan_entry_status: ["active", "empty", "paused"],
      product_category: [
        "makeup",
        "skincare",
        "haircare",
        "bodycare",
        "fragrance",
        "tools",
        "other",
      ],
      usage_level: [
        "just_started",
        "quarter",
        "half",
        "three_quarters",
        "almost_done",
      ],
      would_repurchase: ["yes", "no", "maybe"],
    },
  },
} as const
