export type { Database, Json } from './database'
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database'

import type { Database } from './database'

// ─── Convenience aliases ────────────────────────────────────────────────────

export type DbRt             = Database['public']['Tables']['rt']['Row']
export type DbWarga          = Database['public']['Tables']['warga']['Row']
export type DbPembayaran     = Database['public']['Tables']['pembayaran']['Row']
export type DbPengeluaran    = Database['public']['Tables']['pengeluaran']['Row']
export type DbLedger         = Database['public']['Tables']['ledger']['Row']
export type DbDetailPembayaran     = Database['public']['Tables']['detail_pembayaran']['Row']
export type DbDetailKonfirmasi     = Database['public']['Tables']['detail_konfirmasi_pembayaran']['Row']
export type DbKonfirmasiPembayaran = Database['public']['Tables']['konfirmasi_pembayaran']['Row']
export type DbRegistrationRequest  = Database['public']['Tables']['registration_requests']['Row']
export type DbUserMembership       = Database['public']['Tables']['user_membership']['Row']
export type DbUser                 = Database['public']['Tables']['users']['Row']
export type DbPengeluaranKategori  = Database['public']['Tables']['pengeluaran_kategori']['Row']
export type DbActivityLog          = Database['public']['Tables']['activity_logs']['Row']

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole         = Database['public']['Enums']['user_role']
export type StatusKonfirmasi = Database['public']['Enums']['status_konfirmasi']

// ─── Membership ─────────────────────────────────────────────────────────────

export interface MembershipUser {
  id:    string
  nama:  string | null
  email: string | null
}

export interface MembershipRt {
  id:            string
  nama:          string
  kode:          string | null
  nominal_iuran: number
}

export interface MembershipWarga {
  id:       string
  nama:     string
  blok:     string | null
  no_rumah: string | null
  rt_id:    string
}

export interface Membership {
  id:     string | null
  role:   UserRole | null
  user:   MembershipUser | null
  rt:     MembershipRt | null
  warga:  MembershipWarga | null
  status: 'active' | 'no_membership'
}

// ─── Resident (app-layer, English keys) ─────────────────────────────────────

export interface Resident {
  id:            string
  name:          string
  block:         string | null
  houseNumber:   string | null
  email:         string | null
  phone:         string | null
  active:        boolean | null
  rtId:          string
  paymentStatus?: string
  paidCount?:    number
  arrears?:      number
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentDetail {
  id:      string
  month:   number
  amount:  number
  year:    number
  wargaId: string
}

export interface Payment {
  id:          string
  year:        number
  status:      StatusKonfirmasi
  totalAmount: number
  createdAt:   string
  proofUrl:    string | null
  name:        string
  block:       string
  houseNumber: string
  monthLabel:  string
  details:     DbDetailPembayaran[]
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export interface Expense {
  id:            string
  receiptNumber: string | null
  category:      string | null
  description:   string | null
  amount:        number | null
  recipient:     string | null
  date:          string | null
  receiptUrl:    string | null
  status:        string | null
  active:        boolean | null
  rtId:          string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ResidentAnalytics {
  id:          string
  name:        string
  block:       string | null
  houseNumber: string | null
  paidCount:   number
  arrears:     number
  upcoming:    number
}

export interface FinancialInsight {
  balance:      number
  income:       number
  expense:      number
  arrears:      number
}

export interface PaymentHealth {
  totalWarga:  number
  paid:        number
  almostPaid:  number
  delinquent:  number
  neverPaid:   number
}

export interface CashflowPoint {
  month:   string
  income:  number
  expense: number
  balance: number
}

export interface CollectionPoint {
  month: string
  total: number
}

// ─── Month ───────────────────────────────────────────────────────────────────

export interface Month {
  id:    number
  short: string
  name:  string
}
