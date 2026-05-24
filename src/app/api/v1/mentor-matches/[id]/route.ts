import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status: matchStatus } = body;

    const { data: match } = await supabase
      .from('mentor_matches')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!match) {
      return NextResponse.json({ data: null, error: 'Match not found' }, { status: 404 });
    }

    if (match.mentor_id !== user.id && user.role !== 'super_admin') {
      return NextResponse.json({ data: null, error: 'Only the mentor can update match status' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('mentor_matches')
      .update({ status: matchStatus })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    if (matchStatus === 'active') {
      const { data: mentorProfile } = await supabase
        .from('mentor_profiles')
        .select('total_mentees')
        .eq('user_id', match.mentor_id)
        .single();
      if (mentorProfile) {
        await supabase
          .from('mentor_profiles')
          .update({ total_mentees: (mentorProfile.total_mentees || 0) + 1 })
          .eq('user_id', match.mentor_id);
      }
    }

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
