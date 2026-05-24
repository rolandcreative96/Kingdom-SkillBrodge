'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { SkillTrack } from '@/lib/types';
import { BookOpen, Clock, BarChart3, ArrowLeft, Filter } from 'lucide-react';

const CATEGORIES = [
  'Software Dev', 'Graphics', 'UI/UX', 'Content', 'Digital Marketing', 'Data Analysis', 'AI Tools', 'Entrepreneurship'
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function TracksPage() {
  const supabase = getSupabaseClient();
  const [tracks, setTracks] = useState<SkillTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadTracks();
  }, [category, difficulty]);

  const loadTracks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const res = await fetch(`/api/v1/skill-tracks?${new URLSearchParams({
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      limit: '50',
    })}`);
    const data = await res.json();
    if (data.data) setTracks(data.data);
    setLoading(false);
  };

  const handleEnroll = async (trackId: string) => {
    const res = await fetch('/api/v1/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId }),
    });
    const data = await res.json();
    if (data.data) router.push(`/tracks/${trackId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold">Skill Tracks</h1>
          <p className="text-gray-500 text-sm">Browse and enroll in skill development tracks</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setCategory(''); setDifficulty(''); }}
            className={`px-3 py-1.5 rounded-full text-sm border ${!category && !difficulty ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-sm border ${category === cat ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No tracks found for this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs capitalize">
                    {track.difficulty}
                  </span>
                  <span className="text-xs text-gray-400">{track.category}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{track.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{track.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {track.modules?.length || 0} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {track.modules?.reduce((s, m) => s + m.duration_mins, 0) || 0} min
                  </span>
                </div>
                <button
                  onClick={() => handleEnroll(track.id)}
                  className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
                >
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
