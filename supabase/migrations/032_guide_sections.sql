-- Guide sections: platform-level content managed by Super Admin
-- No rt_id — this is application-wide documentation

CREATE TABLE guide_sections (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text        NOT NULL,
    body         text        NOT NULL DEFAULT '',
    category     text        NOT NULL DEFAULT 'general'
                             CHECK (category IN ('quick_start', 'feature', 'faq', 'general')),
    position     integer     NOT NULL DEFAULT 0,
    is_published boolean     NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    updated_by   uuid        REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Public can read published sections; writes are handled by service role only
ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guide_sections_public_read"
    ON guide_sections
    FOR SELECT
    USING (is_published = true);
