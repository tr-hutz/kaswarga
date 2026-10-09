# USER_GUIDE_FEATURE.md

> Project: KasWarga
>
> Version: 1.0
>
> Last Updated: September 2026

---

# 1. Overview

The User Guide feature provides an in-app documentation system for KasWarga.

Authenticated residents and administrators can browse categorized, multi-language guide articles directly inside the application without leaving to an external help site.

Super Admins manage the guide content — creating sections, writing markdown articles, uploading images, and publishing or drafting each section — through a dedicated management page.

---

# 2. Goals

- Reduce support burden by making self-service answers available inside the app.
- Allow role-targeted content so residents see relevant sections only.
- Support multi-language content (Indonesian and English) without a separate CMS.
- Give Super Admins visibility into which sections users find helpful.

---

# 3. Access Rules

| Who | Where | What they can do |
|---|---|---|
| Unauthenticated user | `/help` | Redirected to `/login` |
| Any authenticated user | `/help` | Read published sections (role-filtered) |
| Super Admin | `/settings/guide` | Full CRUD: create, edit, delete sections and translations |
| Other roles | `/settings/guide` | Access denied (403) |

---

# 4. Database Schema

## 4.1 `guide_sections`

Metadata for each guide article. Does not store content directly.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `category` | text | `quick_start`, `feature`, `faq`, `general` |
| `position` | integer | Display order within the category |
| `is_published` | boolean | `false` = draft, not visible to users |
| `target_roles` | text[] \| null | `null` = visible to all roles; otherwise a list of role codes |
| `created_by` | uuid | FK → `auth.users` |
| `updated_by` | uuid | FK → `auth.users` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Displayed as "Last updated" in the public view |

## 4.2 `guide_section_translations`

Stores the actual content per locale.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `section_id` | uuid | FK → `guide_sections` (CASCADE DELETE) |
| `locale` | text | `CHECK IN ('id', 'en')` |
| `title` | text | |
| `body` | text | Markdown |
| `UNIQUE` | — | `(section_id, locale)` |

## 4.3 `guide_section_feedback`

Records per-user helpful / not-helpful votes. Created by migration `034`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `section_id` | uuid | FK → `guide_sections` (CASCADE DELETE) |
| `user_id` | uuid | FK → `auth.users` (CASCADE DELETE) |
| `is_helpful` | boolean | `true` = helpful, `false` = not helpful |
| `created_at` | timestamptz | |
| `UNIQUE` | — | `(section_id, user_id)` — one vote per user per section |

---

# 5. RLS Policies

| Table | Policy | Rule |
|---|---|---|
| `guide_sections` | `guide_sections_auth_read` | `TO authenticated WHERE is_published = true` |
| `guide_section_translations` | `guide_section_translations_auth_read` | `TO authenticated WHERE EXISTS (published parent section)` |
| `guide_section_feedback` | `guide_feedback_self` | `FOR ALL TO authenticated USING/WITH CHECK user_id = auth.uid()` |

All write operations on `guide_sections` and `guide_section_translations` are performed via the **service role** (Super Admin API routes using `supabaseAdmin`), bypassing RLS entirely.

---

# 6. Content Categories

| Category | Key | Display order |
|---|---|---|
| Quick Start | `quick_start` | 1st |
| Features | `feature` | 2nd |
| FAQ | `faq` | 3rd |
| General | `general` | 4th |

The display order is enforced client-side by `CATEGORY_ORDER` in `GuidePublicView.tsx`. The database sorts by `category ASC, position ASC` (alphabetical), so sections must be ordered by the constant, not the raw API response.

---

# 7. Multi-Language Support

Each guide section can have translations for any supported locale (`id`, `en`).

**Locale fallback**: When a user requests locale `en` but no English translation exists for a section, the API falls back to the `id` translation rather than hiding the section.

**Locale switcher**: The language toggle in the public view is only rendered when the database contains published translations in more than one locale. This is determined dynamically by `findAvailableLocales()`, which queries distinct locales from `guide_section_translations` joined to published sections.

---

# 8. Role-Aware Content

The `target_roles` column on `guide_sections` controls visibility per role.

| Value | Meaning |
|---|---|
| `null` | Visible to all authenticated roles |
| `['RESIDENT']` | Visible to residents only |
| `['RT_CHAIR', 'TREASURER']` | Visible to those two roles only |

Filtering is applied **server-side** in `findPublishedSections()` — the section is excluded entirely from the API response if the requester's role does not match.

---

# 9. File Structure

```
features/guide/
  GuidePublicView.tsx          # Public reading view (search, TOC, markdown, feedback)
  GuideAdminView.tsx           # Super Admin management list (search, feedback counts, inline edit)
  hooks/
    useGuideAdmin.ts           # State + CRUD logic for admin view
  components/
    GuideSectionForm.tsx       # Create / edit form with markdown toolbar + image upload
    GuideMarkdown.tsx          # react-markdown renderer with custom Tailwind component map
    GuideFeedback.tsx          # "Was this helpful?" thumbs up / down widget

lib/
  repositories/guide.repository.ts   # All DB queries + Storage cleanup helpers
  services/guide.service.ts          # Business rules, Super Admin guard

app/
  help/page.tsx                       # Public guide page (auth required, redirects to /login)
  settings/guide/page.tsx             # Admin management page (Super Admin only)
  api/guide/
    route.ts                          # GET (list sections), POST (create section)
    [id]/
      route.ts                        # PATCH (edit section), DELETE (delete section)
      translations/route.ts           # PUT (upsert a single translation)
      feedback/route.ts               # POST (record helpful / not-helpful vote)
    upload/route.ts                   # POST (upload image to Supabase Storage)
```

---

# 10. Markdown Editor

`GuideSectionForm` provides a plain-textarea editor with a toolbar. No external WYSIWYG library is used.

## 10.1 Toolbar Actions

| Button | Action type | Result |
|---|---|---|
| H1 | `line` | Prepends `# ` to current line |
| H2 | `line` | Prepends `## ` to current line |
| Bold | `wrap` | Wraps selection with `**` |
| Italic | `wrap` | Wraps selection with `*` |
| Bullet | `line` | Prepends `- ` to current line |
| Numbered | `line` | Prepends `1. ` to current line |
| Link | `wrap` | Wraps selection as `[text](url)` |
| Separator | `block` | Inserts `---` on its own line |
| Image | `upload` | Opens OS file picker → uploads to Storage → inserts `![alt](url)` |

Cursor position is preserved after every action using `selectionStart` / `selectionEnd` on the raw textarea ref.

## 10.2 Image Upload

1. User clicks the image button (📷) in the toolbar.
2. OS file picker opens (accept: PNG, JPG, GIF, WebP, SVG; max 10 MB).
3. File is POSTed to `POST /api/guide/upload`.
4. The server uploads to the `guide-assets` Supabase Storage bucket using the service role key.
5. The public URL is returned and inserted as `![alt](url)` at the cursor position.

## 10.3 Multi-locale Editing

The form shows a locale tab switcher (`Bahasa Indonesia` / `English`). Each locale has its own title and body field. Switching tabs preserves unsaved content for both locales in component state. On save, only the active locale's translation is sent to the API.

---

# 11. Supabase Storage — `guide-assets` Bucket

| Property | Value |
|---|---|
| Bucket name | `guide-assets` |
| Access | Public (no auth header required to view images) |
| Upload | Server-side only via service role (`POST /api/guide/upload`) |
| Max file size | 10 MB |
| Allowed MIME types | `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml` |
| Filename convention | `{timestamp}-{sanitized-original-name}` |

## 11.1 Orphan Image Cleanup

When a translation body is updated or a section is deleted, the repository automatically removes any guide-assets Storage files that are no longer referenced.

**On body update (`updateSection`, `upsertTranslation`)**:
1. Fetch the existing body from DB before overwriting.
2. Extract all `guide-assets` file paths from the old body using a regex over `![...](url)` patterns.
3. Extract all paths from the new body.
4. Delete files present in old but absent in new.

**On section delete (`deleteSection`)**:
1. Fetch all translations for the section.
2. Extract all `guide-assets` file paths across every translation.
3. Delete all those files from Storage.
4. Delete the DB row (cascades to translations and feedback).

This ensures no orphaned files accumulate in Storage over time.

---

# 12. Feedback System

Each guide article shows a "Was this helpful?" widget at the bottom of the content.

- Users vote once per section per session. Subsequent clicks on the same article are no-ops in the UI (vote state tracked in React component state, not re-fetched on load).
- Votes are upserted: if a user changes their mind on a return visit, the old vote is replaced.
- Super Admins see aggregated counts (👍 N helpful · 👎 N not helpful) on the `/settings/guide` management list.
- Counts are fetched server-side as part of `findAllSectionsWithTranslations()` and included in the admin API response.

---

# 13. Seed Data

## 13.1 DB Seed (`033_guide_seed.sql`)

Inserts 14 pre-defined sections in both Indonesian and English:

| Category | Sections |
|---|---|
| Quick Start (4) | Welcome, How to Log In, Basic Navigation, Change Your Password |
| Feature (5) | Managing Resident Data, Recording Dues Payments, Recording Expenses, Financial Reports, Member Management |
| FAQ (5) | Forgot Your Password?, How to Register a New RT?, Is My Data Secure?, Who Can View Financial Data?, How to Export a Report? |

## 13.2 Image Seed (`seed-guide-assets.mjs`)

Uploads images from `scripts/guide-assets/` to the `guide-assets` Storage bucket and replaces `[GUIDE_IMG:filename.png]` placeholders in `guide_section_translations.body` with actual public URLs.

**Usage**:
```bash
# Drop images into scripts/guide-assets/
# Add [GUIDE_IMG:filename.png] placeholders in the guide body (SQL seed or admin UI)
npm run seed:guide-assets
```

---

# 14. API Reference

## GET `/api/guide`

| Query param | Type | Description |
|---|---|---|
| `locale` | `id` \| `en` | Content language (default: `id`) |
| `admin` | `true` | Return all sections with translations and feedback counts (Super Admin only) |

**Response (public)**: `GuideRow[]` — sections with merged translation (locale fallback applied).

**Response (admin)**: `GuideAdminRow[]` — sections with all translations array and feedback counts.

## POST `/api/guide`

Creates a new guide section with an initial translation. Super Admin only.

**Body**: `{ category, position, is_published, target_roles, locale, title, body }`

## PATCH `/api/guide/[id]`

Updates an existing section's metadata and/or one locale's translation. Super Admin only.

**Body**: `{ category?, position?, is_published?, target_roles?, locale, title?, body? }`

## DELETE `/api/guide/[id]`

Deletes a section, all its translations, all its feedback rows, and all referenced Storage images. Super Admin only.

## PUT `/api/guide/[id]/translations`

Upserts a translation for a specific locale. Super Admin only.

**Body**: `{ locale, title, body }`

## POST `/api/guide/[id]/feedback`

Records or updates the current user's helpful / not-helpful vote.

**Body**: `{ is_helpful: boolean }`

**Response**: `204 No Content`

## POST `/api/guide/upload`

Uploads an image to the `guide-assets` Storage bucket. Any authenticated user.

**Body**: `multipart/form-data` with field `file` (image file).

**Response**: `{ url: string, filename: string }`

---

# 15. Navigation

The guide is accessible from the **topbar**, right of the theme toggle button, via the book icon (`book-open`). The link points to `/help`.

The guide link appears in the topbar for all authenticated users regardless of role. It is not in the sidebar.

Super Admin guide management is reachable via **Settings → Guide** (`/settings/guide`).

---

# 16. Adding a New Locale

1. Add the locale code to the `CHECK` constraint in `guide_section_translations.locale` (migration required).
2. Add the locale to the `LOCALES` array in `GuideSectionForm.tsx`.
3. Add the locale label to `LOCALE_LABELS` in `GuidePublicView.tsx`.
4. Add the locale label to `guide.locales` in `i18n/id.json`.
5. Seed translations for the new locale via the admin UI or a SQL seed block.

---

# 17. Related Documents

| Document | Relationship |
|---|---|
| `docs/architecture/ARCHITECTURE.md` | Overall layered architecture this feature follows |
| `docs/database/DATABASE_SCHEMA.md` | Full schema reference — guide tables listed there |
| `docs/business/PERMISSION_MATRIX.md` | `guide.view` and `guide.manage` permission definitions |
| `docs/database/RLS_POLICY.md` | RLS policies for guide tables |
| `docs/development/GLOSSARY.md` | Domain terminology used in this feature |
