-- Kingdom SkillBridge: Delete all users and related data
-- Run this in Supabase SQL Editor (requires auth schema access)

-- Delete in reverse-dependency order (safety net; CASCADE should handle it)
DELETE FROM public.certifications;
DELETE FROM public.goals;
DELETE FROM public.mentorship_sessions;
DELETE FROM public.mentor_matches;
DELETE FROM public.mentor_profiles;
DELETE FROM public.tasks;
DELETE FROM public.project_members;
DELETE FROM public.projects;
DELETE FROM public.applications;
DELETE FROM public.enrollments;
DELETE FROM public.modules;
DELETE FROM public.skill_tracks;
DELETE FROM public.org_memberships;
DELETE FROM public.profiles;
DELETE FROM public.users;

-- Finally delete from auth.users (this cascades to public.users)
DELETE FROM auth.users;

-- Reset sequences if any (not strictly needed for UUIDs)
