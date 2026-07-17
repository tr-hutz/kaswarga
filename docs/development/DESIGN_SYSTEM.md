# DESIGN_SYSTEM.md

# KasWarga Design System

> This document defines the UI design system used throughout the KasWarga application.
>
> The goal is to ensure visual consistency, maintainability, accessibility, and compatibility with future UI migrations.

---

# 1. Principles

The UI should be:

- Consistent
- Predictable
- Accessible
- Reusable
- Minimal
- Responsive

Business modules should never implement their own visual language.

---

# 2. Component Layers

The UI consists of three layers.

Business Features

↓

Common Components

↓

UI Components

↓

Third-party UI Library

Business modules must never depend directly on third-party UI libraries.

---

# 3. Folder Structure

```
components/

    common/

    layout/

    ui/
```

---

# 4. UI Components

The following UI components represent the project's Design System.

## Actions

```
Button
IconButton
DropdownButton
```

---

## Inputs

```
Input
Textarea
Checkbox
Switch
Radio
Select
MultiSelect
DatePicker
SearchInput
FileUpload
```

---

## Data Display

```
Badge
Avatar
Card
DataCard
StatCard
Tag
Tooltip
EmptyState
LoadingState
ErrorState
```

---

## Tables

```
DataTable
Pagination
FilterBar
ColumnSelector
ExportButton
```

---

## Navigation

```
Sidebar
Header
Breadcrumb
Tabs
Menu
Pagination
```

---

## Feedback

```
Dialog
ConfirmDialog
Toast
Alert
Progress
Skeleton
```

---

## Layout

```
AppShell
PageContainer
Section
Grid
Stack
```

---

# 5. Business Modules

Business modules should only compose existing components.

Example:

```
PaymentPage

↓

Card

↓

DataTable

↓

Dialog
```

Business modules should never create their own reusable UI components.

---

# 6. Generic Components

Generic functionality belongs inside:

```
components/common
```

Examples:

- DataTable
- SearchBox
- FilterBar
- Pagination
- Toolbar

Never duplicate them inside feature modules.

---

# 7. UI Wrapper Components

Every external UI library should be wrapped.

Example:

```
components/ui/Button

↓

TailAdmin Button
```

Business modules should only use:

```
<Button />
```

Never:

```
<TailAdminButton />
```

---

# 8. Icons

Icons should be wrapped.

Use:

```
<Icon
    name="payment"
/>
```

Never import icon libraries directly inside feature modules.

---

# 9. Colors

Never hardcode Tailwind colors.

Prefer semantic variants.

Example:

Good

```
variant="success"
```

Bad

```
text-green-600
```

Semantic variants:

- primary
- secondary
- success
- warning
- danger
- info
- neutral

---

# 10. Typography

Use predefined typography styles.

Examples:

```
PageTitle

SectionTitle

CardTitle

Body

Caption
```

Avoid arbitrary font sizes.

---

# 11. Spacing

Use consistent spacing scale.

Preferred values:

```
4
8
12
16
24
32
40
48
64
```

Avoid arbitrary spacing.

---

# 12. Responsive Design

Every page must support:

- Desktop
- Tablet
- Mobile

Avoid fixed widths whenever possible.

---

# 13. Accessibility

All interactive elements must:

- support keyboard navigation
- have visible focus
- include accessible labels
- support screen readers

---

# 14. Forms

Forms must use shared components.

Use:

```
Form
FormField
FormLabel
FormError
Input
Select
```

Avoid custom form layouts.

---

# 15. Tables

All modules must use the shared DataTable.

Features:

- server-side pagination
- server-side sorting
- server-side filtering
- server-side search
- export
- loading state
- empty state

Do not create feature-specific tables.

---

# 16. Dialogs

Use shared dialogs.

```
Dialog

ConfirmDialog
```

Never implement custom confirmation dialogs.

---

# 17. Notifications

Use centralized notification service.

Example:

```
notify.success()

notify.error()

notify.warning()
```

Never call toast libraries directly.

---

# 18. Loading States

Avoid blank screens.

Use:

```
LoadingState

Skeleton
```

---

# 19. Empty States

Every list page should display:

- title
- description
- action button (optional)

Never leave tables empty without explanation.

---

# 20. Error States

Display friendly error messages.

Provide retry actions whenever possible.

---

# 21. Internationalization

Never hardcode UI strings.

All visible text must come from next-intl.

---

# 22. Theme

The application should support future theming.

Business modules should never depend on theme implementation.

---

# 23. Future UI Migration

The project is currently migrating to a unified Design System.

Business modules must remain independent from the underlying UI framework.

Future migrations (TailAdmin or another library) should only affect:

```
components/ui
```

---

# 24. AI Rules

AI must:

- reuse existing UI components
- never duplicate components
- never import UI libraries directly
- follow this document before creating UI
- preserve consistency across all modules

---

# 25. Design Philosophy

KasWarga values:

Consistency over creativity.

Reuse over duplication.

Composition over inheritance.

Semantic components over visual components.

Business logic separated from presentation.

A change in UI framework should require minimal changes to business modules.

# 26. Component Ownership

components/ui

Responsible for:

- visual appearance
- theme
- third-party integration

components/common

Responsible for:

- reusable business-independent behavior

features/*

Responsible for:

- business logic
- page composition

services

Responsible for:

- business services
- data access

lib

Responsible for:

- utilities
- framework configuration