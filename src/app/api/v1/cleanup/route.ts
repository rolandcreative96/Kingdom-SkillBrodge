import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = createServiceClient();

    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ data: null, error: listError.message }, { status: 500 });
    }

    const userIds = authUsers.users.map(u => u.id);
    let deleted = 0;

    for (const uid of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(uid);
      if (!error) deleted++;
    }

    return NextResponse.json({
      data: { deleted_users: deleted, total: userIds.length },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
