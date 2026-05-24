'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { FolderKanban, Plus, ArrowLeft, Users } from 'lucide-react';

export default function ProjectsPage() {
  const supabase = getSupabaseClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const res = await fetch('/api/v1/projects');
    const data = await res.json();
    if (data.data) setProjects(data.data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (data.data) {
      setShowCreate(false);
      setTitle('');
      setDescription('');
      router.push(`/projects/${data.data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Link>
              <h1 className="text-2xl font-bold">Projects</h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No projects yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded capitalize ${
                    project.status === 'active' ? 'bg-green-50 text-green-700' :
                    project.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {project.members?.length || 0} members
                  </span>
                  <span>{formatDate(project.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
            <form onSubmit={handleCreate} className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Create Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg resize-none"
                    placeholder="What's this project about?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
