import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const orgId = searchParams.get('org_id');
    const skill = searchParams.get('skill');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('opportunities')
      .select('*, organisation:organisations(*)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (orgId) query = query.eq('org_id', orgId);
    if (skill) query = query.contains('skills_required', [skill]);

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      error: null,
      meta: { page, limit, total: count || 0 },
    });
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

    const userData = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userData.data || userData.data.role !== 'org_admin') {
      return NextResponse.json({ data: null, error: 'Only org admins can create opportunities' }, { status: 403 });
    }

    const profile = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();
    if (!profile.data?.org_id) {
      return NextResponse.json({ data: null, error: 'You must belong to an organisation first' }, { status: 400 });
    }

    const { title, type, description, skills_required, deadline } = await request.json();

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        org_id: profile.data.org_id,
        title,
        type,
        description,
        skills_required: skills_required || [],
        deadline,
      })
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
