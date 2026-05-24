import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, title, description, assigned_to, due_date } = await request.json();

    if (!project_id || !title) {
      return NextResponse.json({ data: null, error: 'project_id and title are required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ data: null, error: 'Project not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title,
        description,
        assigned_to: assigned_to || user.id,
        due_date,
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
