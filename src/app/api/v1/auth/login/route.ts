import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ data: null, error: 'Missing email or password' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 401 });
    }

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.user!.id);

    const response = NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
