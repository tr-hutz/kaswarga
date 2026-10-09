-- Guide sections: platform-level content managed by Super Admin
-- No rt_id — this is application-wide documentation

CREATE TABLE guide_sections (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    category     text        NOT NULL DEFAULT 'general'
                             CHECK (category IN ('quick_start', 'feature', 'faq', 'general')),
    position     integer     NOT NULL DEFAULT 0,
    is_published boolean     NOT NULL DEFAULT false,
    target_roles text[]      NULL,   -- NULL = visible to all authenticated roles
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    updated_by   uuid        REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read published sections
CREATE POLICY "guide_sections_auth_read"
    ON guide_sections
    FOR SELECT
    TO authenticated
    USING (is_published = true);


-- Translations for guide sections (one row per section per locale)

CREATE TABLE guide_section_translations (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid        NOT NULL REFERENCES guide_sections (id) ON DELETE CASCADE,
    locale     text        NOT NULL CHECK (locale IN ('id', 'en')),
    title      text        NOT NULL,
    body       text        NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (section_id, locale)
);

ALTER TABLE guide_section_translations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read translations of published sections
CREATE POLICY "guide_section_translations_auth_read"
    ON guide_section_translations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM guide_sections gs
            WHERE gs.id = section_id AND gs.is_published = true
        )
    );
