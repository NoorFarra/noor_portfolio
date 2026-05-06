insert into public.projects (
  title,
  description,
  image_url,
  live_url,
  is_featured,
  is_published,
  display_order
)
values
(
  'Obsidian Ledger',
  'A modern dashboard concept with a moody premium feel, focused on clarity, speed, and storytelling.',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://example.com/obsidian-ledger',
  true,
  true,
  1
),
(
  'CyberPeak Security',
  'A security-focused product experience that combines strong UI hierarchy with crisp interaction patterns.',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80',
  'https://example.com/cyberpeak-security',
  false,
  true,
  2
),
(
  'Aether Network',
  'A clean product presentation crafted for speed, atmosphere, and modern brand storytelling.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'https://example.com/aether-network',
  false,
  true,
  3
);
