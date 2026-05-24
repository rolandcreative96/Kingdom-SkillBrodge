'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Opportunity } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Briefcase, MapPin, Calendar, ArrowLeft, Filter, ExternalLink } from 'lucide-react';

const TYPES = ['internship', 'job', 'gig', 'volunteer'];

export default function OpportunitiesPage() {
  const supabase = getSupabaseClient();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const router = useRouter();

  useEffect(() => { loadOpportunities(); }, [type]);

  const loadOpportunities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const params = new URLSearchParams({ limit: '50' });
    if (type) params.set('type', type);

    const res = await fetch(`/api/v1/opportunities?${params}`);
    const data = await res.json();
    if (data.data) setOpportunities(data.data);
    setLoading(false);
  };

  const handleApply = async () => {
    if (!selectedOpp) return;

    const res = await fetch('/api/v1/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity_id: selectedOpp.id, cover_note: coverNote }),
    });

    const data = await res.json();
    if (!data.error) {
      setShowApplyModal(false);
      setCoverNote('');
      setSelectedOpp(null);
      alert('Application submitted!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold">Opportunities</h1>
          <p className="text-gray-500 text-sm">Find internships, jobs, gigs, and volunteer roles</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setType('')}
            className={`px-3 py-1.5 rounded-full text-sm border ${!type ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}
          >
            All
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(type === t ? '' : t)}
              className={`px-3 py-1.5 rounded-full text-sm border capitalize ${type === t ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No opportunities available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{opp.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{opp.organisation?.name}</p>
                  </div>
                  <span className="capitalize px-2 py-1 text-xs rounded bg-primary-50 text-primary-700">
                    {opp.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{opp.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {opp.skills_required?.slice(0, 4).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {(opp.skills_required?.length || 0) > 4 && (
                    <span className="text-xs text-gray-400">+{opp.skills_required!.length - 4} more</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {opp.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(opp.deadline)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedOpp(opp); setShowApplyModal(true); }}
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showApplyModal && selectedOpp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApplyModal(false)}>
            <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2">Apply for {selectedOpp.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedOpp.organisation?.name}</p>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Tell the organisation why you're a good fit... (optional)"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
