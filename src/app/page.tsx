'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { BookOpen, Users, Briefcase, Target, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const supabase = getSupabaseClient();
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setLoggedIn(true);
    });
  }, []);

  const handleGetStarted = () => {
    router.push(loggedIn ? '/dashboard' : '/auth/register');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KS</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Kingdom SkillBridge</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/tracks" className="text-sm text-gray-500 hover:text-gray-700">Tracks</Link>
              <Link href="/mentors" className="text-sm text-gray-500 hover:text-gray-700">Mentors</Link>
              <Link href="/opportunities" className="text-sm text-gray-500 hover:text-gray-700">Opportunities</Link>
              {loggedIn ? (
                <Link href="/dashboard" className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth/login" className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-primary-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Future with{' '}
            <span className="text-primary-600">Faith-Driven Skills</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Learn digital skills, connect with mentors, find opportunities, and track your growth — all within your faith community.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-primary-600 text-white rounded-xl text-lg font-medium hover:bg-primary-700 transition flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/tracks"
              className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-medium hover:border-primary-300 transition"
            >
              Browse Tracks
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Grow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Skill Tracks', desc: '8 categories of practical digital skills with structured learning paths and certifications.' },
              { icon: Users, title: 'Mentor Matching', desc: 'Get matched with professionals from your faith community for 1-on-1 guidance.' },
              { icon: Briefcase, title: 'Opportunity Marketplace', desc: 'Find internships, jobs, and gigs matched to your verified skills.' },
              { icon: Target, title: 'Goal Tracking', desc: 'Set mentorship goals, track progress, and celebrate achievements together.' },
              { icon: Award, title: 'Verified Certifications', desc: 'Earn publicly verifiable certificates for every completed skill track.' },
              { icon: CheckCircle2, title: 'Community Impact', desc: 'Churches track empowerment outcomes and prove community impact.' },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-gray-100 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of youths building employable skills through their faith community.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-primary-700 rounded-xl text-lg font-medium hover:bg-primary-50 transition"
          >
            Create Free Account
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>Kingdom SkillBridge &copy; {new Date().getFullYear()} — Faith-driven Digital Empowerment Ecosystem</p>
          <p className="mt-2">Built with &hearts; for Kingdom Hack 3.0</p>
        </div>
      </footer>
    </div>
  );
}
