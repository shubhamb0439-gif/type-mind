/*
  # Add Approval Workflow

  1. Changes
    - Update custom_signup to set banned_until for pending users
    - Create function to check approval status
    - Create function for admin to approve users

  2. Security
    - Only approved users can login
    - Only admins can approve users
    - Students default to 'pending' status and cannot login until approved
*/

-- Drop existing function
DROP FUNCTION IF EXISTS custom_signup(text, text, text, text);

-- Create custom signup function with approval workflow
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
  ban_date timestamptz;
BEGIN
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Encrypt password
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- For students, set banned_until far in future (effectively banned until admin approves)
  -- For admins, no ban
  IF user_role = 'student' THEN
    ban_date := '2099-12-31'::timestamptz;
  ELSE
    ban_date := NULL;
  END IF;
  
  -- Insert into auth.users
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
    is_anonymous,
    banned_until
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
    false,
    ban_date
  );

  -- Insert identity record
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
    'role', user_role,
    'status', CASE WHEN user_role = 'admin' THEN 'approved' ELSE 'pending' END,
    'message', CASE 
      WHEN user_role = 'student' THEN 'Account created. Please wait for admin approval before logging in.'
      ELSE 'Admin account created successfully.'
    END
  );
  
  RETURN user_data;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User with email % already exists', user_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$;

-- Create function for admin to approve users
CREATE OR REPLACE FUNCTION approve_user(user_id_to_approve uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  -- Update auth.users to remove ban
  UPDATE auth.users
  SET banned_until = NULL,
      updated_at = now()
  WHERE id = user_id_to_approve;

  -- Update profile status
  UPDATE profiles
  SET status = 'approved',
      updated_at = now()
  WHERE id = user_id_to_approve;

  result := json_build_object(
    'user_id', user_id_to_approve,
    'message', 'User approved successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error approving user: %', SQLERRM;
END;
$$;

-- Create function for admin to reject users
CREATE OR REPLACE FUNCTION reject_user(user_id_to_reject uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  -- Update profile status
  UPDATE profiles
  SET status = 'rejected',
      updated_at = now()
  WHERE id = user_id_to_reject;

  result := json_build_object(
    'user_id', user_id_to_reject,
    'message', 'User rejected successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error rejecting user: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION custom_signup(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(uuid) TO authenticated;
