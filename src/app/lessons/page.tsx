'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Module, SkillTrack } from '@/lib/types';
import { BookOpen, Plus, ArrowLeft, Video, FileText, Headphones, File, Edit2, Trash2 } from 'lucide-react';

export default function LessonsPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [modules, setModules] = useState<(Module & { track?: SkillTrack })[]>([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    setRole(userData?.role || '');
    if (!allowedRoles.includes(userData?.role)) {
      setError('Only mentors, trainers, and admins can manage lessons');
      setLoading(false);
      return;
    }

    const { data: tracks } = await supabase
      .from('skill_tracks')
      .select('id, title, category')
      .eq('created_by', user.id);

    const trackIds = tracks?.map(t => t.id) || [];
    const trackMap = new Map(tracks?.map(t => [t.id, t]) || []);

    if (trackIds.length > 0) {
      const { data: mods } = await supabase
        .from('modules')
        .select('*')
        .in('track_id', trackIds)
        .order('order_index', { ascending: true });

      if (mods) {
        setModules(mods.map(m => ({ ...m, track: trackMap.get(m.track_id) as SkillTrack })));
      }
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lesson?')) return;
    const res = await fetch(`/api/v1/modules/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.error) setError(json.error);
    else loadLessons();
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  }

  function getTypeBadge(type: string) {
    const styles: Record<string, string> = {
      video: 'bg-blue-100 text-blue-700',
      article: 'bg-green-100 text-green-700',
      audio: 'bg-purple-100 text-purple-700',
      document: 'bg-orange-100 text-orange-700',
      quiz: 'bg-yellow-100 text-yellow-700',
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Lessons</h1>
              <p className="text-gray-500 text-sm">Manage all your lesson content across tracks</p>
            </div>
            <Link
              href="/lessons/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              <Plus className="w-4 h-4" /> New Lesson
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm mb-6">{error}</div>
        )}

        {!error && modules.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No lessons yet</h3>
            <p className="text-gray-400 mb-6">Create your first lesson to get started</p>
            <Link
              href="/lessons/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" /> Create Lesson
            </Link>
          </div>
        )}

        {modules.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modules.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getTypeIcon(m.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.title}</p>
                            <p className="text-xs text-gray-400">{m.order_index + 1}. lesson in track</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{m.track?.title || 'Unknown'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getTypeBadge(m.type)}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{m.duration_mins} min</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/lessons/${m.id}/edit`}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
