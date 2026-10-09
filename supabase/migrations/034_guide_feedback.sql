-- 034_guide_feedback.sql
-- Records whether authenticated users found a guide section helpful.

CREATE TABLE IF NOT EXISTS guide_section_feedback (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id  uuid        NOT NULL REFERENCES guide_sections(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
    is_helpful  boolean     NOT NULL,
    created_at  timestamptz DEFAULT now(),
    UNIQUE (section_id, user_id)
);

ALTER TABLE guide_section_feedback ENABLE ROW LEVEL SECURITY;

-- Each authenticated user can upsert their own feedback row only.
CREATE POLICY guide_feedback_self ON guide_section_feedback
    FOR ALL
    TO authenticated
    USING     (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
