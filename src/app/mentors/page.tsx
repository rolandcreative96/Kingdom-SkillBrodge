'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Profile, MentorProfile } from '@/lib/types';
import { MatchScore } from '@/lib/mentor-matching';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star, Clock, Users, Search, Filter } from 'lucide-react';

export default function MentorMatchingPage() {
  const supabase = getSupabaseClient();
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<MatchScore | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const res = await fetch('/api/v1/mentors');
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setMatches(data.data || []);
    }
    setLoading(false);
  };

  const handleRequestMentor = async (mentorId: string) => {
    setRequestingId(mentorId);
    setError('');
    setSuccessMsg('');

    const match = matches.find((m) => m.mentor.user_id === mentorId);
    const res = await fetch('/api/v1/mentor-matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentor_id: mentorId, score: match?.score }),
    });

    const data = await res.json();
    setRequestingId(null);

    if (data.error) {
      setError(data.error);
    } else {
      setSuccessMsg('Mentorship request sent! Mentor will respond within 72 hours.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Find a Mentor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Matched on your skill goals using our matching algorithm
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm">{successMsg}</div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No mentors found</h3>
            <p className="text-gray-400 text-sm mt-2">Update your skill goals in your profile to get better matches</p>
            <Link
              href="/profile"
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Update Profile
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.mentor.user_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary-200 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold text-lg">
                      {match.mentor.profile?.full_name?.charAt(0) || 'M'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {match.mentor.profile?.full_name || 'Mentor'}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {match.mentor.skill_tags?.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-primary-50 px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                        <span className="text-sm font-semibold text-primary-700">
                          {Math.round(match.score * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {match.mentor.availability_hrs_per_week} hrs/week
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {match.mentor.total_mentees} mentees
                      </span>
                      {match.mentor.rating_avg > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gold-500" />
                          {match.mentor.rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {match.mentor.bio || 'No bio available'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedMentor(match)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleRequestMentor(match.mentor.user_id)}
                        disabled={requestingId === match.mentor.user_id}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {requestingId === match.mentor.user_id ? 'Sending...' : 'Request Mentorship'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMentor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMentor(null)}>
            <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary-700 font-bold text-xl">
                    {selectedMentor.mentor.profile?.full_name?.charAt(0) || 'M'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mt-3">
                  {selectedMentor.mentor.profile?.full_name || 'Mentor'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedMentor.mentor.bio}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Skill Match</span>
                  <span className="font-medium">{Math.round(selectedMentor.skill_overlap * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Availability</span>
                  <span className="font-medium">{selectedMentor.mentor.availability_hrs_per_week} hrs/week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Mentees</span>
                  <span className="font-medium">{selectedMentor.mentor.total_mentees}</span>
                </div>
                {selectedMentor.mentor.rating_avg > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating</span>
                    <span className="font-medium">{selectedMentor.mentor.rating_avg.toFixed(1)} / 5</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Overall Match</span>
                  <span className="font-bold text-primary-700">{Math.round(selectedMentor.score * 100)}%</span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.mentor.skill_tags?.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedMentor(null)}
                className="mt-6 w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
