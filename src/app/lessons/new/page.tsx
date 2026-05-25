'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { ArrowLeft, Upload, File, Video, Headphones, FileText } from 'lucide-react';

type ModuleType = 'video' | 'article' | 'audio' | 'document';

interface TrackOption {
  id: string;
  title: string;
}

export default function NewLessonPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [trackId, setTrackId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModuleType>('video');
  const [contentUrl, setContentUrl] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [duration, setDuration] = useState(10);

  const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    setRole(userData?.role || '');
    if (!allowedRoles.includes(userData?.role)) {
      setError('Only mentors, trainers, and admins can create lessons');
      setLoading(false);
      return;
    }

    const { data: userProfile } = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();

    let query = supabase.from('skill_tracks').select('id, title').eq('is_published', true);
    if (userData?.role !== 'super_admin') {
      query = query.eq('created_by', user.id);
    }
    const { data: tracksData } = await query.order('title', { ascending: true });
    setTracks(tracksData || []);
    if (tracksData && tracksData.length > 0) {
      setTrackId(tracksData[0].id);
    }

    setLoading(false);
  }

  function resetForm() {
    setTitle('');
    setType('video');
    setContentUrl('');
    setContentBody('');
    setDuration(10);
    setError('');
    setSuccess('');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
    const json = await res.json();

    if (json.error) setError(json.error);
    else setContentUrl(json.data.url);

    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackId || !title) {
      setError('Track and title are required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const body: Record<string, any> = {
      track_id: trackId,
      title,
      type,
      duration_mins: duration,
    };
    if (contentUrl) body.content_url = contentUrl;
    if (contentBody) body.content_body = contentBody;

    const res = await fetch('/api/v1/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.error) {
      setError(json.error);
    } else {
      setSuccess('Lesson created successfully!');
      resetForm();
      setTimeout(() => router.push('/lessons'), 1500);
    }
    setSaving(false);
  }

  function getAcceptAttr(): string {
    switch (type) {
      case 'audio': return 'audio/*';
      case 'document': return '.pdf,.doc,.docx,.txt';
      case 'video': return 'video/*';
      default: return '';
    }
  }

  function getTypeIcon() {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Headphones className="w-5 h-5" />;
      case 'document': return <File className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/lessons" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Lessons
          </Link>
          <h1 className="text-2xl font-bold">Create New Lesson</h1>
          <p className="text-gray-500 text-sm">Upload video, audio, document, or write a text-based lesson</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm mb-6">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm mb-6">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Lesson Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Track</label>
                {tracks.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    No tracks available. <Link href="/tracks" className="underline">Create a track first</Link>.
                  </div>
                ) : (
                  <select
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select a track...</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to HTML"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {([
                    { value: 'video' as const, label: 'Video', icon: <Video className="w-5 h-5" /> },
                    { value: 'audio' as const, label: 'Audio', icon: <Headphones className="w-5 h-5" /> },
                    { value: 'document' as const, label: 'PDF / Doc', icon: <File className="w-5 h-5" /> },
                    { value: 'article' as const, label: 'Text', icon: <FileText className="w-5 h-5" /> },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setType(opt.value); setContentUrl(''); setContentBody(''); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                        type === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {getTypeIcon()} Content
            </h2>

            {type === 'article' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Write your lesson content</label>
                <textarea
                  value={contentBody}
                  onChange={e => setContentBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Write your lesson content here using Markdown or plain text..."
                />
                <p className="text-xs text-gray-400 mt-1">Supports Markdown formatting</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'audio' ? 'Audio URL' : type === 'document' ? 'Document URL' : 'Video URL'}
                  </label>
                  <input
                    type="url"
                    value={contentUrl}
                    onChange={e => setContentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or upload a file</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      {type === 'audio' ? 'Upload MP3, WAV, OGG, AAC' :
                       type === 'document' ? 'Upload PDF, DOC, DOCX, TXT' :
                       'Upload MP4, WebM, MOV, AVI'}
                    </p>
                    <input
                      type="file"
                      accept={getAcceptAttr()}
                      onChange={handleFileUpload}
                      className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {uploading && <p className="text-xs text-primary-600 mt-2">Uploading...</p>}
                    {contentUrl && !uploading && (
                      <p className="text-xs text-green-600 mt-2">File uploaded: {contentUrl.split('/').pop()}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || tracks.length === 0}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Creating...' : 'Create Lesson'}
            </button>
            <Link
              href="/lessons"
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
