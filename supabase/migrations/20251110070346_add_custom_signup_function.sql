/*
  # Add Custom Signup Function (Bypasses Email Validation)

  1. Purpose
    - Creates a custom signup function that bypasses Supabase's email validation
    - Allows dummy/test email addresses to be used
    - Automatically confirms emails and creates profile records

  2. Function Details
    - Takes email, password, full_name, and role as parameters
    - Creates user in auth.users with confirmed email
    - Creates corresponding profile record
    - Returns user ID on success

  3. Security Notes
    - This is for development/testing purposes
    - Passwords are properly hashed using Supabase's crypt function
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop function if exists
DROP FUNCTION IF EXISTS custom_signup(text, text, text, text);

-- Create custom signup function
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
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
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
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    false,
    false
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO authenticated;
