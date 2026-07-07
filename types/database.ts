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
      detail_konfirmasi_pembayaran: {
        Row: {
          bulan: number
          created_at: string
          id: string
          konfirmasi_id: string
          nominal: number
          tahun: number
          warga_id: string
        }
        Insert: {
          bulan: number
          created_at?: string
          id?: string
          konfirmasi_id: string
          nominal: number
          tahun: number
          warga_id: string
        }
        Update: {
          bulan?: number
          created_at?: string
          id?: string
          konfirmasi_id?: string
          nominal?: number
          tahun?: number
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detail_konfirmasi_pembayaran_konfirmasi_id_fkey"
            columns: ["konfirmasi_id"]
            isOneToOne: false
            referencedRelation: "konfirmasi_pembayaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_konfirmasi_pembayaran_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      detail_pembayaran: {
        Row: {
          bulan: number
          created_at: string
          id: string
          nominal: number
          pembayaran_id: string
          tahun: number
          warga_id: string
        }
        Insert: {
          bulan: number
          created_at?: string
          id?: string
          nominal: number
          pembayaran_id: string
          tahun: number
          warga_id: string
        }
        Update: {
          bulan?: number
          created_at?: string
          id?: string
          nominal?: number
          pembayaran_id?: string
          tahun?: number
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detail_pembayaran_pembayaran_id_fkey"
            columns: ["pembayaran_id"]
            isOneToOne: false
            referencedRelation: "pembayaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_pembayaran_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      konfirmasi_pembayaran: {
        Row: {
          alasan_penolakan: string | null
          approved_at: string | null
          bukti_url: string | null
          created_at: string
          id: string
          rejected_at: string | null
          rt_id: string
          status: string
          tahun: number
          total_bayar: number
          warga_id: string
        }
        Insert: {
          alasan_penolakan?: string | null
          approved_at?: string | null
          bukti_url?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          rt_id: string
          status?: string
          tahun: number
          total_bayar: number
          warga_id: string
        }
        Update: {
          alasan_penolakan?: string | null
          approved_at?: string | null
          bukti_url?: string | null
          created_at?: string
          id?: string
          rejected_at?: string | null
          rt_id?: string
          status?: string
          tahun?: number
          total_bayar?: number
          warga_id?: string
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
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          aktif: boolean | null
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          id: string
          jenis: string
          nominal: number
          referensi_id: string | null
          rt_id: string
          saldo_setelah: number
          sumber: string
          tanggal: string
        }
        Insert: {
          aktif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jenis: string
          nominal?: number
          referensi_id?: string | null
          rt_id: string
          saldo_setelah?: number
          sumber: string
          tanggal?: string
        }
        Update: {
          aktif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jenis?: string
          nominal?: number
          referensi_id?: string | null
          rt_id?: string
          saldo_setelah?: number
          sumber?: string
          tanggal?: string
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
      pembayaran: {
        Row: {
          created_at: string
          id: string
          jumlah_bayar: number
          keterangan: string | null
          metode: string | null
          rt_id: string
          tahun: number
          tanggal: string
          warga_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jumlah_bayar: number
          keterangan?: string | null
          metode?: string | null
          rt_id: string
          tahun: number
          tanggal?: string
          warga_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jumlah_bayar?: number
          keterangan?: string | null
          metode?: string | null
          rt_id?: string
          tahun?: number
          tanggal?: string
          warga_id?: string
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
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      pengeluaran: {
        Row: {
          aktif: boolean | null
          approved_at: string | null
          approved_by: string | null
          catatan_penolakan: string | null
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          id: string
          kategori: string | null
          nominal: number | null
          nomor_bukti: string | null
          nota_url: string | null
          penerima: string | null
          rt_id: string
          status: string | null
          tanggal: string | null
        }
        Insert: {
          aktif?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_penolakan?: string | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          kategori?: string | null
          nominal?: number | null
          nomor_bukti?: string | null
          nota_url?: string | null
          penerima?: string | null
          rt_id: string
          status?: string | null
          tanggal?: string | null
        }
        Update: {
          aktif?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          catatan_penolakan?: string | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          kategori?: string | null
          nominal?: number | null
          nomor_bukti?: string | null
          nota_url?: string | null
          penerima?: string | null
          rt_id?: string
          status?: string | null
          tanggal?: string | null
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
      pengeluaran_kategori: {
        Row: {
          id: number
          nama: string
          urutan: number
        }
        Insert: {
          id?: number
          nama: string
          urutan?: number
        }
        Update: {
          id?: number
          nama?: string
          urutan?: number
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          blok: string | null
          created_at: string
          email_admin: string | null
          email_bendahara: string | null
          email_ketua: string | null
          email_warga: string | null
          expires_at: string
          id: string
          nama_admin: string | null
          nama_bendahara: string | null
          nama_ketua: string | null
          nama_warga: string | null
          no_hp: string | null
          no_rumah: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          rt_data: Json | null
          rt_id: string | null
          rt_kode: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          blok?: string | null
          created_at?: string
          email_admin?: string | null
          email_bendahara?: string | null
          email_ketua?: string | null
          email_warga?: string | null
          expires_at?: string
          id?: string
          nama_admin?: string | null
          nama_bendahara?: string | null
          nama_ketua?: string | null
          nama_warga?: string | null
          no_hp?: string | null
          no_rumah?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          rt_data?: Json | null
          rt_id?: string | null
          rt_kode?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          blok?: string | null
          created_at?: string
          email_admin?: string | null
          email_bendahara?: string | null
          email_ketua?: string | null
          email_warga?: string | null
          expires_at?: string
          id?: string
          nama_admin?: string | null
          nama_bendahara?: string | null
          nama_ketua?: string | null
          nama_warga?: string | null
          no_hp?: string | null
          no_rumah?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          rt_data?: Json | null
          rt_id?: string | null
          rt_kode?: string | null
          status?: string
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
      rt: {
        Row: {
          aktif: boolean | null
          alamat: string | null
          atas_nama: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          kode: string | null
          kode_pos: string | null
          kota: string | null
          logo_url: string | null
          nama: string
          nama_bank: string | null
          nominal_iuran: number
          nomor_rekening: string | null
          provinsi: string | null
          qris_url: string | null
          telepon: string | null
          updated_at: string | null
        }
        Insert: {
          aktif?: boolean | null
          alamat?: string | null
          atas_nama?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          kode?: string | null
          kode_pos?: string | null
          kota?: string | null
          logo_url?: string | null
          nama: string
          nama_bank?: string | null
          nominal_iuran?: number
          nomor_rekening?: string | null
          provinsi?: string | null
          qris_url?: string | null
          telepon?: string | null
          updated_at?: string | null
        }
        Update: {
          aktif?: boolean | null
          alamat?: string | null
          atas_nama?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          kode?: string | null
          kode_pos?: string | null
          kota?: string | null
          logo_url?: string | null
          nama?: string
          nama_bank?: string | null
          nominal_iuran?: number
          nomor_rekening?: string | null
          provinsi?: string | null
          qris_url?: string | null
          telepon?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_membership: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string
          status: string
          user_id: string
          warga_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          rt_id: string
          status?: string
          user_id: string
          warga_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          rt_id?: string
          status?: string
          user_id?: string
          warga_id?: string | null
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
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nama: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nama?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nama?: string | null
        }
        Relationships: []
      }
      warga: {
        Row: {
          aktif: boolean | null
          blok: string | null
          created_at: string | null
          email: string | null
          id: string
          nama: string
          no_hp: string | null
          no_rumah: string | null
          rt_id: string
        }
        Insert: {
          aktif?: boolean | null
          blok?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nama: string
          no_hp?: string | null
          no_rumah?: string | null
          rt_id: string
        }
        Update: {
          aktif?: boolean | null
          blok?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nama?: string
          no_hp?: string | null
          no_rumah?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_konfirmasi: {
        Args: { p_konfirmasi_id: string; p_user_id: string }
        Returns: undefined
      }
      approve_pengeluaran: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      generate_kas_simulasi: {
        Args: {
          p_jumlah_data?: number
          p_max_bulan?: number
          p_rasio_pengeluaran?: number
          p_tahun: number
        }
        Returns: undefined
      }
      generate_rt_code: { Args: never; Returns: string }
      get_last_saldo: { Args: { p_rt_id: string }; Returns: number }
      insert_ledger:
        | {
            Args: {
              p_created_by: string
              p_deskripsi: string
              p_jenis: string
              p_nominal: number
              p_referensi_id: string
              p_rt_id: string
              p_sumber: string
              p_tanggal: string
            }
            Returns: string
          }
        | {
            Args: {
              p_created_by: string
              p_deskripsi: string
              p_jenis: string
              p_nominal: number
              p_referensi_id: string
              p_rt_id: string
              p_sumber: string
              p_tanggal: string
            }
            Returns: string
          }
      is_super_admin: { Args: never; Returns: boolean }
      populate_cashflow: {
        Args: {
          p_jumlah_data?: number
          p_max_bulan?: number
          p_rasio_pengeluaran?: number
          p_tahun: number
        }
        Returns: undefined
      }
      random_between: { Args: { max: number; min: number }; Returns: number }
      reject_konfirmasi: {
        Args: { p_alasan: string; p_konfirmasi_id: string; p_user_id: string }
        Returns: undefined
      }
      reject_pengeluaran: {
        Args: { p_alasan: string; p_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      status_konfirmasi: "pending" | "approved" | "rejected"
      user_role: "admin" | "bendahara" | "warga" | "super_admin" | "ketua"
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
      user_role: ["admin", "bendahara", "warga", "super_admin", "ketua"],
    },
  },
} as const
