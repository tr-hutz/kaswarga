# GLOSSARY.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: July 2026

---

# 1. Purpose

This document defines the official terminology used throughout the KasWarga project.

The objectives are:

- Ensure consistent naming.
- Avoid multiple translations for the same concept.
- Standardize source code.
- Improve communication between developers and stakeholders.
- Support AI-assisted development.

All source code MUST follow this glossary.

---

# 2. Language Policy

| Area | Language |
|-------|----------|
| Source Code | English |
| Database | English |
| API | English |
| Documentation | English |
| Git Commit | English |
| User Interface | Indonesian |

---

# 3. Core Domain

| Indonesian | English | Used In |
|------------|----------|----------|
| RT | RT | Database, Types, UI |
| Warga | Resident | Table, Types, Variables |
| Pengguna | User | Table, Types |
| Keanggotaan | Membership | Database |
| Peran | Role | Database, Enum |
| Hak Akses | Permission | Enum |
| Dashboard | Dashboard | UI |

---

# 4. Finance

| Indonesian | English | Used In |
|------------|----------|----------|
| Pembayaran | Payment | Feature |
| Detail Pembayaran | Payment Detail | Table |
| Pengeluaran | Expense | Feature |
| Buku Kas | Ledger | Feature |
| Entri Kas | Ledger Entry | Types |
| Saldo | Balance | Variables |
| Nominal | Amount | Variables |
| Total Bayar | Total Amount | Variables |
| Bukti Transfer | Payment Proof | Storage |
| Tagihan | Billing | Feature |
| Iuran | Fee | UI |
| Tunggakan | Outstanding Payment | UI |

---

# 5. Resident

| Indonesian | English | Used In |
|------------|----------|----------|
| Nama | Name | Variables |
| Blok | Block | Variables |
| Jalan | Street | Variables |
| Nomor Rumah | House Number | Variables |
| Nomor Telepon | Phone Number | Variables |
| Alamat | Address | Variables |
| Email | Email | Variables |

---

# 6. Registration

| Indonesian | English | Used In |
|------------|----------|----------|
| Registrasi | Registration | Feature |
| Registrasi RT | RT Registration | Feature |
| Registrasi Warga | Resident Registration | Feature |
| Permohonan | Registration Request | Types |
| Aktivasi | Activation | Feature |
| Token Aktivasi | Activation Token | Database |
| Kedaluwarsa | Expiration | Variables |

---

# 7. Notification

| Indonesian | English | Used In |
|------------|----------|----------|
| Notifikasi | Notification | Feature |
| Belum Dibaca | Unread | Enum |
| Sudah Dibaca | Read | Enum |
| Email Aktivasi | Activation Email | Service |
| Email Persetujuan | Approval Email | Service |
| Email Penolakan | Rejection Email | Service |

---

# 8. Roles

| Indonesian | English | Used In |
|------------|----------|----------|
| Super Admin | Super Administrator | Enum |
| Ketua RT | RT Chair | Enum |
| Admin RT | RT Administrator | Enum |
| Bendahara | Treasurer | Enum |
| Warga | Resident | Enum |

---

# 9. Payment Status

| Indonesian | English | Enum |
|------------|----------|------|
| Menunggu | PENDING | PaymentStatus |
| Disetujui | APPROVED | PaymentStatus |
| Ditolak | REJECTED | PaymentStatus |
| Lunas | PAID | PaymentStatus |
| Belum Bayar | UNPAID | PaymentStatus |

---

# 10. Registration Status

| Indonesian | English | Enum |
|------------|----------|------|
| Menunggu | PENDING | RegistrationStatus |
| Disetujui | APPROVED | RegistrationStatus |
| Ditolak | REJECTED | RegistrationStatus |
| Kedaluwarsa | EXPIRED | RegistrationStatus |

---

# 11. Notification Status

| Indonesian | English | Enum |
|------------|----------|------|
| Belum Dibaca | UNREAD | NotificationStatus |
| Sudah Dibaca | READ | NotificationStatus |

---

# 12. Activity Log Actions

The following action names MUST be used throughout the project.

## Authentication

| Action | Description |
|----------|-------------|
| LOGIN | User signed in |
| LOGOUT | User signed out |

---

## RT

| Action | Description |
|----------|-------------|
| CREATE_RT | Create RT |
| UPDATE_RT | Update RT |
| ARCHIVE_RT | Archive RT |

---

## Resident

| Action | Description |
|----------|-------------|
| CREATE_RESIDENT | Create resident |
| UPDATE_RESIDENT | Update resident |
| DELETE_RESIDENT | Delete resident |

---

## User

| Action | Description |
|----------|-------------|
| CREATE_USER | Create user |
| UPDATE_USER | Update user |
| DELETE_USER | Delete user |
| CHANGE_ROLE | Change user role |

---

## RT Registration

| Action | Description |
|----------|-------------|
| RT_REGISTER_REQUEST | Submit RT registration |
| RT_REGISTER_APPROVED | Approve RT registration |
| RT_REGISTER_REJECTED | Reject RT registration |
| RT_ACTIVATED | Activate RT |

---

## Resident Registration

| Action | Description |
|----------|-------------|
| RESIDENT_REGISTER_REQUEST | Submit resident registration |
| RESIDENT_REGISTER_APPROVED | Approve resident registration |
| RESIDENT_REGISTER_REJECTED | Reject resident registration |
| RESIDENT_ACTIVATED | Activate resident account |

---

## Payment

| Action | Description |
|----------|-------------|
| CREATE_PAYMENT | Submit payment |
| UPDATE_PAYMENT | Update payment |
| APPROVE_PAYMENT | Approve payment |
| REJECT_PAYMENT | Reject payment |
| CANCEL_PAYMENT | Cancel payment |

---

## Expense

| Action | Description |
|----------|-------------|
| CREATE_EXPENSE | Create expense |
| UPDATE_EXPENSE | Update expense |
| DELETE_EXPENSE | Delete expense |

---

## Ledger

| Action | Description |
|----------|-------------|
| CREATE_LEDGER_ENTRY | Create ledger entry |
| ADJUST_LEDGER | Manual adjustment |

---

## Notification

| Action | Description |
|----------|-------------|
| SEND_NOTIFICATION | Send notification |
| MARK_NOTIFICATION_READ | Mark notification as read |
| RESEND_ACTIVATION | Resend activation email |

---

## Export

| Action | Description |
|----------|-------------|
| EXPORT_CSV | Export CSV |
| EXPORT_EXCEL | Export Excel |

---

# 13. Naming Examples

Good

PaymentService

ResidentRepository

NotificationBadge

LedgerEntry

ResidentRegistration

Bad

PembayaranService

DataWarga

user_data

TblPayment

---

# 14. Reserved Prefixes

Use prefixes consistently.

| Prefix | Example |
|----------|---------|
| is | isActive |
| has | hasPermission |
| can | canApprove |
| should | shouldNotify |

---

# 15. Final Principles

One concept must have one official English translation.

Never invent a new translation if it already exists in this document.

All new modules must update this glossary.

---

End of Document