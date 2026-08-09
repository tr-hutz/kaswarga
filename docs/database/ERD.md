# ERD.md

> Project: KasWarga
>
> Version: 2.0 (RBAC v2)

---

# Purpose

This document describes the conceptual Entity Relationship Diagram (ERD) for KasWarga.

The ERD focuses on persistent data stored in PostgreSQL.

Runtime objects such as `RequestContext` and `AuthorizationContext` are intentionally excluded from the database model and are documented separately.

---

# Entity Relationship Diagram

```text
                               +----------------+
                               | neighborhoods  |
                               +----------------+
                               | id             |
                               | name           |
                               | ...            |
                               +-------+--------+
                                       |
                                       |
                                       | 1
                                       |
                                       | N
                               +-------v--------+
                               | memberships    |
                               +----------------+
                               | id             |
                               | user_id        |
                               | neighborhood_id|
                               | role_id        |
                               | status         |
                               +----+-------+---+
                                    |       |
                     N              |       | N
                     |              |       |
                     |              |       |
              +------v-----+        |       +-------------+
              | users      |        |                     |
              +------------+        |                     |
              | id         |        |                     |
              | email      |        |                     |
              | ...        |        |                     |
              +------------+        |                     |
                                    |                     |
                                    |1                    |1
                                    |                     |
                              +-----v------+       +------v------+
                              | roles      |       | residents   |
                              +------------+       +-------------+
                              | id         |       | id          |
                              | code       |       | ...         |
                              | name       |       +-------------+
                              +------+-----+
                                     |
                                     |1
                                     |
                                     |N
                          +----------v-----------+
                          | role_permissions     |
                          +----------------------+
                          | role_id             |
                          | permission_id       |
                          +----------+----------+
                                     |
                                     |N
                                     |
                                     |1
                          +----------v-----------+
                          | permissions          |
                          +----------------------+
                          | id                  |
                          | code               |
                          | module             |
                          | description        |
                          +----------+----------+
                                     ^
                                     |
                                     |
                                     |
                          +----------+-----------+
                          | permission_overrides |
                          +-----------------------+
                          | id                   |
                          | neighborhood_id      |
                          | role_id             |
                          | permission_id       |
                          | allow              |
                          +---------------------+
```

---

# Authorization Relationship

The authorization model is built using four persistent entities.

```text
Role

↓

Role Permission

↓

Permission

↓

Permission Override (optional)
```

Effective authorization is calculated dynamically at runtime.

---

# Membership Relationship

A User may belong to multiple Neighborhoods.

Each Membership has exactly one assigned Role.

```text
User

↓

Membership

↓

Neighborhood

↓

Role
```

Membership represents organizational participation.

It does not directly determine authorization.

---

# Permission Model

Permissions are reusable capabilities.

Examples:

- resident.view
- resident.create
- resident.update
- resident.delete
- payment.view
- payment.approve
- payment.reject
- expense.create
- income.view
- income.approve
- ledger.view
- report.export

Permissions never reference users directly.

---

# Role Permission Model

Roles define the default permission set.

```text
Role

↓

Role Permission

↓

Permission
```

Every RT initially inherits these permissions.

---

# Permission Override Model

RTs may customize permissions independently.

```text
Role Permission

↓

Permission Override

↓

Effective Permission
```

Overrides never modify the global Role.

They only affect the specified Neighborhood.

---

# Runtime Authorization (Conceptual)

The following objects are runtime-only.

They are **NOT** stored in PostgreSQL.

```text
Authenticated User

↓

PermissionService

↓

AuthorizationContext

↓

RequestContext

↓

Business Services
```

AuthorizationContext calculates the effective permissions for the active request.

RequestContext becomes the root object consumed by Business Services.

---

# Design Principles

The KasWarga authorization model follows these principles.

- Users never receive permissions directly.
- Permissions are granted through Roles.
- Roles may be customized per Neighborhood.
- Business Services consume AuthorizationContext.
- PostgreSQL RLS remains the final authorization layer.
- Runtime objects are intentionally separated from persistent entities.

---

# Legend

| Symbol | Meaning |
|---------|----------|
| 1 | One |
| N | Many |

---

# Notes

This ERD documents only persistent entities.

Runtime components such as:

- RequestContext
- AuthorizationContext
- PermissionService

belong to the application architecture and are documented separately in:

- AUTHORIZATION_ARCHITECTURE.md
- REQUEST_CONTEXT.md
- PERMISSION_SERVICE.md
- AUTHORIZATION_PIPELINE.md