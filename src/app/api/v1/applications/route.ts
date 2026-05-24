import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const opportunityId = new URL(request.url).searchParams.get('opportunity_id');

    let query = supabase
      .from('applications')
      .select('*, opportunity:opportunities(*)')
      .eq('user_id', user.id);

    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    }

    const { data, error } = await query.order('applied_at', { ascending: false });

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

    const { opportunity_id, cover_note } = await request.json();

    if (!opportunity_id) {
      return NextResponse.json({ data: null, error: 'opportunity_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({ user_id: user.id, opportunity_id, cover_note })
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
