import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const allowedVideo = ['mp4', 'webm', 'mov', 'avi'];
    const allowedAudio = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    const allowedImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const allowedDocument = ['pdf', 'doc', 'docx', 'txt'];
    const allowed = [...allowedVideo, ...allowedAudio, ...allowedImage, ...allowedDocument];

    if (!allowed.includes(ext)) {
      return NextResponse.json({ data: null, error: `File type .${ext} not allowed` }, { status: 400 });
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from('lesson-content')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('lesson-content')
      .getPublicUrl(fileName);

    return NextResponse.json({ data: { url: publicUrl, name: file.name, size: file.size }, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message || 'Upload failed' }, { status: 500 });
  }
}
