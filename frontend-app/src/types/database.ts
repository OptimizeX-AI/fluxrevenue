// frontend-app/src/types/database.ts

// Este é um placeholder para os tipos gerados pelo Supabase.
// Idealmente, você usaria o Supabase CLI para gerar esses tipos:
// supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// Por enquanto, vamos definir uma estrutura mínima.

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
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at?: string | null
          email?: string | null
          name?: string | null // Representa 'company' em alguns contextos
          plan: "free" | "trial" | "basic" | "pro" | "enterprise"
          status?: string | null // e.g., 'active', 'invited', 'disabled'
          subscription_status?: "active" | "canceled" | "past_due" | "trialing" | "expired_trial" | null
          trial_start_date?: string | null
          trial_end_date?: string | null
          next_billing_date?: string | null
          country?: string | null
          timezone?: string | null
          currency?: "BRL" | "USD" | "EUR" | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          // Adicione quaisquer outras colunas que você tenha na tabela 'clients'
        }
        Insert: {
          id: string // Geralmente o user_id do Supabase Auth
          created_at?: string
          updated_at?: string | null
          email?: string | null
          name?: string | null
          plan?: "free" | "trial" | "basic" | "pro" | "enterprise"
          status?: string | null
          subscription_status?: "active" | "canceled" | "past_due" | "trialing" | "expired_trial" | null
          trial_start_date?: string | null
          trial_end_date?: string | null
          // ... outros campos
        }
        Update: {
          // ... campos para atualização
          email?: string | null
          name?: string | null
          plan?: "free" | "trial" | "basic" | "pro" | "enterprise"
          status?: string | null
          subscription_status?: "active" | "canceled" | "past_due" | "trialing" | "expired_trial" | null
          trial_start_date?: string | null
          trial_end_date?: string | null
          // ... etc.
        }
        Relationships: []
      }
      sites: {
        Row: {
          id: string // uuid, primary key
          client_id: string // uuid, foreign key to clients.id
          url: string
          name?: string | null
          monthly_pageviews?: number | null
          current_rpm?: number | null
          target_rpm?: number | null
          optimization_token?: string | null
          script_installed?: boolean | null
          optimization_enabled?: boolean | null
          category?: string | null
          adsense_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          geographic_distribution?: Json | null
          content_niche?: string | null
        }
        Insert: {
          id?: string // uuid, default gen_random_uuid()
          client_id: string
          url: string
          name?: string | null
          // ... outros campos obrigatórios ou opcionais no insert
        }
        Update: {
          // ... campos para atualização
          url?: string
          name?: string | null
          // ... etc.
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      adsense_analyses: {
        Row: {
          id: string
          site_id: string
          client_id: string
          created_at: string
          total_revenue?: number | null
          total_pageviews?: number | null
          total_impressions?: number | null
          total_clicks?: number | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          avg_rpm?: number | null
          optimization_score?: number | null
          projected_revenue?: number | null
          projected_increase?: number | null
          status: "completed" | "processing" | "failed"
          analysis_results?: Json | null
          opportunities?: Json | null
          file_name?: string | null
          period_start?: string | null
          period_end?: string | null
          confidence_level?: number | null
          niches_detected?: string[] | null
          seasonality_factor?: number | null
        }
        Insert: {
          // ... defina conforme necessário
          site_id: string
          client_id: string
          status: "completed" | "processing" | "failed"
          // ...
        }
        Update: {
          // ... defina conforme necessário
        }
        Relationships: [
          {
            foreignKeyName: "adsense_analyses_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adsense_analyses_site_id_fkey"
            columns: ["site_id"]
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
        ]
      }
      metrics: {
        Row: {
          id: string
          site_id: string
          client_id?: string | null // Adicionado
          pageviews: number
          revenue: number
          rpm: number
          ctr: number
          impressions: number
          clicks: number
          timestamp: string
          created_at?: string
          custom_data?: Json | null
        }
        Insert: {
          // ...
          site_id: string
          client_id?: string | null
          // ...
        }
        Update: {
          // ...
        }
        Relationships: [
           {
            foreignKeyName: "metrics_client_id_fkey" // Supondo que esta FK exista ou será criada
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_site_id_fkey"
            columns: ["site_id"]
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: { // Renomeado de user_preferences
        Row: {
          id?: string // Pode ser client_id
          client_id: string
          notifications_enabled?: boolean
          auto_optimization?: boolean
          report_frequency?: "daily" | "weekly" | "monthly"
          // ... outros campos de UserSettings
          created_at?: string
          updated_at?: string | null
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: [
          {
            foreignKeyName: "user_settings_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string // client_id
          title: string
          message: string
          read: boolean
          type: "success" | "warning" | "info" | "error"
          action_url?: string | null
          action_label?: string | null
          created_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      optimization_tasks: {
        Row: {
          id: string
          site_id: string
          client_id?: string | null // Adicionado
          analysis_id?: string | null
          status: "pending" | "processing" | "completed" | "failed"
          priority?: number | null
          actions?: Json | null // Deve corresponder a TaskActionsPayload
          results?: Json | null
          error_message?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          processing_time_ms?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: [
          {
            foreignKeyName: "optimization_tasks_client_id_fkey" // Supondo que esta FK exista ou será criada
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_tasks_site_id_fkey"
            columns: ["site_id"]
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_tasks_analysis_id_fkey"
            columns: ["analysis_id"]
            referencedRelation: "adsense_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      // Adicione outras tabelas aqui: optimizer_configs, etc.
      optimizer_configs: {
        Row: {
            id: string; // ou uuid
            site_id: string;
            client_id?: string;
            config_type: string; // e.g., 'auto_ads', 'ad_placement'
            settings: Json; // JSON com as configurações específicas
            is_active: boolean;
            created_at?: string;
            updated_at?: string | null;
            // Campos adicionais de UI/metadata que podem ser armazenados
            title?: string; 
            description?: string;
            category?: string;
            difficulty?: string;
            estimated_impact?: number; // Em porcentagem
            implementation_time?: number; // Em minutos
            priority?: number;
            requirements?: string[];
            warnings?: string[];
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
        Relationships: [
            {
                foreignKeyName: "optimizer_configs_site_id_fkey";
                columns: ["site_id"];
                referencedRelation: "sites";
                referencedColumns: ["id"];
            },
            {
                foreignKeyName: "optimizer_configs_client_id_fkey"; // Se client_id for adicionado
                columns: ["client_id"];
                referencedRelation: "clients";
                referencedColumns: ["id"];
            }
        ];
      }
    }
    Views: {
      // Se você tiver views
    }
    Functions: {
      // Se você chamar funções SQL
    }
    Enums: {
      // Se você tiver tipos enum no Postgres
    }
    CompositeTypes: {
      // Se você tiver tipos compostos
    }
  }
}
