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
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('skill_tracks')
      .select('*, modules:modules(*)', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (difficulty) query = query.eq('difficulty', difficulty);

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
    if (!userData.data || !['trainer', 'org_admin', 'super_admin'].includes(userData.data.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, difficulty, description } = body;

    const { data, error } = await supabase
      .from('skill_tracks')
      .insert({ title, category, difficulty, description, created_by: user.id, is_published: true })
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
