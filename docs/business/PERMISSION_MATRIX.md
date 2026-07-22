# PERMISSION_MATRIX.md

> Project: KasWarga

Version: 1.0

---

# Purpose

This document defines permissions for every role in KasWarga.

Permission changes must update this document before implementation.

---

Legend

| Symbol | Meaning |
|---------|----------|
| ✅ | Allowed |
| ❌ | Not Allowed |
| 👁 | Read Only |
| ⚡ | Own Data Only |

---

# Roles

- Super Administrator
- RT Chair
- RT Administrator
- Treasurer
- Resident

---

# RT

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| Create RT | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve RT | ✅ | ❌ | ❌ | ❌ | ❌ |
| Archive RT | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update RT Profile | 👁 | ✅ | ✅ | ❌ | ❌ |

---

# Residents

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| View Residents | ❌ | ✅ | ✅ | 👁 | 👁 |
| Create Resident | ❌ | ✅ | ✅ | ❌ | ❌ |
| Update Resident | ❌ | ✅ | ✅ | ❌ | ❌ |
| Delete Resident | ❌ | ✅ | ✅ | ❌ | ❌ |

---

# Resident Registration

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| Submit | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve | ❌ | ✅ | ✅ | ❌ | ❌ |
| Reject | ❌ | ✅ | ✅ | ❌ | ❌ |

---

# Payments

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| Submit Payment | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Payments | ❌ | 👁 | 👁 | ✅ | ⚡ |
| Approve | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reject | ❌ | ❌ | ❌ | ✅ | ❌ |
| Export | ❌ | 👁 | 👁 | ✅ | ❌ |

---

# Expenses

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| View | ❌ | 👁 | 👁 | ✅ | 👁 |
| Create | ❌ | ❌ | ❌ | ✅ | ❌ |
| Update | ❌ | ❌ | ❌ | ✅ | ❌ |
| Delete | ❌ | ❌ | ❌ | ✅ | ❌ |

---

# Ledger

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| View | ❌ | 👁 | 👁 | ✅ | 👁 |
| Adjustment | ❌ | ❌ | ❌ | ✅ | ❌ |

---

# Dashboard

| Action | Super | 👁 | 👁 | 👁 | 👁 |
|---------|--------|--------|---------|------------|------------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |

Super Administrator sees only global statistics.

RT roles see RT-specific data.

Residents see only personal dashboard.

---

# Notifications

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark Read | ✅ | ✅ | ✅ | ✅ | ✅ |

Only owner may modify notification state.

---

# Activity Log

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| View | ✅ | 👁 | 👁 | 👁 | 👁 |

Only Super Administrator can view global logs.

RT roles may view logs for their RT.

---

# User Management

| Action | Super | Chair | Admin | Treasurer | Resident |
|---------|--------|--------|---------|------------|------------|
| Create User | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update User | ✅ | ❌ | ✅ | ❌ | ⚡ |
| Disable User | ✅ | ❌ | ✅ | ❌ | ❌ |
| Reset Password | ✅ | ❌ | ✅ | ❌ | ⚡ |

---

# Permission Principles

1. Least Privilege Principle.
2. Permissions are granted through Membership.
3. UI visibility does not imply backend authorization.
4. Authorization is always enforced server-side.
5. Every permission change must be audited.

---

End of Document