export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      benchmark_challenge_results: {
        Row: {
          category: string
          challenge_id: string
          created_at: string
          id: string
          image_url: string | null
          latency_ms: number | null
          model_id: string
          passed: boolean | null
          suite_run_id: string
          user_id: string
          vlm_output: string | null
        }
        Insert: {
          category: string
          challenge_id: string
          created_at?: string
          id: string
          image_url?: string | null
          latency_ms?: number | null
          model_id: string
          passed?: boolean | null
          suite_run_id: string
          user_id: string
          vlm_output?: string | null
        }
        Update: {
          category?: string
          challenge_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          latency_ms?: number | null
          model_id?: string
          passed?: boolean | null
          suite_run_id?: string
          user_id?: string
          vlm_output?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_challenge_results_suite_run_id_fkey"
            columns: ["suite_run_id"]
            isOneToOne: false
            referencedRelation: "benchmark_suite_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_challenge_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      benchmark_suite_runs: {
        Row: {
          category_filter: string | null
          completed_at: string | null
          created_at: string
          fail_count: number
          id: string
          model_id: string
          pass_count: number
          status: string
          suite_version: string
          total_challenges: number
          user_id: string
        }
        Insert: {
          category_filter?: string | null
          completed_at?: string | null
          created_at?: string
          fail_count?: number
          id: string
          model_id: string
          pass_count?: number
          status?: string
          suite_version?: string
          total_challenges: number
          user_id: string
        }
        Update: {
          category_filter?: string | null
          completed_at?: string | null
          created_at?: string
          fail_count?: number
          id?: string
          model_id?: string
          pass_count?: number
          status?: string
          suite_version?: string
          total_challenges?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_suite_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: number
          reason: string
          ref: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: never
          reason: string
          ref?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: never
          reason?: string
          ref?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      eval_scores: {
        Row: {
          created_at: string
          eval_id: string
          id: number
          rank: number | null
          raw: Json | null
          result_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          eval_id: string
          id?: never
          rank?: number | null
          raw?: Json | null
          result_id: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          eval_id?: string
          id?: never
          rank?: number | null
          raw?: Json | null
          result_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_scores_eval_id_fkey"
            columns: ["eval_id"]
            isOneToOne: false
            referencedRelation: "evals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_scores_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evals: {
        Row: {
          created_at: string
          id: string
          prompt: string
          reference_kind: string
          reference_path: string
          reference_result_id: string | null
          run_id: string | null
          scorer: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          prompt: string
          reference_kind: string
          reference_path: string
          reference_result_id?: string | null
          run_id?: string | null
          scorer?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          reference_kind?: string
          reference_path?: string
          reference_result_id?: string | null
          run_id?: string | null
          scorer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credit_balance: number
          current_period_end: string | null
          current_period_start: string | null
          email: string | null
          email_verified: boolean
          first_name: string | null
          image_url: string | null
          last_name: string | null
          monthly_credits: number
          next_refresh_at: string | null
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          image_url?: string | null
          last_name?: string | null
          monthly_credits?: number
          next_refresh_at?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          credit_balance?: number
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          email_verified?: boolean
          first_name?: string | null
          image_url?: string | null
          last_name?: string | null
          monthly_credits?: number
          next_refresh_at?: string | null
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          error: string | null
          favorite: boolean
          height: number | null
          id: string
          model_id: string
          prompt: string
          run_id: string
          seed: number | null
          status: string
          storage_path: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          favorite?: boolean
          height?: number | null
          id: string
          model_id: string
          prompt: string
          run_id: string
          seed?: number | null
          status?: string
          storage_path?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          error?: string | null
          favorite?: boolean
          height?: number | null
          id?: string
          model_id?: string
          prompt?: string
          run_id?: string
          seed?: number | null
          status?: string
          storage_path?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      runs: {
        Row: {
          created_at: string
          id: string
          mode: string
          model_ids: Json
          prompt: string
          seeds: Json | null
          user_id: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          mode: string
          model_ids: Json
          prompt: string
          seeds?: Json | null
          user_id: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          model_ids?: Json
          prompt?: string
          seeds?: Json | null
          user_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_credits: {
        Args: {
          p_amount: number
          p_reason: string
          p_ref?: string
          p_user_id: string
        }
        Returns: number
      }
      refresh_due_credits: { Args: never; Returns: number }
      set_credits: {
        Args: {
          p_advance_refresh?: boolean
          p_reason: string
          p_ref?: string
          p_target: number
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
