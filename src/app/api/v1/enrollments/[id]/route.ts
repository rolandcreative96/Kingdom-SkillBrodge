import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { generateCertUid } from '@/lib/utils';

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

    const { progress_pct } = await request.json();

    const updateData: Record<string, any> = {};
    if (progress_pct !== undefined) {
      updateData.progress_pct = progress_pct;
      if (progress_pct >= 100) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    if (progress_pct >= 100) {
      const certUid = generateCertUid();
      const serviceClient = createServiceClient();

      await serviceClient.from('certifications').insert({
        user_id: user.id,
        track_id: data.track_id,
        cert_uid: certUid,
        verification_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certUid}`,
      });

      await supabase
        .from('enrollments')
        .update({ certificate_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certUid}` })
        .eq('id', params.id);
    }

    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
