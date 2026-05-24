import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { track_id, title, content_url, content_body, type, order_index, duration_mins } = await request.json();

    if (!track_id || !title || !type) {
      return NextResponse.json({ data: null, error: 'Missing required fields: track_id, title, type' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];

    if (!allowedRoles.includes(userData?.role)) {
      return NextResponse.json({ data: null, error: 'Only mentors and trainers can create modules' }, { status: 403 });
    }

    const maxOrder = await supabase
      .from('modules')
      .select('order_index')
      .eq('track_id', track_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = order_index ?? (maxOrder.data?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from('modules')
      .insert({ track_id, title, content_url, content_body, type, order_index: nextIndex, duration_mins: duration_mins ?? 10 })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message || 'Failed to create module' }, { status: 500 });
  }
}
