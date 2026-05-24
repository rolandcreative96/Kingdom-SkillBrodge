'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { MentorMatch, MentorshipSession, Goal } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Calendar, Plus, CheckCircle2, Target } from 'lucide-react';

export default function MatchDetailPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const [match, setMatch] = useState<MentorMatch | null>(null);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMins, setDurationMins] = useState(30);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const router = useRouter();

  useEffect(() => { loadMatch(); }, []);

  const loadMatch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: m } = await supabase
      .from('mentor_matches')
      .select('*, mentor_profile:mentor_profiles!mentor_id(*, profile:profiles(*)), youth_profile:profiles!youth_id(*)')
      .eq('id', params.id)
      .single();
    setMatch(m);

    if (m) {
      const { data: s } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('match_id', params.id)
        .order('scheduled_at', { ascending: false });
      setSessions(s || []);

      const { data: g } = await supabase
        .from('goals')
        .select('*')
        .eq('match_id', params.id);
      setGoals(g || []);
    }

    setLoading(false);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/mentorship-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: params.id, scheduled_at: scheduledAt, duration_mins: durationMins }),
    });
    const data = await res.json();
    if (data.data) {
      setShowSchedule(false);
      setScheduledAt('');
      setDurationMins(30);
      loadMatch();
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: params.id, title: goalTitle }),
    });
    // Note: goals API is not separately implemented; using direct insert for MVP
    const { data } = await supabase.from('goals').insert({
      match_id: params.id,
      title: goalTitle,
    }).select().single();
    if (data) {
      setShowAddGoal(false);
      setGoalTitle('');
      loadMatch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!match) {
    return <div className="min-h-screen flex items-center justify-center"><p>Match not found</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/mentors/matches" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> My Mentors
          </Link>
          <h1 className="text-2xl font-bold">
            {(match as any).mentor_profile?.profile?.full_name || 'Mentorship'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" /> Sessions
                </h2>
                <button
                  onClick={() => setShowSchedule(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Schedule
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No sessions scheduled</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{formatDateTime(session.scheduled_at)}</p>
                        <p className="text-xs text-gray-500">{session.duration_mins} minutes</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded capitalize ${
                        session.status === 'completed' ? 'bg-green-50 text-green-700' :
                        session.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-gold-500" /> Goals
                </h2>
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Goal
                </button>
              </div>
              {goals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No goals set yet</p>
              ) : (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${goal.status === 'achieved' ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-sm ${goal.status === 'achieved' ? 'line-through text-gray-400' : ''}`}>
                          {goal.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{goal.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSchedule(false)}>
            <form onSubmit={handleSchedule} className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Schedule Session</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <select
                    value={durationMins}
                    onChange={(e) => setDurationMins(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowSchedule(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">Schedule</button>
              </div>
            </form>
          </div>
        )}

        {showAddGoal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddGoal(false)}>
            <form onSubmit={handleAddGoal} className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Add Goal</h3>
              <input
                type="text"
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="What do you want to achieve?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAddGoal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">Add Goal</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
