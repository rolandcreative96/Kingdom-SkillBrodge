'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { MentorMatch } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Users, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function MentorMatchesPage() {
  const supabase = getSupabaseClient();
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const res = await fetch('/api/v1/mentor-matches');
    const data = await res.json();
    if (data.data) setMatches(data.data);
    setLoading(false);
  };

  const handleUpdateStatus = async (matchId: string, status: string) => {
    await fetch(`/api/v1/mentor-matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadMatches();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gold-50 text-gold-700',
    active: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold">My Mentors</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No mentorship matches yet</p>
            <Link href="/mentors" className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
              Find a Mentor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {(match as any).youth_profile?.full_name?.charAt(0) || 'M'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {(match as any).mentor_profile?.profile?.full_name || 'Mentor'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Matched {formatDate(match.matched_at)}
                      </p>
                      {match.score && (
                        <p className="text-xs text-primary-600 mt-1">
                          Match Score: {Math.round(match.score * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[match.status] || 'bg-gray-50 text-gray-600'}`}>
                    {match.status}
                  </span>
                </div>

                {match.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleUpdateStatus(match.id, 'active')}
                      className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(match.id, 'completed')}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                  </div>
                )}

                {match.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/mentors/matches/${match.id}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100"
                    >
                      <Calendar className="w-4 h-4" /> Schedule Session
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
