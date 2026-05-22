-- Migration: Add user-level ownership and install metadata to skill_registry
-- Adds user_id for per-user skill ownership (NULL = built-in/shared)
-- Adds source to distinguish built-in skills from user-installed
-- Adds install_url for GitHub-installed skills
-- Adds metadata JSONB for extended frontmatter fields (mode, icon, etc.)

ALTER TABLE public.skill_registry
  ADD COLUMN IF NOT EXISTS user_id    TEXT,
  ADD COLUMN IF NOT EXISTS source     TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS install_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata   JSONB;

CREATE INDEX IF NOT EXISTS idx_skill_registry_user ON public.skill_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_registry_source ON public.skill_registry(source);
