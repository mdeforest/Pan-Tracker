-- Local development seed data for `supabase db reset`.
-- This seeds two users plus representative products, pan entries, picks, and an empty.

BEGIN;

-- Remove any previous copies of these deterministic seed users.
DELETE FROM public.empties
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM public.monthly_picks
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM public.pan_entries
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM public.products
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM public.users
WHERE id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM auth.identities
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

DELETE FROM auth.users
WHERE id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

-- Seed auth users so foreign keys into public.users remain valid.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'demo-pan@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Pan User","provider_id":"local-demo-pan-user"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'other-pan@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other Test User","provider_id":"local-other-pan-user"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES
  (
    'aaaaaaa1-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo-pan@example.com"}',
    'email',
    'demo-pan@example.com',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbb2-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"other-pan@example.com"}',
    'email',
    'other-pan@example.com',
    now(),
    now(),
    now()
  );

INSERT INTO public.products (
  id,
  user_id,
  brand,
  name,
  category,
  photo_url,
  notes,
  archived_at,
  created_at
) VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Rare Beauty',
    'Soft Pinch Liquid Blush',
    'makeup',
    null,
    'Current blush in rotation.',
    null,
    now() - interval '90 days'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Paula''s Choice',
    '2% BHA Liquid Exfoliant',
    'skincare',
    null,
    'Almost done, use twice a week.',
    null,
    now() - interval '80 days'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'Ouai',
    'Leave In Conditioner',
    'haircare',
    null,
    'Carry-over from last month.',
    null,
    now() - interval '70 days'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'Glossier',
    'Balm Dotcom',
    'bodycare',
    null,
    'Archived sample product.',
    now() - interval '14 days',
    now() - interval '60 days'
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Maison Margiela',
    'Replica Beach Walk',
    'fragrance',
    null,
    'Finished last month.',
    null,
    now() - interval '120 days'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'Tower 28',
    'ShineOn Lip Jelly',
    'makeup',
    null,
    'Belongs to another user for ownership testing.',
    null,
    now() - interval '30 days'
  );

INSERT INTO public.pan_entries (
  id,
  user_id,
  product_id,
  status,
  usage_level,
  started_month,
  started_year,
  notes,
  created_at,
  updated_at
) VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000001',
    'active',
    'half',
    3,
    2026,
    'Priority cheek product for the month.',
    now() - interval '20 days',
    now() - interval '1 day'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000002',
    'active',
    'almost_done',
    3,
    2026,
    'Should become an empty soon.',
    now() - interval '18 days',
    now() - interval '2 days'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000003',
    'paused',
    'quarter',
    2,
    2026,
    'Paused while focusing on shampoo.',
    now() - interval '40 days',
    now() - interval '8 days'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000005',
    'empty',
    'almost_done',
    2,
    2026,
    'Finished during February reset.',
    now() - interval '55 days',
    now() - interval '25 days'
  );

INSERT INTO public.monthly_picks (
  id,
  user_id,
  pan_entry_id,
  month,
  year,
  carried_over_from_month,
  carried_over_from_year,
  created_at
) VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000001',
    3,
    2026,
    null,
    null,
    now() - interval '15 days'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000002',
    3,
    2026,
    null,
    null,
    now() - interval '15 days'
  );

INSERT INTO public.empties (
  id,
  user_id,
  pan_entry_id,
  product_id,
  finished_month,
  finished_year,
  rating,
  would_repurchase,
  review_notes,
  replacement_product_id,
  replacement_free_text,
  created_at
) VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000005',
    2,
    2026,
    4,
    'yes',
    'Easy everyday fragrance. Would pan again.',
    null,
    'Consider repurchasing during the Sephora sale.',
    now() - interval '25 days'
  );

COMMIT;
