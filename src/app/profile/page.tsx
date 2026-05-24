'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { User, ArrowLeft, Save, Plus, X } from 'lucide-react';

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js', 'Node.js',
  'Graphic Design', 'UI Design', 'UX Research', 'Figma', 'Photoshop',
  'Content Writing', 'Copywriting', 'Blogging', 'SEO',
  'Digital Marketing', 'Social Media', 'Email Marketing',
  'Data Analysis', 'Excel', 'SQL', 'Power BI', 'Tableau',
  'AI Tools', 'ChatGPT', 'Machine Learning',
  'Entrepreneurship', 'Business', 'Project Management',
];

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const router = useRouter();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setLinkedinUrl(data.linkedin_url || '');
      setSkillTags(data.skill_tags || []);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, bio, linkedin_url: linkedinUrl, skill_tags: skillTags }),
    });

    const data = await res.json();
    setSaving(false);
    if (!data.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const toggleSkill = (skill: string) => {
    if (skillTags.includes(skill)) {
      setSkillTags(skillTags.filter((s) => s !== skill));
    } else {
      setSkillTags([...skillTags, skill]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-bold text-xl">{fullName.charAt(0) || 'U'}</span>
            </div>
            <div>
              <p className="font-medium">{fullName || 'Your Name'}</p>
              <p className="text-sm text-gray-500">{profile?.user_id ? 'Profile' : 'Complete your profile'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skillTags.map((skill) => (
                <span
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm cursor-pointer hover:bg-primary-200"
                >
                  {skill} <X className="w-3 h-3" />
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSkillPicker(!showSkillPicker)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Skills
            </button>
            {showSkillPicker && (
              <div className="mt-2 p-3 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.filter((s) => !skillTags.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-primary-50 hover:text-primary-700"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Save className="w-4 h-4" /> Saved!
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
