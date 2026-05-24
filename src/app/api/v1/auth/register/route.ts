import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, org_name, org_type } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ data: null, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ data: null, error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ data: null, error: 'User creation failed.' }, { status: 500 });
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      role: role || 'youth',
    });

    if (userError) {
      return NextResponse.json({ data: null, error: userError.message }, { status: 400 });
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      full_name,
      skill_tags: [],
    });

    if (profileError) {
      return NextResponse.json({ data: null, error: profileError.message }, { status: 400 });
    }

    let orgId: string | null = null;

    if (org_name) {
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({ name: org_name, type: org_type || 'church', country: 'Nigeria' })
        .select()
        .single();

      if (!orgError && org) {
        orgId = org.id;
        await supabase.from('org_memberships').insert({
          user_id: userId,
          org_id: org.id,
          role: role === 'org_admin' ? 'admin' : 'member',
        });
        await supabase.from('profiles').update({ org_id: org.id }).eq('user_id', userId);
      }
    }

    return NextResponse.json({
      data: { user_id: userId, org_id: orgId, message: 'Registration successful. You can now sign in.' },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message || 'Registration failed' }, { status: 500 });
  }
}
