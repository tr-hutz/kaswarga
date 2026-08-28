# DEFAULT_ROLE_MATRIX.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document defines the default role-to-permission assignments shipped with KasWarga.

These assignments represent the **initial authorization model** created during database seeding.

They are **not** the final authorization state.

Each RT may customize permissions through Permission Override after deployment.

---

# Relationship to Permission Catalog

Permission definitions are maintained exclusively in:

```
PERMISSION_CATALOG.md
```

This document only specifies which permissions are assigned to each default role during initial installation.

---

# Authorization Model

```
Permission Catalog
        │
        ▼
Default Role Matrix
        │
        ▼
Database Seeder
        │
        ▼
role_permissions
        │
        ▼
Permission Override
        │
        ▼
Effective Permission
```

---

# Default Roles

KasWarga provides the following built-in roles.

| Role | Description |
|------|-------------|
| Administrator | Full RT administration |
| Ketua | RT leader |
| Bendahara | Financial management |
| Sekretaris | Administrative management |
| Warga | Standard resident |

These roles are intended as starting templates only.

---

# Default Permission Matrix

| Permission | Admin | Ketua | Bendahara | Sekretaris | Warga |
|------------|:----:|:------:|:----------:|:-----------:|:------:|
| resident.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| resident.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| resident.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| resident.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| resident.approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| resident.reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| membership.view | ✅ | ✅ | ❌ | ✅ | ❌ |
| membership.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| membership.update | ✅ | ✅ | ❌ | ❌ | ❌ |
| membership.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| payment.view | ✅ | ✅ | ✅ | ❌ | ✅ |
| payment.create | ✅ | ✅ | ✅ | ❌ | ✅ |
| payment.update | ✅ | ❌ | ✅ | ❌ | ❌ |
| payment.delete | ✅ | ❌ | ✅ | ❌ | ❌ |
| payment.approve | ✅ | ❌ | ✅ | ❌ | ❌ |
| payment.reject | ✅ | ❌ | ✅ | ❌ | ❌ |
| expense.view | ✅ | ✅ | ✅ | ❌ | ✅ |
| expense.create | ✅ | ❌ | ✅ | ❌ | ❌ |
| expense.update | ✅ | ❌ | ✅ | ❌ | ❌ |
| expense.delete | ✅ | ❌ | ✅ | ❌ | ❌ |
| income.view | ✅ | ✅ | ✅ | ❌ | ❌ |
| income.create | ✅ | ❌ | ✅ | ❌ | ❌ |
| income.update | ✅ | ❌ | ✅ | ❌ | ❌ |
| income.delete | ✅ | ❌ | ✅ | ❌ | ❌ |
| income.approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| income.reject | ✅ | ✅ | ✅ | ❌ | ❌ |
| income.export | ✅ | ❌ | ✅ | ❌ | ❌ |
| income.import | ✅ | ❌ | ✅ | ❌ | ❌ |
| ledger.view | ✅ | ✅ | ✅ | ❌ | ✅ |
| ledger.export | ✅ | ✅ | ✅ | ❌ | ❌ |
| report.view | ✅ | ✅ | ✅ | ✅ | ❌ |
| report.export | ✅ | ✅ | ✅ | ✅ | ❌ |
| announcement.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| announcement.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| announcement.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| announcement.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| event.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| event.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| event.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| event.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| document.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| document.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| document.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| document.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.update | ✅ | ✅ | ❌ | ❌ | ❌ |
| user.view | ✅ | ❌ | ❌ | ❌ | ❌ |
| user.create | ✅ | ❌ | ❌ | ❌ | ❌ |
| user.update | ✅ | ❌ | ❌ | ❌ | ❌ |
| user.delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| role.view | ✅ | ❌ | ❌ | ❌ | ❌ |
| role.update | ✅ | ❌ | ❌ | ❌ | ❌ |
| permission.view | ✅ | ❌ | ❌ | ❌ | ❌ |
| permission.override | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit.view | ✅ | ❌ | ❌ | ❌ | ❌ |

---

# Seeder Behavior

During initial installation, the database seeder creates:

- Default Roles
- Permission Catalog
- Default Role-Permission assignments

The Seeder must never create Permission Overrides.

---

# Permission Override

The Default Role Matrix is immutable.

RT-specific customization is implemented using:

```
permission_overrides
```

Overrides may:

- Grant additional permissions
- Revoke default permissions

without modifying this matrix.

---

# Design Principles

The Default Role Matrix follows these principles.

- Roles are templates.
- Permissions define capabilities.
- Overrides define local policy.
- Business Rules never depend on Role names.
- Authorization is evaluated using Effective Permission.

---

# Future Roles

Future system roles may be introduced without changing the RBAC architecture.

Examples include:

- Auditor
- Operator
- Collector
- Security Officer

Each new role should receive a default permission assignment before being released.

---

# References

This document complements:

- PERMISSION_CATALOG.md
- DATABASE_SCHEMA.md
- BUSINESS_RULES.md
- AUTHORIZATION_ARCHITECTURE.md
- PERMISSION_SERVICE.md