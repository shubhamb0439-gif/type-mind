/*
  # Sync Role to Auth Metadata

  1. Purpose
    - Automatically sync role from profiles table to auth.users app_metadata
    - This ensures JWT claims always have the correct role
    - Fixes "Database error querying schema" by ensuring proper auth setup

  2. Changes
    - Create function to sync role to app_metadata
    - Add trigger on profiles INSERT to sync role immediately
    - Add trigger on profiles UPDATE to keep role in sync

  3. Security
    - Function runs with SECURITY DEFINER to allow auth schema updates
    - Only syncs when profile role changes
*/

-- Function to sync role from profile to auth.users app_metadata
CREATE OR REPLACE FUNCTION sync_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's app_metadata with the role from their profile
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_role_on_profile_insert ON profiles;
DROP TRIGGER IF EXISTS sync_role_on_profile_update ON profiles;

-- Trigger on INSERT to sync role when profile is created
CREATE TRIGGER sync_role_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_auth_metadata();

-- Trigger on UPDATE to sync role when profile role changes
CREATE TRIGGER sync_role_on_profile_update
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION sync_role_to_auth_metadata();
