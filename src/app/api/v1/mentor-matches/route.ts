import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('mentor_matches')
      .select('*, mentor_profile:mentor_profiles!mentor_id(*), youth_profile:profiles!youth_id(*)')
      .or(`youth_id.eq.${user.id},mentor_id.eq.${user.id}`)
      .order('matched_at', { ascending: false });

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

    const { mentor_id, score } = await request.json();

    if (!mentor_id) {
      return NextResponse.json({ data: null, error: 'mentor_id is required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('mentor_matches')
      .select('id')
      .eq('youth_id', user.id)
      .eq('mentor_id', mentor_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ data: null, error: 'Match request already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('mentor_matches')
      .insert({ youth_id: user.id, mentor_id, score })
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
