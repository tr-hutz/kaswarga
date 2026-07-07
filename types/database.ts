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
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          rt_id: string
          visibility: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          rt_id: string
          visibility?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          rt_id?: string
          visibility?: string | null
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
            foreignKeyName: "detail_konfirmasi_pembayaran_konfirmasi_id_fkey"
            columns: ["confirmation_id"]
            isOneToOne: false
            referencedRelation: "payment_confirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_konfirmasi_pembayaran_warga_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          active: boolean | null
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          receipt_number: string | null
          receipt_url: string | null
          recipient: string | null
          rejection_note: string | null
          rt_id: string
          status: string | null
        }
        Insert: {
          active?: boolean | null
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          receipt_number?: string | null
          receipt_url?: string | null
          recipient?: string | null
          rejection_note?: string | null
          rt_id: string
          status?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          receipt_number?: string | null
          receipt_url?: string | null
          recipient?: string | null
          rejection_note?: string | null
          rt_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pengeluaran_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengeluaran_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          active: boolean | null
          amount: number
          balance_after: number
          created_at: string | null
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
          active?: boolean | null
          amount?: number
          balance_after?: number
          created_at?: string | null
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
          active?: boolean | null
          amount?: number
          balance_after?: number
          created_at?: string | null
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
          created_at: string | null
          id: string
          resident_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resident_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resident_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          rt_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_membership_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_membership_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_membership_warga_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          rt_id: string
          target_role: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          rt_id: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          rt_id?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
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
            foreignKeyName: "konfirmasi_pembayaran_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "konfirmasi_pembayaran_warga_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
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
            foreignKeyName: "detail_pembayaran_pembayaran_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_pembayaran_warga_id_fkey"
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
            foreignKeyName: "pembayaran_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_warga_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
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
          active: boolean | null
          block: string | null
          created_at: string | null
          email: string | null
          house_number: string | null
          id: string
          name: string
          phone: string | null
          rt_id: string
        }
        Insert: {
          active?: boolean | null
          block?: string | null
          created_at?: string | null
          email?: string | null
          house_number?: string | null
          id?: string
          name: string
          phone?: string | null
          rt_id: string
        }
        Update: {
          active?: boolean | null
          block?: string | null
          created_at?: string | null
          email?: string | null
          house_number?: string | null
          id?: string
          name?: string
          phone?: string | null
          rt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warga_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      rt: {
        Row: {
          account_holder: string | null
          account_number: string | null
          active: boolean | null
          address: string | null
          bank_name: string | null
          city: string | null
          code: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          monthly_fee: number
          name: string
          phone: string | null
          postal_code: string | null
          province: string | null
          qris_url: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          active?: boolean | null
          address?: string | null
          bank_name?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_fee?: number
          name: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          qris_url?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          active?: boolean | null
          address?: string | null
          bank_name?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_fee?: number
          name?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          qris_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
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
      approve_konfirmasi: {
        Args: { p_confirmation_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_pengeluaran: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_all_pending_pengeluaran: {
        Args: { p_rt_id: string; p_user_id: string }
        Returns: number
      }
      generate_rt_code: { Args: Record<PropertyKey, never>; Returns: string }
      get_last_saldo: { Args: { p_rt_id: string }; Returns: number }
      get_user_rt_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      insert_ledger: {
        Args: {
          p_rt_id: string
          p_type: string
          p_source: string
          p_reference_id: string
          p_date: string
          p_description: string
          p_amount: number
          p_created_by: string
        }
        Returns: string
      }
      is_member_of_rt: { Args: { p_rt_id: string }; Returns: boolean }
      is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      populate_cashflow: {
        Args: {
          p_tahun: number
          p_jumlah_data?: number
          p_max_bulan?: number
          p_rasio_pengeluaran?: number
        }
        Returns: undefined
      }
      reject_konfirmasi: {
        Args: { p_confirmation_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      reject_pengeluaran: {
        Args: { p_alasan: string; p_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      status_konfirmasi: "pending" | "approved" | "rejected"
      user_role: "ADMIN" | "CHAIR" | "RESIDENT" | "SUPER_ADMIN" | "TREASURER"
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
      status_konfirmasi: ["pending", "approved", "rejected"],
      user_role: ["ADMIN", "CHAIR", "RESIDENT", "SUPER_ADMIN", "TREASURER"],
    },
  },
} as const
