'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Module } from '@/lib/types';
import { ArrowLeft, Upload } from 'lucide-react';

type ModuleType = 'video' | 'article' | 'audio' | 'document';

export default function EditLessonPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ModuleType>('video');
  const [contentUrl, setContentUrl] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    loadModule();
  }, [id]);

  async function loadModule() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];
    if (!allowedRoles.includes(userData?.role)) {
      setError('Unauthorized');
      setLoading(false);
      return;
    }

    const { data: mod, error: modErr } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (modErr || !mod) {
      setError('Module not found');
      setLoading(false);
      return;
    }

    setTitle(mod.title);
    setType(mod.type as ModuleType);
    setContentUrl(mod.content_url || '');
    setContentBody(mod.content_body || '');
    setDuration(mod.duration_mins);
    setLoading(false);
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
    setSaving(true);
    setError('');
    setSuccess('');

    const body: Record<string, any> = { title, type, duration_mins: duration };
    if (contentUrl) body.content_url = contentUrl;
    if (contentBody) body.content_body = contentBody;

    const res = await fetch(`/api/v1/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.error) {
      setError(json.error);
    } else {
      setSuccess('Lesson updated successfully!');
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/lessons" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Lessons
          </Link>
          <h1 className="text-2xl font-bold">Edit Lesson</h1>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={e => { setType(e.target.value as ModuleType); setContentUrl(''); setContentBody(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">PDF / Document</option>
                  <option value="article">Text Article</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Content</h2>

            {type === 'article' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Body</label>
                <textarea
                  value={contentBody}
                  onChange={e => setContentBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload new file</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <input
                      type="file"
                      accept={getAcceptAttr()}
                      onChange={handleFileUpload}
                      className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {uploading && <p className="text-xs text-primary-600 mt-2">Uploading...</p>}
                    {contentUrl && !uploading && (
                      <p className="text-xs text-green-600 mt-2">Current: {contentUrl.split('/').pop()}</p>
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
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Update Lesson'}
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
