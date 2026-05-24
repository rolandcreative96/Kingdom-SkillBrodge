import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();
    if (!profile.data?.org_id) {
      return NextResponse.json({ data: [], error: null });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks:tasks(*), members:project_members(*, profile:profiles(*))')
      .eq('org_id', profile.data.org_id)
      .order('created_at', { ascending: false });

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

    const profile = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();
    if (!profile.data?.org_id) {
      return NextResponse.json({ data: null, error: 'You must belong to an organisation' }, { status: 400 });
    }

    const { title, description } = await request.json();

    const { data, error } = await supabase
      .from('projects')
      .insert({ title, description, team_lead_id: user.id, org_id: profile.data.org_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: user.id,
      role: 'lead',
    });

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
