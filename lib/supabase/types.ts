// Hand-written to mirror supabase/schema.sql. Shaped like `supabase gen types`
// output so it can be regenerated/replaced once the tables exist:
//   supabase gen types typescript --project-id lhkaetustgmzwfyrtdlm > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          credit_balance: number;
          plan: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          credit_balance?: number;
          plan?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          credit_balance?: number;
          plan?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: number;
          user_id: string;
          amount: number;
          reason: string;
          ref: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          amount: number;
          reason: string;
          ref?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          amount?: number;
          reason?: string;
          ref?: string | null;
          balance_after?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          prompt: string;
          model_ids: Json;
          seeds: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          mode: string;
          prompt: string;
          model_ids: Json;
          seeds?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: string;
          prompt?: string;
          model_ids?: Json;
          seeds?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      results: {
        Row: {
          id: string;
          run_id: string;
          user_id: string;
          model_id: string;
          prompt: string;
          seed: number | null;
          status: string;
          storage_path: string | null;
          width: number | null;
          height: number | null;
          favorite: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          run_id: string;
          user_id: string;
          model_id: string;
          prompt: string;
          seed?: number | null;
          status?: string;
          storage_path?: string | null;
          width?: number | null;
          height?: number | null;
          favorite?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          user_id?: string;
          model_id?: string;
          prompt?: string;
          seed?: number | null;
          status?: string;
          storage_path?: string | null;
          width?: number | null;
          height?: number | null;
          favorite?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "results_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      evals: {
        Row: {
          id: string;
          user_id: string;
          run_id: string | null;
          prompt: string;
          reference_kind: string;
          reference_path: string;
          reference_result_id: string | null;
          scorer: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          run_id?: string | null;
          prompt: string;
          reference_kind: string;
          reference_path: string;
          reference_result_id?: string | null;
          scorer?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          run_id?: string | null;
          prompt?: string;
          reference_kind?: string;
          reference_path?: string;
          reference_result_id?: string | null;
          scorer?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "evals_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      eval_scores: {
        Row: {
          id: number;
          eval_id: string;
          result_id: string;
          user_id: string;
          score: number;
          raw: Json | null;
          rank: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          eval_id: string;
          result_id: string;
          user_id: string;
          score: number;
          raw?: Json | null;
          rank?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          eval_id?: string;
          result_id?: string;
          user_id?: string;
          score?: number;
          raw?: Json | null;
          rank?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eval_scores_eval_id_fkey";
            columns: ["eval_id"];
            referencedRelation: "evals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eval_scores_result_id_fkey";
            columns: ["result_id"];
            referencedRelation: "results";
            referencedColumns: ["id"];
          },
        ];
      };
      benchmark_suite_runs: {
        Row: {
          id: string;
          user_id: string;
          model_id: string;
          suite_version: string;
          status: string;
          pass_count: number;
          fail_count: number;
          total_challenges: number;
          category_filter: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          model_id: string;
          suite_version?: string;
          status?: string;
          pass_count?: number;
          fail_count?: number;
          total_challenges: number;
          category_filter?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          model_id?: string;
          suite_version?: string;
          status?: string;
          pass_count?: number;
          fail_count?: number;
          total_challenges?: number;
          category_filter?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "benchmark_suite_runs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      benchmark_challenge_results: {
        Row: {
          id: string;
          suite_run_id: string;
          user_id: string;
          challenge_id: string;
          model_id: string;
          category: string;
          image_url: string | null;
          passed: boolean | null;
          vlm_output: string | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          suite_run_id: string;
          user_id: string;
          challenge_id: string;
          model_id: string;
          category: string;
          image_url?: string | null;
          passed?: boolean | null;
          vlm_output?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          suite_run_id?: string;
          user_id?: string;
          challenge_id?: string;
          model_id?: string;
          category?: string;
          image_url?: string | null;
          passed?: boolean | null;
          vlm_output?: string | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "benchmark_challenge_results_suite_run_id_fkey";
            columns: ["suite_run_id"];
            referencedRelation: "benchmark_suite_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "benchmark_challenge_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row aliases.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CreditTransaction = Database["public"]["Tables"]["credit_transactions"]["Row"];
export type Run = Database["public"]["Tables"]["runs"]["Row"];
export type Result = Database["public"]["Tables"]["results"]["Row"];
export type Eval = Database["public"]["Tables"]["evals"]["Row"];
export type EvalScore = Database["public"]["Tables"]["eval_scores"]["Row"];
export type BenchmarkSuiteRunRow =
  Database["public"]["Tables"]["benchmark_suite_runs"]["Row"];
export type BenchmarkChallengeResultRow =
  Database["public"]["Tables"]["benchmark_challenge_results"]["Row"];
