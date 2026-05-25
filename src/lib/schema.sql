-- Kingdom SkillBridge Database Schema
-- Supabase SQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('youth', 'mentor', 'trainer', 'org_admin', 'super_admin');
CREATE TYPE org_type AS ENUM ('church', 'campus', 'ngo');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE module_type AS ENUM ('video', 'article', 'quiz', 'audio', 'document');
CREATE TYPE match_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE goal_status AS ENUM ('open', 'in_progress', 'achieved');
CREATE TYPE opportunity_type AS ENUM ('internship', 'job', 'gig', 'volunteer');
CREATE TYPE application_status AS ENUM ('applied', 'reviewed', 'accepted', 'rejected');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'archived');
CREATE TYPE membership_role AS ENUM ('admin', 'member');
CREATE TYPE membership_status AS ENUM ('active', 'inactive');

-- Users table (managed by Supabase Auth, we extend it)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'youth',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'church',
  country TEXT NOT NULL DEFAULT 'Nigeria',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status membership_status NOT NULL DEFAULT 'active',
  UNIQUE(user_id, org_id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skill_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty difficulty NOT NULL DEFAULT 'beginner',
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_url TEXT,
  content_body TEXT,
  type module_type NOT NULL DEFAULT 'video',
  order_index INT NOT NULL DEFAULT 0,
  duration_mins INT NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  certificate_url TEXT,
  UNIQUE(user_id, track_id)
);

CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  availability_hrs_per_week NUMERIC(4,1) NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0.00,
  total_mentees INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.mentor_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'pending',
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score NUMERIC(4,3),
  UNIQUE(youth_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.mentor_matches(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_mins INT NOT NULL DEFAULT 30,
  notes TEXT,
  status session_status NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.mentor_matches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status goal_status NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type opportunity_type NOT NULL DEFAULT 'job',
  description TEXT NOT NULL,
  skills_required TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  cover_note TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status application_status NOT NULL DEFAULT 'applied',
  UNIQUE(user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id UUID NOT NULL REFERENCES public.users(id),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cert_uid TEXT NOT NULL UNIQUE,
  verification_url TEXT
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_track_id ON public.enrollments(track_id);
CREATE INDEX idx_mentor_matches_youth ON public.mentor_matches(youth_id);
CREATE INDEX idx_mentor_matches_mentor ON public.mentor_matches(mentor_id);
CREATE INDEX idx_mentorship_sessions_match ON public.mentorship_sessions(match_id);
CREATE INDEX idx_goals_match ON public.goals(match_id);
CREATE INDEX idx_opportunities_org ON public.opportunities(org_id);
CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX idx_projects_org ON public.projects(org_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_certifications_user ON public.certifications(user_id);
CREATE INDEX idx_certifications_uid ON public.certifications(cert_uid);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: org_isolation for tenant-scoped tables
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Profiles: users can read their own profile, org admins can read org profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR org_id = public.get_user_org_id()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Organisations
CREATE POLICY "orgs_select" ON public.organisations
  FOR SELECT USING (
    id = public.get_user_org_id()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'))
  );

-- Org memberships
CREATE POLICY "memberships_select" ON public.org_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR org_id = public.get_user_org_id()
  );

-- Skill tracks: any authenticated user can read published tracks
CREATE POLICY "tracks_select" ON public.skill_tracks
  FOR SELECT USING (is_published = true OR created_by = auth.uid());

-- Modules: any authenticated user can read modules of accessible tracks
CREATE POLICY "modules_select" ON public.modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (is_published = true OR created_by = auth.uid()))
  );

CREATE POLICY "modules_insert" ON public.modules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

CREATE POLICY "modules_update" ON public.modules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

CREATE POLICY "modules_delete" ON public.modules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.skill_tracks WHERE id = track_id AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'trainer', 'org_admin', 'super_admin'))
    ))
  );

-- Enrollments: own enrollment or org admin
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE USING (user_id = auth.uid());

-- Mentor profiles
CREATE POLICY "mentors_select" ON public.mentor_profiles
  FOR SELECT USING (is_active = true OR user_id = auth.uid());

-- Mentor matches
CREATE POLICY "matches_select" ON public.mentor_matches
  FOR SELECT USING (youth_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "matches_insert" ON public.mentor_matches
  FOR INSERT WITH CHECK (youth_id = auth.uid());

CREATE POLICY "matches_update" ON public.mentor_matches
  FOR UPDATE USING (youth_id = auth.uid() OR mentor_id = auth.uid());

-- Sessions
CREATE POLICY "sessions_select" ON public.mentorship_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mentor_matches WHERE id = match_id AND (youth_id = auth.uid() OR mentor_id = auth.uid()))
  );

-- Goals
CREATE POLICY "goals_select" ON public.goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mentor_matches WHERE id = match_id AND (youth_id = auth.uid() OR mentor_id = auth.uid()))
  );

-- Opportunities
CREATE POLICY "opps_select" ON public.opportunities
  FOR SELECT USING (is_active = true OR org_id = public.get_user_org_id());

-- Applications
CREATE POLICY "apps_select" ON public.applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "apps_insert" ON public.applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Projects
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (org_id = public.get_user_org_id());

-- Tasks
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = public.get_user_org_id())
  );

-- Certifications
CREATE POLICY "certs_select" ON public.certifications
  FOR SELECT USING (user_id = auth.uid());
