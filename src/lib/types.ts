export type UserRole = 'youth' | 'mentor' | 'trainer' | 'org_admin' | 'super_admin';

export type OrgType = 'church' | 'campus' | 'ngo';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ModuleType = 'video' | 'article' | 'quiz' | 'audio' | 'document';

export type MatchStatus = 'pending' | 'active' | 'completed';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export type GoalStatus = 'open' | 'in_progress' | 'achieved';

export type OpportunityType = 'internship' | 'job' | 'gig' | 'volunteer';

export type ApplicationStatus = 'applied' | 'reviewed' | 'accepted' | 'rejected';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

export type MembershipRole = 'admin' | 'member';

export type MembershipStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  skill_tags: string[];
  org_id: string | null;
  linkedin_url: string | null;
}

export interface Organisation {
  id: string;
  name: string;
  type: OrgType;
  country: string;
  subscription_tier: SubscriptionTier;
  logo_url: string | null;
  created_at: string;
}

export interface OrgMembership {
  id: string;
  user_id: string;
  org_id: string;
  role: MembershipRole;
  joined_at: string;
  status: MembershipStatus;
}

export interface SkillTrack {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
  created_by: string;
  is_published: boolean;
  modules?: Module[];
}

export interface Module {
  id: string;
  track_id: string;
  title: string;
  content_url: string | null;
  content_body: string | null;
  type: ModuleType;
  order_index: number;
  duration_mins: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  track_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_pct: number;
  certificate_url: string | null;
  track?: SkillTrack;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  skill_tags: string[];
  availability_hrs_per_week: number;
  rating_avg: number;
  total_mentees: number;
  is_active: boolean;
  profile?: Profile;
}

export interface MentorMatch {
  id: string;
  youth_id: string;
  mentor_id: string;
  status: MatchStatus;
  matched_at: string;
  score: number;
  mentor_profile?: MentorProfile;
  youth_profile?: Profile;
}

export interface MentorshipSession {
  id: string;
  match_id: string;
  scheduled_at: string;
  duration_mins: number;
  notes: string | null;
  status: SessionStatus;
}

export interface Goal {
  id: string;
  match_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: GoalStatus;
}

export interface Opportunity {
  id: string;
  org_id: string;
  title: string;
  type: OpportunityType;
  description: string;
  skills_required: string[];
  deadline: string | null;
  is_active: boolean;
  organisation?: Organisation;
}

export interface Application {
  id: string;
  user_id: string;
  opportunity_id: string;
  cover_note: string | null;
  applied_at: string;
  status: ApplicationStatus;
  opportunity?: Opportunity;
  user?: User;
  profile?: Profile;
}

export interface Project {
  id: string;
  team_lead_id: string;
  org_id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  tasks?: Task[];
  members?: Profile[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  assigned_to: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  assignee?: Profile;
}

export interface Certification {
  id: string;
  user_id: string;
  track_id: string;
  issued_at: string;
  cert_uid: string;
  verification_url: string;
  user?: User;
  profile?: Profile;
  track?: SkillTrack;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  meta?: Record<string, any>;
}
