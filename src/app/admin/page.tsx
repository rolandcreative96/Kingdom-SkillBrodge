'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Users, BookOpen, Award, Briefcase, TrendingUp, LogOut,
  Plus, Download, ChevronRight, UserPlus, Activity
} from 'lucide-react';
import Link from 'next/link';

interface Analytics {
  total_members: number;
  active_enrollments: number;
  completed_certifications: number;
  mentor_sessions_this_month: number;
  employment_outcomes: number;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export default function AdminDashboard() {
  const supabase = getSupabaseClient();
  const [orgName, setOrgName] = useState('');
  const [analytics, setAnalytics] = useState<Analytics>({
    total_members: 0, active_enrollments: 0, completed_certifications: 0,
    mentor_sessions_this_month: 0, employment_outcomes: 0,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const userData = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData.data?.role !== 'org_admin') {
      router.push('/dashboard');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('*, organisations(*)').eq('user_id', user.id).single();

    if (!profile?.org_id) {
      setLoading(false);
      return;
    }

    setOrgName((profile.organisations as any)?.name || '');

    const { data: membersData } = await supabase
      .from('org_memberships')
      .select('*, user:users(*), profile:profiles(*)')
      .eq('org_id', profile.org_id)
      .eq('status', 'active');

    setMembers((membersData || []).map((m: any) => ({
      id: m.user?.id,
      full_name: m.profile?.full_name || 'Unknown',
      email: m.user?.email || '',
      role: m.role,
      joined_at: m.joined_at,
    })));

    const res = await fetch(`/api/v1/orgs/${profile.org_id}/analytics`);
    const data = await res.json();
    if (data.data) setAnalytics(data.data);

    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    // In MVP this is a placeholder - actual invite flow uses Supabase Auth invite
    setShowInvite(false);
    setInviteEmail('');
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Members', value: analytics.total_members, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Learners', value: analytics.active_enrollments, icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Certifications', value: analytics.completed_certifications, icon: Award, color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'Employment Outcomes', value: analytics.employment_outcomes, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KS</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                {orgName && <p className="text-xs text-gray-500">{orgName}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/opportunities"
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <Briefcase className="w-4 h-4" /> Opportunities
              </Link>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-3">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" /> Recent Activity
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Mentor Sessions (This Month)</span>
                  <span className="font-semibold">{analytics.mentor_sessions_this_month}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Enrollments</span>
                  <span className="font-semibold">{analytics.active_enrollments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Employment Rate</span>
                  <span className="font-semibold">
                    {analytics.total_members > 0
                      ? Math.round((analytics.employment_outcomes / analytics.total_members) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Members ({members.length})
              </h3>
              <button
                onClick={() => setShowInvite(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" /> Invite
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {members.slice(0, 10).map((member) => (
                <div key={member.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{member.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.full_name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-xs capitalize text-gray-500">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/opportunities"
              className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-primary-300 transition"
            >
              <Plus className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-sm font-medium">Post Opportunity</p>
                <p className="text-xs text-gray-500">Create a job or internship listing</p>
              </div>
            </Link>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-primary-300 transition text-left"
            >
              <UserPlus className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Invite Members</p>
                <p className="text-xs text-gray-500">Add church members to platform</p>
              </div>
            </button>
            <button
              onClick={() => loadDashboard()}
              className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:border-primary-300 transition text-left"
            >
              <Download className="w-5 h-5 text-gold-500" />
              <div>
                <p className="text-sm font-medium">Download Report</p>
                <p className="text-xs text-gray-500">Export impact data (coming soon)</p>
              </div>
            </button>
          </div>
        </div>

        {showInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInvite(false)}>
            <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
