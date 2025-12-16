/*
  # Create Test Users with Proper Profiles
  
  Creates two test users with proper authentication and profiles
*/

-- Create intermediate test user
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_lesson_id uuid;
BEGIN
  -- Get a lesson ID
  SELECT id INTO v_lesson_id FROM classes LIMIT 1;
  
  -- Insert user into auth.users
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
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'intermediate@test.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"student"}'::jsonb,
    '{"full_name":"Alex Intermediate"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  );
  
  -- Create profile manually
  INSERT INTO profiles (id, email, full_name, role, status, level)
  VALUES (v_user_id, 'intermediate@test.com', 'Alex Intermediate', 'student', 'approved', 'intermediate');
  
  -- Add lesson completions for C-Rank (350 points)
  INSERT INTO lesson_completions (user_id, lesson_id, wpm, accuracy, score, time_spent)
  VALUES
    (v_user_id, v_lesson_id, 45, 85, 80, 300),
    (v_user_id, v_lesson_id, 48, 87, 85, 280),
    (v_user_id, v_lesson_id, 50, 88, 90, 270),
    (v_user_id, v_lesson_id, 52, 89, 95, 260);
  
  RAISE NOTICE 'Created intermediate user: intermediate@test.com / Test123!';
END $$;

-- Create advanced test user
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_lesson_id uuid;
BEGIN
  -- Get a lesson ID
  SELECT id INTO v_lesson_id FROM classes LIMIT 1;
  
  -- Insert user into auth.users
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
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'advanced@test.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"],"role":"student"}'::jsonb,
    '{"full_name":"Jordan Advanced"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  );
  
  -- Create profile manually
  INSERT INTO profiles (id, email, full_name, role, status, level)
  VALUES (v_user_id, 'advanced@test.com', 'Jordan Advanced', 'student', 'approved', 'advanced');
  
  -- Add lesson completions for B-Rank (590 points)
  INSERT INTO lesson_completions (user_id, lesson_id, wpm, accuracy, score, time_spent)
  VALUES
    (v_user_id, v_lesson_id, 60, 92, 95, 250),
    (v_user_id, v_lesson_id, 62, 93, 97, 240),
    (v_user_id, v_lesson_id, 65, 94, 98, 235),
    (v_user_id, v_lesson_id, 67, 95, 100, 230),
    (v_user_id, v_lesson_id, 68, 95, 100, 225),
    (v_user_id, v_lesson_id, 70, 96, 100, 220);
  
  RAISE NOTICE 'Created advanced user: advanced@test.com / Test123!';
END $$;
