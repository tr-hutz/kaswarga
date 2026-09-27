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
      activation_invites: {
        Row: {
          activated_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          registration_request_id: string
          resend_count: number
          role: string
          rt_id: string | null
          sent_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          registration_request_id: string
          resend_count?: number
          role: string
          rt_id?: string | null
          sent_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          registration_request_id?: string
          resend_count?: number
          role?: string
          rt_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_invites_registration_request_id_fkey"
            columns: ["registration_request_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_invites_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          rt_id: string
          visibility: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          rt_id: string
          visibility?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          rt_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_details: {
        Row: {
          amount: number
          confirmation_id: string
          created_at: string
          id: string
          month: number
          resident_id: string
          year: number
        }
        Insert: {
          amount: number
          confirmation_id: string
          created_at?: string
          id?: string
          month: number
          resident_id: string
          year: number
        }
        Update: {
          amount?: number
          confirmation_id?: string
          created_at?: string
          id?: string
          month?: number
          resident_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_details_confirmation_id_fkey"
            columns: ["confirmation_id"]
            isOneToOne: false
            referencedRelation: "payment_confirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_details_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: number
          name: string
          sort_order: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          name: string
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          name?: string
          sort_order?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          active: boolean
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          created_by: string | null
          date: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          import_job_id: string | null
          receipt_number: string | null
          receipt_url: string | null
          recipient: string | null
          rejection_note: string | null
          rt_id: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          import_job_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          recipient?: string | null
          rejection_note?: string | null
          rt_id: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          import_job_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          recipient?: string | null
          rejection_note?: string | null
          rt_id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_rows: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          import_job_id: string
          raw_data: Json | null
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          import_job_id: string
          raw_data?: Json | null
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          import_job_id?: string
          raw_data?: Json | null
          row_number?: number
          status?: Database["public"]["Enums"]["import_row_status"]
        }
        Relationships: [
          {
            foreignKeyName: "import_job_rows_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          failed_rows: number
          file_path: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          import_type: Database["public"]["Enums"]["import_type"]
          processed_rows: number
          progress_percent: number
          rejected_by: string | null
          rejection_reason: string | null
          rt_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["import_status"]
          success_rows: number
          total_rows: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          failed_rows?: number
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          import_type: Database["public"]["Enums"]["import_type"]
          processed_rows?: number
          progress_percent?: number
          rejected_by?: string | null
          rejection_reason?: string | null
          rt_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          success_rows?: number
          total_rows?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          failed_rows?: number
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          import_type?: Database["public"]["Enums"]["import_type"]
          processed_rows?: number
          progress_percent?: number
          rejected_by?: string | null
          rejection_reason?: string | null
          rt_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status"]
          success_rows?: number
          total_rows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      income_donations: {
        Row: {
          cancelled_note: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          donation_code: string
          ends_at: string | null
          id: string
          name: string
          rt_id: string
          starts_at: string
          status: string
          target_amount: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancelled_note?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          donation_code: string
          ends_at?: string | null
          id?: string
          name: string
          rt_id: string
          starts_at?: string
          status?: string
          target_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancelled_note?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          donation_code?: string
          ends_at?: string | null
          id?: string
          name?: string
          rt_id?: string
          starts_at?: string
          status?: string
          target_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_donations_rt_fk"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      income_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          contribution_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          donation_id: string | null
          id: string
          import_job_id: string | null
          in_kind_description: string | null
          in_kind_quantity: number | null
          in_kind_unit: string | null
          income_category: Database["public"]["Enums"]["income_category"]
          income_name: string
          is_anonymous: boolean
          notes: string | null
          payer_name: string | null
          payment_method: string | null
          received_at: string
          reference_number: string | null
          rejected_at: string | null
          rejection_note: string | null
          resident_id: string | null
          rt_id: string
          source_type: Database["public"]["Enums"]["income_source_type"]
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          contribution_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          donation_id?: string | null
          id?: string
          import_job_id?: string | null
          in_kind_description?: string | null
          in_kind_quantity?: number | null
          in_kind_unit?: string | null
          income_category: Database["public"]["Enums"]["income_category"]
          income_name: string
          is_anonymous?: boolean
          notes?: string | null
          payer_name?: string | null
          payment_method?: string | null
          received_at?: string
          reference_number?: string | null
          rejected_at?: string | null
          rejection_note?: string | null
          resident_id?: string | null
          rt_id: string
          source_type?: Database["public"]["Enums"]["income_source_type"]
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          contribution_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          donation_id?: string | null
          id?: string
          import_job_id?: string | null
          in_kind_description?: string | null
          in_kind_quantity?: number | null
          in_kind_unit?: string | null
          income_category?: Database["public"]["Enums"]["income_category"]
          income_name?: string
          is_anonymous?: boolean
          notes?: string | null
          payer_name?: string | null
          payment_method?: string | null
          received_at?: string
          reference_number?: string | null
          rejected_at?: string | null
          rejection_note?: string | null
          resident_id?: string | null
          rt_id?: string
          source_type?: Database["public"]["Enums"]["income_source_type"]
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_transactions_donation_fk"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "income_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_resident_fk"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_rt_fk"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          active: boolean
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          reference_id: string | null
          rt_id: string
          source: string
          type: string
        }
        Insert: {
          active?: boolean
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          rt_id: string
          source: string
          type: string
        }
        Update: {
          active?: boolean
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          rt_id?: string
          source?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          resident_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resident_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          rt_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resident_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          rt_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          rt_id: string
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          rt_id: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          rt_id?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_confirmations: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          proof_url: string | null
          rejected_at: string | null
          rejection_reason: string | null
          resident_id: string
          rt_id: string
          status: string
          total_amount: number
          year: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          resident_id: string
          rt_id: string
          status?: string
          total_amount: number
          year: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          proof_url?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          resident_id?: string
          rt_id?: string
          status?: string
          total_amount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_confirmations_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_details: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: number
          payment_id: string
          resident_id: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: number
          payment_id: string
          resident_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: number
          payment_id?: string
          resident_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_details_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_details_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          date: string
          id: string
          method: string | null
          notes: string | null
          resident_id: string
          rt_id: string
          total_amount: number
          year: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          notes?: string | null
          resident_id: string
          rt_id: string
          total_amount: number
          year: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          notes?: string | null
          resident_id?: string
          rt_id?: string
          total_amount?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          admin_email: string | null
          admin_name: string | null
          approved_at: string | null
          approved_by: string | null
          block: string | null
          chair_email: string | null
          chair_name: string | null
          created_at: string
          expires_at: string
          house_number: string | null
          id: string
          phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          resident_email: string | null
          resident_name: string | null
          rt_code: string | null
          rt_data: Json | null
          rt_id: string | null
          status: string
          treasurer_email: string | null
          treasurer_name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          admin_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          block?: string | null
          chair_email?: string | null
          chair_name?: string | null
          created_at?: string
          expires_at?: string
          house_number?: string | null
          id?: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          resident_email?: string | null
          resident_name?: string | null
          rt_code?: string | null
          rt_data?: Json | null
          rt_id?: string | null
          status?: string
          treasurer_email?: string | null
          treasurer_name?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          admin_name?: string | null
          approved_at?: string | null
          approved_by?: string | null
          block?: string | null
          chair_email?: string | null
          chair_name?: string | null
          created_at?: string
          expires_at?: string
          house_number?: string | null
          id?: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          resident_email?: string | null
          resident_name?: string | null
          rt_code?: string | null
          rt_data?: Json | null
          rt_id?: string | null
          status?: string
          treasurer_email?: string | null
          treasurer_name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          active: boolean
          block: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          house_number: string | null
          id: string
          name: string
          phone: string | null
          rt_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          block?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          house_number?: string | null
          id?: string
          name: string
          phone?: string | null
          rt_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          block?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          house_number?: string | null
          id?: string
          name?: string
          phone?: string | null
          rt_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allow: boolean
          created_at: string
          id: string
          permission_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          allow?: boolean
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          allow?: boolean
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rt: {
        Row: {
          account_holder: string | null
          account_number: string | null
          active: boolean
          address: string | null
          bank_name: string | null
          city: string | null
          code: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          maker_checker_enabled: boolean
          monthly_fee: number
          name: string
          phone: string | null
          postal_code: string | null
          province: string | null
          qris_url: string | null
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          active?: boolean
          address?: string | null
          bank_name?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          maker_checker_enabled?: boolean
          monthly_fee?: number
          name: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          qris_url?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          active?: boolean
          address?: string | null
          bank_name?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          maker_checker_enabled?: boolean
          monthly_fee?: number
          name?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          qris_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rt_permission_overrides: {
        Row: {
          allow: boolean
          created_at: string
          id: string
          permission_id: string
          role_id: string
          rt_id: string
          updated_at: string
        }
        Insert: {
          allow: boolean
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
          rt_id: string
          updated_at?: string
        }
        Update: {
          allow?: boolean
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
          rt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rt_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rt_permission_overrides_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rt_permission_overrides_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      guide_sections: {
        Row: {
          id:           string
          title:        string
          body:         string
          category:     string
          position:     number
          is_published: boolean
          created_at:   string
          created_by:   string | null
          updated_at:   string
          updated_by:   string | null
        }
        Insert: {
          id?:          string
          title:        string
          body?:        string
          category?:    string
          position?:    number
          is_published?: boolean
          created_at?:  string
          created_by?:  string | null
          updated_at?:  string
          updated_by?:  string | null
        }
        Update: {
          id?:          string
          title?:       string
          body?:        string
          category?:    string
          position?:    number
          is_published?: boolean
          created_at?:  string
          created_by?:  string | null
          updated_at?:  string
          updated_by?:  string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_all_pending_expenses: {
        Args: { p_rt_id: string; p_user_id: string }
        Returns: number
      }
      approve_confirmation: {
        Args: { p_confirmation_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_expense: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_expenses_by_import_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: number
      }
      cleanup_expired_registrations: { Args: never; Returns: undefined }
      current_membership: {
        Args: never
        Returns: {
          created_at: string
          id: string
          resident_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string | null
          status: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_neighborhood: { Args: never; Returns: string[] }
      generate_rt_code: { Args: never; Returns: string }
      get_last_balance: { Args: { p_rt_id: string }; Returns: number }
      get_user_rt_ids: { Args: never; Returns: string[] }
      has_permission: {
        Args: { p_permission_code: string; p_rt_id: string }
        Returns: boolean
      }
      insert_ledger: {
        Args: {
          p_amount: number
          p_created_by: string
          p_date: string
          p_description: string
          p_reference_id: string
          p_rt_id: string
          p_source: string
          p_type: string
        }
        Returns: string
      }
      is_member_of_rt: { Args: { p_rt_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      populate_cashflow: {
        Args: {
          p_data_count?: number
          p_expense_ratio?: number
          p_max_months?: number
          p_year: number
        }
        Returns: undefined
      }
      reject_confirmation: {
        Args: { p_confirmation_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      reject_expense: {
        Args: { p_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      reject_expenses_by_import_job: {
        Args: { p_job_id: string; p_reason?: string; p_user_id: string }
        Returns: number
      }
      user_has_permission: {
        Args: { p_permission_code: string; p_rt_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      import_row_status: "VALID" | "INVALID" | "SKIPPED"
      import_status:
        | "QUEUED"
        | "PROCESSING"
        | "VALIDATING"
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "REJECTED"
        | "COMPLETED"
        | "FAILED"
        | "STAGED"
        | "PROMOTING"
        | "PROMOTED"
        | "CANCELLED"
      import_type: "RESIDENT" | "PAYMENT" | "INCOME" | "EXPENSE"
      income_category:
        | "DONATION"
        | "GOVERNMENT"
        | "EVENT"
        | "BAZAAR"
        | "RENTAL"
        | "SALES"
        | "INTEREST"
        | "OTHER"
        | "IN_KIND"
      income_source_type:
        | "RESIDENT"
        | "NON_RESIDENT"
        | "ORGANIZATION"
        | "GOVERNMENT"
        | "ANONYMOUS"
      user_role: "SUPER_ADMIN" | "CHAIR" | "ADMIN" | "TREASURER" | "RESIDENT"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      import_row_status: ["VALID", "INVALID", "SKIPPED"],
      import_status: [
        "QUEUED",
        "PROCESSING",
        "VALIDATING",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        "FAILED",
        "STAGED",
        "PROMOTING",
        "PROMOTED",
        "CANCELLED",
      ],
      import_type: ["RESIDENT", "PAYMENT", "INCOME", "EXPENSE"],
      income_category: [
        "DONATION",
        "GOVERNMENT",
        "EVENT",
        "BAZAAR",
        "RENTAL",
        "SALES",
        "INTEREST",
        "OTHER",
        "IN_KIND",
      ],
      income_source_type: [
        "RESIDENT",
        "NON_RESIDENT",
        "ORGANIZATION",
        "GOVERNMENT",
        "ANONYMOUS",
      ],
      user_role: ["SUPER_ADMIN", "CHAIR", "ADMIN", "TREASURER", "RESIDENT"],
    },
  },
} as const
