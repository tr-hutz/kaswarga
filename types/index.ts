export type { Database, Json } from './database'
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database'

import type { Database } from './database'

// ─── Convenience aliases ────────────────────────────────────────────────────

export type DbRt                   = Database['public']['Tables']['rt']['Row']
export type DbResident             = Database['public']['Tables']['residents']['Row']
export type DbPayment              = Database['public']['Tables']['payments']['Row']
export type DbExpense              = Database['public']['Tables']['expenses']['Row']
export type DbLedger               = Database['public']['Tables']['ledger']['Row']
export type DbPaymentDetail        = Database['public']['Tables']['payment_details']['Row']
export type DbConfirmationDetail   = Database['public']['Tables']['confirmation_details']['Row']
export type DbPaymentConfirmation  = Database['public']['Tables']['payment_confirmations']['Row']
export type DbRegistrationRequest  = Database['public']['Tables']['registration_requests']['Row']
export type DbMembership           = Database['public']['Tables']['memberships']['Row']
export type DbUser                 = Database['public']['Tables']['users']['Row']
export type DbExpenseCategory      = Database['public']['Tables']['expense_categories']['Row']
export type DbActivityLog          = Database['public']['Tables']['activity_logs']['Row']

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole         = Database['public']['Enums']['user_role']
export type ConfirmationStatus = 'pending' | 'approved' | 'rejected'

// ─── Membership ─────────────────────────────────────────────────────────────

export interface MembershipUser {
  id:    string
  name:  string | null
  email: string | null
}

export interface MembershipRt {
  id:          string
  name:        string
  code:        string | null
  monthly_fee: number
}

export interface MembershipResident {
  id:          string
  name:        string
  block:       string | null
  house_number: string | null
  rt_id:       string
}

export interface Membership {
  id:       string | null
  role:     UserRole | null
  user:     MembershipUser | null
  rt:       MembershipRt | null
  resident: MembershipResident | null
  status:   'active' | 'no_membership'
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
  id:         string
  month:      number
  amount:     number
  year:       number
  residentId: string
}

export interface Payment {
  id:          string
  year:        number
  status:      ConfirmationStatus
  totalAmount: number
  createdAt:   string
  proofUrl:    string | null
  name:        string
  block:       string
  houseNumber: string
  monthLabel:  string
  details:     DbPaymentDetail[]
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
  totalResidents: number
  paid:           number
  almostPaid:     number
  delinquent:     number
  neverPaid:      number
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
