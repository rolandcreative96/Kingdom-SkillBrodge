-- Migration: Add audio, document types and content_body to modules
-- Run this in Supabase SQL Editor if you already ran schema.sql

ALTER TYPE public.module_type ADD VALUE IF NOT EXISTS 'audio';
ALTER TYPE public.module_type ADD VALUE IF NOT EXISTS 'document';

ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS content_body TEXT;
ALTER TABLE public.modules ALTER COLUMN content_url DROP NOT NULL;

-- RLS policies for module management
CREATE POLICY IF NOT EXISTS "modules_insert" ON public.modules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

CREATE POLICY IF NOT EXISTS "modules_update" ON public.modules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

CREATE POLICY IF NOT EXISTS "modules_delete" ON public.modules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

-- Storage bucket for lesson content
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-content', 'lesson-content', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to lesson-content
CREATE POLICY "allow_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lesson-content' AND auth.role() = 'authenticated');

CREATE POLICY "allow_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson-content');
