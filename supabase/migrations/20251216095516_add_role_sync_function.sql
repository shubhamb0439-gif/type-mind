/*
  # Add Role Synchronization Function

  1. Functions
    - `sync_user_role_from_employees()` - Syncs role from employees table to typemind_profiles
    
  2. Purpose
    - When vSuite super admin sets someone as admin in the employees table,
      this function will sync that role to typemind_profiles
    - Can be called manually or automatically on login
    
  3. Usage
    - Call this function passing a user ID to sync their role
    - Returns the updated role
*/

CREATE OR REPLACE FUNCTION sync_user_role_from_employees(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employee_role text;
  v_new_typemind_role text;
  v_current_typemind_role text;
BEGIN
  SELECT role INTO v_employee_role
  FROM employees
  WHERE id = p_user_id;
  
  SELECT role INTO v_current_typemind_role
  FROM typemind_profiles
  WHERE id = p_user_id;
  
  IF v_employee_role IN ('admin', 'super_admin') THEN
    v_new_typemind_role := 'admin';
  ELSE
    v_new_typemind_role := 'student';
  END IF;
  
  IF v_current_typemind_role != v_new_typemind_role OR v_current_typemind_role IS NULL THEN
    UPDATE typemind_profiles
    SET role = v_new_typemind_role,
        updated_at = now()
    WHERE id = p_user_id;
    
    RETURN v_new_typemind_role;
  END IF;
  
  RETURN v_current_typemind_role;
END;
$$;
