-- Seed default storage buckets for Novel Vibe.
-- "novels" stores all Markdown documents (frontmatter + body).
-- "skills" stores installed agent skill packages.

INSERT INTO storage.buckets (name, public)
VALUES ('novels', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (name, public)
VALUES ('skills', false)
ON CONFLICT DO NOTHING;
