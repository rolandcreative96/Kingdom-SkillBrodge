import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const matchId = new URL(request.url).searchParams.get('match_id');

    let query = supabase
      .from('mentorship_sessions')
      .select('*, match:mentor_matches(*)');

    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data, error } = await query.order('scheduled_at', { ascending: false });

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { match_id, scheduled_at, duration_mins, notes } = await request.json();

    if (!match_id || !scheduled_at) {
      return NextResponse.json({ data: null, error: 'match_id and scheduled_at are required' }, { status: 400 });
    }

    const { data: match } = await supabase
      .from('mentor_matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (!match) {
      return NextResponse.json({ data: null, error: 'Match not found' }, { status: 404 });
    }

    if (match.youth_id !== user.id && match.mentor_id !== user.id) {
      return NextResponse.json({ data: null, error: 'Not part of this match' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert({ match_id, scheduled_at, duration_mins: duration_mins || 30, notes })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
