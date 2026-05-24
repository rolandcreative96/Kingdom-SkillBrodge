'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Profile, Enrollment, MentorMatch, Goal, MentorshipSession, Certification } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import {
  BookOpen, Calendar, Target, Award, TrendingUp, ChevronRight,
  Bell, User, LogOut, Briefcase, Users, Plus, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function YouthDashboard() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeMatch, setActiveMatch] = useState<MentorMatch | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<MentorshipSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [opportunityCount, setOpportunityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(p);

    const { data: e } = await supabase
      .from('enrollments')
      .select('*, track:skill_tracks(*)')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false });
    setEnrollments(e || []);

    const { data: m } = await supabase
      .from('mentor_matches')
      .select('*, mentor_profile:mentor_profiles!mentor_id(*, profile:profiles(*))')
      .eq('youth_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    setActiveMatch(m);

    if (m) {
      const { data: sess } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('match_id', m.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });
      setUpcomingSessions(sess || []);

      const { data: g } = await supabase
        .from('goals')
        .select('*')
        .eq('match_id', m.id)
        .in('status', ['open', 'in_progress']);
      setGoals(g || []);
    }

    const { data: certsData } = await supabase
      .from('certifications')
      .select('*, track:skill_tracks(*)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });
    setCerts(certsData || []);

    if (p?.skill_tags && p.skill_tags.length > 0) {
      const { count } = await supabase
        .from('opportunities')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .contains('skills_required', p.skill_tags);
      setOpportunityCount(count || 0);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const activeTrack = enrollments.find((e) => e.completed_at === null);
  const completedCount = enrollments.filter((e) => e.completed_at !== null).length;
  const recentCert = certs[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KS</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/opportunities" className="text-gray-500 hover:text-gray-700">
                <Briefcase className="w-5 h-5" />
              </Link>
              <Link href="/mentors" className="text-gray-500 hover:text-gray-700">
                <Users className="w-5 h-5" />
              </Link>
              <button className="text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-5 h-5" />
              </button>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-lg">
              {profile?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-500">
              {enrollments.length > 0
                ? `${enrollments.length} enrolled · ${completedCount} completed`
                : 'Start learning today'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {activeTrack ? (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 col-span-1 md:col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Active Track</p>
                  <h3 className="text-lg font-semibold mt-1">{activeTrack.track?.title}</h3>
                </div>
                <BookOpen className="w-5 h-5 text-primary-500" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{activeTrack.progress_pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary-500 rounded-full h-2 transition-all"
                    style={{ width: `${activeTrack.progress_pct}%` }}
                  />
                </div>
              </div>
              <Link
                href={`/tracks/${activeTrack.track_id}`}
                className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                Continue learning <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <Link
              href="/tracks"
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-dashed hover:border-primary-300 transition flex items-center justify-center col-span-1"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Enroll in a track</p>
              </div>
            </Link>
          )}

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Upcoming</p>
                {upcomingSessions.length > 0 ? (
                  <h3 className="text-lg font-semibold mt-1">
                    {formatDate(upcomingSessions[0].scheduled_at)}
                  </h3>
                ) : (
                  <h3 className="text-lg font-semibold mt-1">No sessions</h3>
                )}
              </div>
              <Calendar className="w-5 h-5 text-gold-500" />
            </div>
            {upcomingSessions.length > 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                with Mentor · {upcomingSessions[0].duration_mins} min
              </p>
            ) : (
              <Link href="/mentors" className="mt-2 inline-flex items-center text-sm text-primary-600">
                Find a mentor <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Opportunities</p>
                <h3 className="text-lg font-semibold mt-1">{opportunityCount} matches</h3>
              </div>
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <Link
              href="/opportunities"
              className="mt-2 inline-flex items-center text-sm text-primary-600"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {enrollments.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" /> Continue Learning
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.slice(0, 3).map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/tracks/${enrollment.track_id}`}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition"
                >
                  <h4 className="font-medium">{enrollment.track?.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{enrollment.track?.difficulty}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{enrollment.progress_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 rounded-full h-1.5"
                        style={{ width: `${enrollment.progress_pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {goals.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-gold-500" /> Active Goals
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    {goal.due_date && (
                      <p className="text-xs text-gray-500">Due {formatDate(goal.due_date)}</p>
                    )}
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    goal.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
                  )}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentCert && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gold-500" />
                <h3 className="font-semibold">Latest Certification</h3>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="font-medium">{recentCert.track?.title}</p>
                  <p className="text-xs text-gray-500">Issued {formatDate(recentCert.issued_at)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold">Weekly Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{enrollments.length}</p>
                <p className="text-xs text-gray-500">Tracks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold-600">{certs.length}</p>
                <p className="text-xs text-gray-500">Certs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{opportunityCount}</p>
                <p className="text-xs text-gray-500">Matches</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
