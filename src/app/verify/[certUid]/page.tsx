'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Certification, SkillTrack } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Award, CheckCircle2, ExternalLink } from 'lucide-react';

export default function VerifyCertificatePage() {
  const supabase = getSupabaseClient();
  const params = useParams();
  const [cert, setCert] = useState<Certification | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [track, setTrack] = useState<SkillTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    loadCert();
  }, []);

  const loadCert = async () => {
    const { data } = await supabase
      .from('certifications')
      .select('*, user:users(*), track:skill_tracks(*)')
      .eq('cert_uid', params.certUid)
      .single();

    if (data) {
      setCert(data);
      setTrack(data.track as any);

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user_id)
        .single();
      setProfile(p);

      setValid(true);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {valid && cert ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">Verified Certificate</h1>
            <p className="text-gray-500 text-sm mb-6">This certificate is authentic and issued by Kingdom SkillBridge</p>

            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-700 font-bold text-2xl">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>

            <h2 className="text-xl font-semibold">{profile?.full_name || 'Graduate'}</h2>
            <p className="text-gray-500 mt-1">has successfully completed</p>
            <h3 className="text-lg font-bold text-primary-700 mt-2">{track?.title || 'a skill track'}</h3>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-gray-500">Certificate ID</span>
                <span className="font-mono font-medium">{cert.cert_uid}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-gray-500">Issue Date</span>
                <span className="font-medium">{formatDate(cert.issued_at)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-gray-500">Difficulty</span>
                <span className="font-medium capitalize">{track?.difficulty || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Award className="w-8 h-8 text-gold-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                Kingdom SkillBridge — Faith-driven Digital Empowerment Ecosystem
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Certificate Not Found</h1>
            <p className="text-gray-500">
              No certificate matches this ID. Please check the URL or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
