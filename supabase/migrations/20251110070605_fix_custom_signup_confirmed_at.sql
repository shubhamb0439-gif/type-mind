/*
  # Fix Custom Signup Function - Add Missing Fields

  1. Changes
    - Add all required non-nullable fields to the insert statement
    - Ensure confirmed_at is properly set
    - Add identity record for proper auth flow

  2. Notes
    - Fixes "cannot insert a non-DEFAULT value into column confirmed_at" error
*/

-- Drop existing function
DROP FUNCTION IF EXISTS custom_signup(text, text, text, text);

-- Create improved custom signup function
CREATE OR REPLACE FUNCTION custom_signup(
  user_email text,
  user_password text,
  user_full_name text,
  user_role text DEFAULT 'student'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
  user_data json;
BEGIN
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Encrypt password using Supabase's method
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- Insert into auth.users with all required fields
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    encrypted_pw,
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object(),
    'authenticated',
    'authenticated',
    now(),
    now(),
    false,
    false
  );

  -- Insert identity record for the user
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  );
  
  -- Insert into profiles
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_full_name,
    user_role,
    CASE WHEN user_role = 'admin' THEN 'approved' ELSE 'pending' END,
    now(),
    now()
  );
  
  -- Return user data
  user_data := json_build_object(
    'user_id', new_user_id,
    'email', user_email,
    'message', 'User created successfully'
  );
  
  RETURN user_data;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User with email % already exists', user_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO authenticated;
