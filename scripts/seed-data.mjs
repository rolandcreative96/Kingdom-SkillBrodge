import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('=== Seeding Organisations ===');
  const { error: orgErr } = await supabase.from('organisations').insert([
    { id: '00000000-0000-0000-0000-000000000001', name: 'Victory Chapel International', type: 'church', country: 'Nigeria' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Campus Light Fellowship', type: 'campus', country: 'Nigeria' },
  ]);
  if (orgErr) console.error('Orgs:', orgErr.message);
  else console.log('  Inserted 2 organisations');

  console.log('\n=== Seeding Opportunities ===');
  const { error: oppErr } = await supabase.from('opportunities').insert([
    { org_id: '00000000-0000-0000-0000-000000000001', title: 'Junior Web Developer Intern', type: 'internship', description: 'Join our church tech team to build and maintain the church website and digital tools. 3-month paid internship.', skills_required: ['JavaScript', 'React', 'CSS'], deadline: '2026-08-01T00:00:00Z', is_active: true },
    { org_id: '00000000-0000-0000-0000-000000000001', title: 'Social Media Manager', type: 'job', description: 'Manage social media accounts for Victory Chapel. Create content, schedule posts, and grow engagement.', skills_required: ['Social Media', 'Content Writing', 'Graphic Design'], deadline: '2026-07-15T00:00:00Z', is_active: true },
    { org_id: '00000000-0000-0000-0000-000000000001', title: 'Graphic Design Freelance Project', type: 'gig', description: 'Design church conference materials: banners, flyers, and social media graphics. One-time project.', skills_required: ['Graphic Design', 'Figma', 'Photoshop'], deadline: '2026-06-30T00:00:00Z', is_active: true },
    { org_id: '00000000-0000-0000-0000-000000000002', title: 'Tech Support Volunteer', type: 'volunteer', description: 'Help campus fellowship students with basic tech support and digital literacy training.', skills_required: ['JavaScript', 'Python', 'Problem Solving'], deadline: null, is_active: true },
  ]);
  if (oppErr) console.error('Opportunities:', oppErr.message);
  else console.log('  Inserted 4 opportunities');

  console.log('\nDone. Seed data loaded.');
}

seed().catch(console.error);
