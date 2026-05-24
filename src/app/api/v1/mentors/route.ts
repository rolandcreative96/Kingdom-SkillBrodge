import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { rankMentors } from '@/lib/mentor-matching';
import { Profile, MentorProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ data: null, error: 'Complete your profile first' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: mentors, error: mentorsError } = await serviceClient
      .from('mentor_profiles')
      .select('*, profile:profiles(*)')
      .eq('is_active', true)
      .neq('user_id', user.id);

    if (mentorsError) {
      return NextResponse.json({ data: null, error: mentorsError.message }, { status: 400 });
    }

    const mentorOrgIds: Record<string, string | null> = {};
    for (const mentor of mentors || []) {
      const { data: mp } = await serviceClient
        .from('profiles')
        .select('org_id')
        .eq('user_id', mentor.user_id)
        .single();
      mentorOrgIds[mentor.user_id] = mp?.org_id || null;
    }

    const ranked = rankMentors(profile as Profile, mentors as any[], mentorOrgIds);

    return NextResponse.json({ data: ranked, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
