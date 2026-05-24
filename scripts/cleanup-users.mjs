import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function cleanup() {
  console.log('=== Step 1: Delete all auth users ===');
  let total = 0;
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) { console.error('Failed to list users:', error.message); break; }
    const users = data?.users;
    if (!users?.length) break;
    for (const u of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.error(`  Failed ${u.email} (${u.id}): ${delErr.message}`);
      else { total++; process.stdout.write(`.`); }
    }
    page++;
  }
  console.log(`\nRemoved ${total} auth users.`);

  console.log('\n=== Step 2: Clear remaining orphaned public data ===');
  const tables = [
    'certifications', 'goals', 'mentorship_sessions', 'mentor_matches',
    'mentor_profiles', 'tasks', 'project_members', 'projects',
    'applications', 'enrollments', 'modules', 'skill_tracks',
    'org_memberships', 'profiles', 'users',
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      if (error.message?.includes('0 rows')) continue;
      console.error(`  ${t}: ${error.message}`);
    } else {
      console.log(`  Cleared ${t}`);
    }
  }

  console.log('\nDone. Database is clean.');
}

cleanup().catch(console.error);
