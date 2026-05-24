import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];
    if (!allowedRoles.includes(userData?.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { title, content_url, content_body, type, order_index, duration_mins } = await request.json();

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (content_url !== undefined) updates.content_url = content_url;
    if (content_body !== undefined) updates.content_body = content_body;
    if (type !== undefined) updates.type = type;
    if (order_index !== undefined) updates.order_index = order_index;
    if (duration_mins !== undefined) updates.duration_mins = duration_mins;

    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message || 'Failed to update module' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const allowedRoles = ['mentor', 'trainer', 'org_admin', 'super_admin'];
    if (!allowedRoles.includes(userData?.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('modules').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { deleted: true }, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message || 'Failed to delete module' }, { status: 500 });
  }
}
