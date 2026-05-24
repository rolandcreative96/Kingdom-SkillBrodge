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

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!task) {
      return NextResponse.json({ data: null, error: 'Task not found' }, { status: 404 });
    }

    if (task.assigned_to !== user.id && user.role !== 'super_admin') {
      return NextResponse.json({ data: null, error: 'Only the assignee can update this task' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', params.id)
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
