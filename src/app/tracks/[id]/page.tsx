'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { SkillTrack, Enrollment } from '@/lib/types';
import { BookOpen, Clock, Play, CheckCircle2, ArrowLeft, BarChart3 } from 'lucide-react';

export default function TrackDetailPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const [track, setTrack] = useState<SkillTrack | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTrack();
  }, []);

  const loadTrack = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData) setRole(userData.role);

    const res = await fetch(`/api/v1/skill-tracks/${params.id}`);
    const data = await res.json();
    setTrack(data.data);

    const { data: e } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('track_id', params.id)
      .maybeSingle();
    setEnrollment(e);

    setLoading(false);
  };

  const handleModuleComplete = async (moduleId: string) => {
    if (!enrollment || !track?.modules) return;
    const totalModules = track.modules.length;
    const completedModules = 0;
    const newProgress = Math.min(100, ((completedModules + 1) / totalModules) * 100);

    await fetch(`/api/v1/enrollments/${enrollment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress_pct: newProgress }),
    });

    loadTrack();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Track not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/tracks" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> All Tracks
              </Link>
              <h1 className="text-2xl font-bold">{track.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="capitalize px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">{track.difficulty}</span>
                <span>{track.category}</span>
                <span>{track.modules?.length || 0} modules</span>
              </div>
            </div>
            {['mentor', 'trainer', 'org_admin', 'super_admin'].includes(role) && (
              <Link
                href={`/tracks/${track.id}/manage`}
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Manage Content
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {track.description && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-semibold mb-2">About this Track</h2>
            <p className="text-gray-600">{track.description}</p>
          </div>
        )}

        {enrollment && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Your Progress</h2>
              <span className="text-2xl font-bold text-primary-600">{enrollment.progress_pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-primary-500 rounded-full h-3 transition-all"
                style={{ width: `${enrollment.progress_pct}%` }}
              />
            </div>
            {enrollment.completed_at && (
              <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold">Modules</h2>
          </div>
          <div className="divide-y">
            {track.modules?.sort((a, b) => a.order_index - b.order_index).map((module, i) => (
              <div key={module.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-sm font-medium">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{module.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className={`capitalize px-1.5 py-0.5 rounded text-xs ${
                        module.type === 'document' ? 'bg-orange-100 text-orange-700' : ''
                      }`}>{module.type === 'document' ? 'PDF' : module.type}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {module.duration_mins} min
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleModuleComplete(module.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Play className="w-3.5 h-3.5" /> Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {!enrollment && (
          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                const res = await fetch('/api/v1/enrollments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ track_id: track.id }),
                });
                const data = await res.json();
                if (data.data) {
                  setEnrollment(data.data);
                  loadTrack();
                }
              }}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Enroll in this Track
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
