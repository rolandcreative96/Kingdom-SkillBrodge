import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await supabase.from('users').select('role').eq('id', user.id).single();
    const profile = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();

    if (
      userData.data?.role !== 'org_admin' ||
      profile.data?.org_id !== params.id
    ) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { data: memberIds } = await supabase
      .from('org_memberships')
      .select('user_id')
      .eq('org_id', params.id)
      .eq('status', 'active');

    const userIds = (memberIds || []).map((m: any) => m.user_id);

    const { data: oppIds } = await supabase
      .from('opportunities')
      .select('id')
      .eq('org_id', params.id);

    const opportunityIds = (oppIds || []).map((o: any) => o.id);

    const { data: matchIds } = await supabase
      .from('mentor_matches')
      .select('id')
      .in('mentor_id', userIds.length > 0 ? userIds : ['']);

    const mentorMatchIds = (matchIds || []).map((m: any) => m.id);

    const { count: total_members } = await supabase
      .from('org_memberships')
      .select('id', { count: 'exact' })
      .eq('org_id', params.id)
      .eq('status', 'active');

    const { count: active_enrollments } = userIds.length > 0
      ? await supabase.from('enrollments').select('id', { count: 'exact' }).in('user_id', userIds)
      : { count: 0 };

    const { count: completed_certifications } = userIds.length > 0
      ? await supabase.from('certifications').select('id', { count: 'exact' }).in('user_id', userIds)
      : { count: 0 };

    const { count: mentor_sessions_this_month } = mentorMatchIds.length > 0
      ? await supabase
          .from('mentorship_sessions')
          .select('id', { count: 'exact' })
          .in('match_id', mentorMatchIds)
          .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      : { count: 0 };

    const { count: employment_outcomes } = opportunityIds.length > 0
      ? await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .in('opportunity_id', opportunityIds)
          .eq('status', 'accepted')
      : { count: 0 };

    return NextResponse.json({
      data: {
        total_members: total_members || 0,
        active_enrollments: active_enrollments || 0,
        avg_progress: 0,
        completed_certifications: completed_certifications || 0,
        mentor_sessions_this_month: mentor_sessions_this_month || 0,
        employment_outcomes: employment_outcomes || 0,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
