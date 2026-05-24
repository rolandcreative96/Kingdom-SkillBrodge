-- Kingdom SkillBridge Seed Data
-- Run after schema migration to populate demo content

-- Sample Organisations
INSERT INTO public.organisations (id, name, type, country) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Victory Chapel International', 'church', 'Nigeria'),
  ('00000000-0000-0000-0000-000000000002', 'Campus Light Fellowship', 'campus', 'Nigeria');

-- Sample Opportunities
INSERT INTO public.opportunities (org_id, title, type, description, skills_required, deadline, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Junior Web Developer Intern', 'internship', 'Join our church tech team to build and maintain the church website and digital tools. 3-month paid internship.', ARRAY['JavaScript', 'React', 'CSS'], '2026-08-01T00:00:00Z', true),
  ('00000000-0000-0000-0000-000000000001', 'Social Media Manager', 'job', 'Manage social media accounts for Victory Chapel. Create content, schedule posts, and grow engagement.', ARRAY['Social Media', 'Content Writing', 'Graphic Design'], '2026-07-15T00:00:00Z', true),
  ('00000000-0000-0000-0000-000000000001', 'Graphic Design Freelance Project', 'gig', 'Design church conference materials: banners, flyers, and social media graphics. One-time project.', ARRAY['Graphic Design', 'Figma', 'Photoshop'], '2026-06-30T00:00:00Z', true),
  ('00000000-0000-0000-0000-000000000002', 'Tech Support Volunteer', 'volunteer', 'Help campus fellowship students with basic tech support and digital literacy training.', ARRAY['JavaScript', 'Python', 'Problem Solving'], null, true);
