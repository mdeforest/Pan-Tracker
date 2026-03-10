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

-- ---------------------------------------------------------------------------
-- Extended seed data for stats dashboard (Issue #1)
-- Adds 12 products, 12 pan_entries, and 12 empties spanning May 2025–Feb 2026.
--
-- Streak outcome:
--   Months with empties: May–Sep 2025 (5 consecutive), then gap in Oct 2025,
--   then Nov 2025–Feb 2026 (4 consecutive).
--   currentStreak = 4 (Nov–Feb)   longestStreak = 5 (May–Sep)
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  id, user_id, brand, name, category, photo_url, notes, archived_at, created_at
) VALUES
  (
    '10000000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    'Charlotte Tilbury', 'Airbrush Flawless Foundation', 'makeup',
    null, null, null, now() - interval '200 days'
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    'CeraVe', 'Hydrating Cleanser', 'skincare',
    null, null, null, now() - interval '340 days'
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    '11111111-1111-4111-8111-111111111111',
    'Olaplex', 'No. 3 Hair Perfector', 'haircare',
    null, null, null, now() - interval '340 days'
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    '11111111-1111-4111-8111-111111111111',
    'Sol de Janeiro', 'Brazilian Bum Bum Cream', 'bodycare',
    null, null, null, now() - interval '280 days'
  ),
  (
    '10000000-0000-4000-8000-000000000010',
    '11111111-1111-4111-8111-111111111111',
    'Jo Malone London', 'Lime Basil & Mandarin Cologne', 'fragrance',
    null, null, null, now() - interval '310 days'
  ),
  (
    '10000000-0000-4000-8000-000000000011',
    '11111111-1111-4111-8111-111111111111',
    'NARS', 'Radiant Creamy Concealer', 'makeup',
    null, null, null, now() - interval '310 days'
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111',
    'The Ordinary', 'Niacinamide 10% + Zinc 1%', 'skincare',
    null, null, null, now() - interval '160 days'
  ),
  (
    '10000000-0000-4000-8000-000000000013',
    '11111111-1111-4111-8111-111111111111',
    'Moroccanoil', 'Treatment Oil', 'haircare',
    null, null, null, now() - interval '225 days'
  ),
  (
    '10000000-0000-4000-8000-000000000014',
    '11111111-1111-4111-8111-111111111111',
    'Rare Beauty', 'Soft Pinch Tinted Lip Oil', 'makeup',
    null, null, null, now() - interval '100 days'
  ),
  (
    '10000000-0000-4000-8000-000000000015',
    '11111111-1111-4111-8111-111111111111',
    'Paula''s Choice', 'Calm Repairing Serum', 'skincare',
    null, null, null, now() - interval '190 days'
  ),
  (
    '10000000-0000-4000-8000-000000000016',
    '11111111-1111-4111-8111-111111111111',
    'NARS', 'Sheer Glow Foundation', 'makeup',
    null, null, null, now() - interval '160 days'
  ),
  (
    '10000000-0000-4000-8000-000000000017',
    '11111111-1111-4111-8111-111111111111',
    'Ouai', 'Scalp Serum', 'haircare',
    null, null, null, now() - interval '130 days'
  );

-- Pan entries (all status = 'empty') for the historical empties above.
INSERT INTO public.pan_entries (
  id, user_id, product_id, status, usage_level,
  started_month, started_year, notes, created_at, updated_at
) VALUES
  -- CeraVe Cleanser: started Apr 2025, emptied May 2025 (1 month)
  (
    '30000000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000007',
    'empty', 'almost_done', 4, 2025, null,
    now() - interval '340 days', now() - interval '313 days'
  ),
  -- Olaplex No. 3: started Apr 2025, emptied Jun 2025 (2 months)
  (
    '30000000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000008',
    'empty', 'almost_done', 4, 2025, null,
    now() - interval '338 days', now() - interval '282 days'
  ),
  -- NARS Concealer: started May 2025, emptied Jul 2025 (2 months)
  (
    '30000000-0000-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000011',
    'empty', 'almost_done', 5, 2025, null,
    now() - interval '308 days', now() - interval '252 days'
  ),
  -- Sol de Janeiro Cream: started Jun 2025, emptied Aug 2025 (2 months)
  (
    '30000000-0000-4000-8000-000000000008',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000009',
    'empty', 'almost_done', 6, 2025, null,
    now() - interval '278 days', now() - interval '221 days'
  ),
  -- Jo Malone: started May 2025, emptied Sep 2025 (4 months)
  (
    '30000000-0000-4000-8000-000000000009',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000010',
    'empty', 'almost_done', 5, 2025, 'Special occasion fragrance, took longer to use up.',
    now() - interval '308 days', now() - interval '190 days'
  ),
  -- Moroccanoil: started Aug 2025, emptied Nov 2025 (3 months)
  (
    '30000000-0000-4000-8000-000000000010',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000013',
    'empty', 'almost_done', 8, 2025, null,
    now() - interval '221 days', now() - interval '129 days'
  ),
  -- Paula's Choice Calm Serum: started Sep 2025, emptied Nov 2025 (2 months)
  (
    '30000000-0000-4000-8000-000000000011',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000015',
    'empty', 'almost_done', 9, 2025, null,
    now() - interval '190 days', now() - interval '129 days'
  ),
  -- Charlotte Tilbury Foundation: started Sep 2025, emptied Dec 2025 (3 months)
  (
    '30000000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000006',
    'empty', 'almost_done', 9, 2025, null,
    now() - interval '190 days', now() - interval '99 days'
  ),
  -- The Ordinary Niacinamide: started Oct 2025, emptied Dec 2025 (2 months)
  (
    '30000000-0000-4000-8000-000000000013',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000012',
    'empty', 'almost_done', 10, 2025, null,
    now() - interval '160 days', now() - interval '99 days'
  ),
  -- NARS Sheer Glow: started Oct 2025, emptied Jan 2026 (3 months)
  (
    '30000000-0000-4000-8000-000000000014',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000016',
    'empty', 'almost_done', 10, 2025, null,
    now() - interval '160 days', now() - interval '68 days'
  ),
  -- Ouai Scalp Serum: started Nov 2025, emptied Jan 2026 (2 months)
  (
    '30000000-0000-4000-8000-000000000015',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000017',
    'empty', 'almost_done', 11, 2025, null,
    now() - interval '129 days', now() - interval '68 days'
  ),
  -- Rare Beauty Lip Oil: started Dec 2025, emptied Feb 2026 (2 months)
  (
    '30000000-0000-4000-8000-000000000016',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000014',
    'empty', 'almost_done', 12, 2025, null,
    now() - interval '99 days', now() - interval '37 days'
  );

INSERT INTO public.empties (
  id, user_id, pan_entry_id, product_id,
  finished_month, finished_year, rating, would_repurchase,
  review_notes, replacement_product_id, replacement_free_text, created_at
) VALUES
  -- May 2025: CeraVe Hydrating Cleanser
  (
    '50000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000007',
    5, 2025, 5, 'yes', 'My HG cleanser. Never changing this.',
    null, null, now() - interval '313 days'
  ),
  -- Jun 2025: Olaplex No. 3
  (
    '50000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000008',
    6, 2025, 4, 'yes', 'Hair felt noticeably stronger. Will repurchase.',
    null, null, now() - interval '282 days'
  ),
  -- Jul 2025: NARS Radiant Creamy Concealer
  (
    '50000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000011',
    7, 2025, 5, 'yes', 'Perfect coverage, no creasing. Holy grail.',
    null, null, now() - interval '252 days'
  ),
  -- Aug 2025: Sol de Janeiro Bum Bum Cream
  (
    '50000000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000009',
    8, 2025, 4, 'maybe', 'Smells incredible but a bit heavy for summer. Maybe in winter.',
    null, null, now() - interval '221 days'
  ),
  -- Sep 2025: Jo Malone Lime Basil & Mandarin
  (
    '50000000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000010',
    9, 2025, 5, 'yes', 'Took 4 months but worth every spritz. Classic.',
    null, null, now() - interval '190 days'
  ),
  -- Nov 2025: Moroccanoil Treatment Oil
  (
    '50000000-0000-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000013',
    11, 2025, 4, 'yes', 'Great frizz control. A little goes a long way.',
    null, null, now() - interval '129 days'
  ),
  -- Nov 2025: Paula's Choice Calm Repairing Serum
  (
    '50000000-0000-4000-8000-000000000008',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000015',
    11, 2025, 3, 'maybe', 'Helped redness but the BHA is more impactful for my skin.',
    null, null, now() - interval '128 days'
  ),
  -- Dec 2025: Charlotte Tilbury Airbrush Flawless Foundation
  (
    '50000000-0000-4000-8000-000000000009',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000006',
    12, 2025, 5, 'yes', 'Flawless finish, wore all day. Definitely buying again.',
    null, null, now() - interval '99 days'
  ),
  -- Dec 2025: The Ordinary Niacinamide 10% + Zinc 1%
  (
    '50000000-0000-4000-8000-000000000010',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000013',
    '10000000-0000-4000-8000-000000000012',
    12, 2025, 4, 'yes', 'Pores look smaller. Great budget skincare.',
    null, null, now() - interval '98 days'
  ),
  -- Jan 2026: NARS Sheer Glow Foundation
  (
    '50000000-0000-4000-8000-000000000011',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000014',
    '10000000-0000-4000-8000-000000000016',
    1, 2026, 4, 'yes', 'Moved to Airbrush Flawless for better coverage but this is lovely too.',
    null, null, now() - interval '68 days'
  ),
  -- Jan 2026: Ouai Scalp Serum
  (
    '50000000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000015',
    '10000000-0000-4000-8000-000000000017',
    1, 2026, 3, 'no', 'Didn''t notice much difference. Trying a different brand next.',
    null, null, now() - interval '67 days'
  ),
  -- Feb 2026: Rare Beauty Soft Pinch Tinted Lip Oil
  (
    '50000000-0000-4000-8000-000000000013',
    '11111111-1111-4111-8111-111111111111',
    '30000000-0000-4000-8000-000000000016',
    '10000000-0000-4000-8000-000000000014',
    2, 2026, 5, 'yes', 'Best lip product I own. Comfortable all day.',
    null, null, now() - interval '37 days'
  );

COMMIT;
