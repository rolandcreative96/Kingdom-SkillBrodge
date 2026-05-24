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

    const { status } = await request.json();

    const { data: app } = await supabase
      .from('applications')
      .select('*, opportunity:opportunities(*)')
      .eq('id', params.id)
      .single();

    if (!app) {
      return NextResponse.json({ data: null, error: 'Application not found' }, { status: 404 });
    }

    const userData = await supabase.from('users').select('role').eq('id', user.id).single();
    const profile = await supabase.from('profiles').select('org_id').eq('user_id', user.id).single();

    if (
      userData.data?.role !== 'org_admin' ||
      profile.data?.org_id !== app.opportunity.org_id
    ) {
      return NextResponse.json({ data: null, error: 'Only the org admin can update application status' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
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
