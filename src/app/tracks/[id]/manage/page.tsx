'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Module, SkillTrack } from '@/lib/types';

type ModuleType = 'video' | 'article' | 'quiz' | 'audio' | 'document';

export default function ManageContentPage() {
  const params = useParams();
  const trackId = params.id as string;
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [track, setTrack] = useState<SkillTrack | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ModuleType>('video');
  const [formContentUrl, setFormContentUrl] = useState('');
  const [formContentBody, setFormContentBody] = useState('');
  const [formDuration, setFormDuration] = useState(10);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    loadData();
  }, [trackId]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    setRole(userData?.role || '');
    const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];
    if (!allowedRoles.includes(userData?.role)) {
      setError('Only mentors and trainers can manage content');
      setLoading(false);
      return;
    }

    const [trackRes, modsRes] = await Promise.all([
      fetch(`/api/v1/skill-tracks/${trackId}`),
      supabase.from('modules').select('*').eq('track_id', trackId).order('order_index', { ascending: true }),
    ]);

    if (trackRes.ok) {
      const trackData = await trackRes.json();
      setTrack(trackData.data);
    }
    if (modsRes.data) setModules(modsRes.data);

    setLoading(false);
  }

  function resetForm() {
    setShowForm(false);
    setEditModule(null);
    setFormTitle('');
    setFormType('video');
    setFormContentUrl('');
    setFormContentBody('');
    setFormDuration(10);
  }

  function openEdit(m: Module) {
    setEditModule(m);
    setFormTitle(m.title);
    setFormType(m.type);
    setFormContentUrl(m.content_url || '');
    setFormContentBody(m.content_body || '');
    setFormDuration(m.duration_mins);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const body: any = {
      track_id: trackId,
      title: formTitle,
      type: formType,
      duration_mins: formDuration,
    };
    if (formContentUrl) body.content_url = formContentUrl;
    if (formContentBody) body.content_body = formContentBody;

    const url = editModule
      ? `/api/v1/modules/${editModule.id}`
      : '/api/v1/modules';
    const method = editModule ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.error) {
      setError(json.error);
    } else {
      setSuccess(editModule ? 'Module updated' : 'Module created');
      resetForm();
      loadData();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this module?')) return;
    const res = await fetch(`/api/v1/modules/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.error) setError(json.error);
    else {
      setSuccess('Module deleted');
      loadData();
    }
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
    else setFormContentUrl(json.data.url);

    setUploading(false);
  }

  async function handleMoveUp(m: Module, idx: number) {
    if (idx === 0) return;
    const prev = modules[idx - 1];
    await Promise.all([
      supabase.from('modules').update({ order_index: prev.order_index }).eq('id', m.id),
      supabase.from('modules').update({ order_index: m.order_index }).eq('id', prev.id),
    ]);
    loadData();
  }

  async function handleMoveDown(m: Module, idx: number) {
    if (idx === modules.length - 1) return;
    const next = modules[idx + 1];
    await Promise.all([
      supabase.from('modules').update({ order_index: next.order_index }).eq('id', m.id),
      supabase.from('modules').update({ order_index: m.order_index }).eq('id', next.id),
    ]);
    loadData();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/tracks" className="text-sm text-primary-600 hover:underline">&larr; Back to tracks</Link>
            <h1 className="text-xl font-bold mt-1">{track?.title || 'Track'} — Manage Content</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Add Module
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{success}</div>}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{editModule ? 'Edit Module' : 'New Module'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value as ModuleType)} className="mt-1 w-full px-3 py-2 border rounded-lg">
                  <option value="video">Video</option>
                  <option value="article">Article (Text)</option>
                  <option value="audio">Audio</option>
                  <option value="document">PDF / Document</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              {formType === 'article' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea value={formContentBody} onChange={e => setFormContentBody(e.target.value)} rows={8} className="mt-1 w-full px-3 py-2 border rounded-lg font-mono text-sm" placeholder="Write your lesson content here..." />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formType === 'audio' ? 'Audio URL' : formType === 'document' ? 'Document URL' : 'Video URL'}
                  </label>
                  <input type="url" value={formContentUrl} onChange={e => setFormContentUrl(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Or upload a file</label>
                    <input
                      type="file"
                      accept={
                        formType === 'audio' ? 'audio/*' :
                        formType === 'document' ? '.pdf,.doc,.docx,.txt' :
                        'video/*'
                      }
                      onChange={handleFileUpload}
                      className="mt-1 text-sm"
                    />
                    {uploading && <span className="text-xs text-gray-500 ml-2">Uploading...</span>}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                  <input type="number" min={1} value={formDuration} onChange={e => setFormDuration(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editModule ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {modules.length === 0 && <p className="text-gray-500 text-center py-12">No modules yet. Click "Add Module" to create your first lesson.</p>}

          {modules.map((m, idx) => (
            <div key={m.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => handleMoveUp(m, idx)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">&uarr;</button>
                <span className="text-xs font-mono text-gray-400">{idx + 1}</span>
                <button onClick={() => handleMoveDown(m, idx)} disabled={idx === modules.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">&darr;</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.title}</p>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span className={`px-2 py-0.5 rounded ${m.type === 'video' ? 'bg-blue-100 text-blue-700' : m.type === 'article' ? 'bg-green-100 text-green-700' : m.type === 'audio' ? 'bg-purple-100 text-purple-700' : m.type === 'document' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {m.type}
                  </span>
                  <span>{m.duration_mins} min</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(m)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
