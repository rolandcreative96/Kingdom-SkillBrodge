import { Profile, MentorProfile } from './types';

export interface MatchScore {
  mentor: MentorProfile & { profile?: Profile };
  score: number;
  skill_overlap: number;
  availability_fit: number;
  org_affinity: number;
  language_match: number;
}

export function calculateMatchScore(
  youth: Profile,
  mentor: MentorProfile & { profile?: Profile },
  mentorOrgId: string | null
): MatchScore {
  const youthSkills = youth.skill_tags || [];
  const mentorSkills = mentor.skill_tags || [];
  const youthOrgId = youth.org_id;

  const intersection = youthSkills.filter((s) =>
    mentorSkills.map((ms) => ms.toLowerCase()).includes(s.toLowerCase())
  );
  const skill_overlap = youthSkills.length > 0 ? intersection.length / youthSkills.length : 0;

  const availability_fit = mentor.availability_hrs_per_week >= 2 ? 1.0 : 0.5;

  const org_affinity =
    youthOrgId && mentorOrgId && youthOrgId === mentorOrgId
      ? 1.0
      : 0.0;

  const language_match = 1.0;

  const score =
    0.5 * skill_overlap +
    0.25 * availability_fit +
    0.15 * org_affinity +
    0.1 * language_match;

  return {
    mentor,
    score: Math.round(score * 100) / 100,
    skill_overlap: Math.round(skill_overlap * 100) / 100,
    availability_fit,
    org_affinity,
    language_match,
  };
}

export function rankMentors(
  youth: Profile,
  mentors: (MentorProfile & { profile?: Profile })[],
  mentorOrgIds: Record<string, string | null>
): MatchScore[] {
  const scored = mentors.map((mentor) =>
    calculateMatchScore(youth, mentor, mentorOrgIds[mentor.user_id] || null)
  );
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
