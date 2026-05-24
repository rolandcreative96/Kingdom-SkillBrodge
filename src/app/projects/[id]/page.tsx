'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Project, Task } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import { ArrowLeft, Plus, User, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';

const COLUMNS = [
  { key: 'todo', label: 'To Do', bg: 'bg-gray-50' },
  { key: 'in_progress', label: 'In Progress', bg: 'bg-blue-50' },
  { key: 'done', label: 'Done', bg: 'bg-green-50' },
];

export default function ProjectDetailPage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const router = useRouter();

  useEffect(() => { loadProject(); }, []);

  const loadProject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const res = await fetch(`/api/v1/projects/${params.id}`);
    const data = await res.json();
    if (data.data) setProject(data.data);
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: params.id, title: newTaskTitle }),
    });
    const data = await res.json();
    if (data.data) {
      setShowAddTask(false);
      setNewTaskTitle('');
      loadProject();
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    await fetch(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadProject();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center"><p>Project not found</p></div>;
  }

  const tasksByStatus = {
    todo: project.tasks?.filter((t) => t.status === 'todo') || [],
    in_progress: project.tasks?.filter((t) => t.status === 'in_progress') || [],
    done: project.tasks?.filter((t) => t.status === 'done') || [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/projects" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> All Projects
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm capitalize ${
              project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}>
              {project.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Created {formatDate(project.created_at)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`rounded-xl ${col.bg} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                  {tasksByStatus[col.key as keyof typeof tasksByStatus].length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[col.key as keyof typeof tasksByStatus].map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow"
                    onClick={() => {
                      const nextStatus = col.key === 'todo' ? 'in_progress' : col.key === 'in_progress' ? 'done' : 'todo';
                      handleUpdateTaskStatus(task.id, nextStatus);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {col.key === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${col.key === 'done' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(task.due_date)}
                          </p>
                        )}
                        {task.assignee && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> {task.assignee.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {col.key === 'todo' && (
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                )}
                {col.key !== 'todo' && tasksByStatus[col.key as keyof typeof tasksByStatus].length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAddTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddTask(false)}>
            <form onSubmit={handleAddTask} className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Add Task</h3>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
