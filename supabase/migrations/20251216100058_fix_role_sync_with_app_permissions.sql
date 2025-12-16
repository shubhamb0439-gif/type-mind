/*
  # Fix Role Sync to Check App-Specific Permissions

  1. Changes
    - Updates `sync_user_role_from_employees()` function to check app_permissions table
    - Prioritizes app-specific role (app_permissions.app_role) over global role (employees.role)
    - Falls back to employees table if no app-specific permissions exist
    
  2. Purpose
    - When vSuite super admin sets someone as "admin for TypeMind" in app_permissions,
      this function will now correctly detect and sync that role
    - Ensures TypeMind respects app-specific role assignments from vSuite
*/

CREATE OR REPLACE FUNCTION sync_user_role_from_employees(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app_role text;
  v_employee_role text;
  v_new_typemind_role text;
  v_current_typemind_role text;
  v_typemind_app_id uuid := '8d010f2a-2ebe-46cf-9b44-6208a0a2e9bb';
BEGIN
  SELECT app_role INTO v_app_role
  FROM app_permissions
  WHERE employee_id = p_user_id 
    AND app_id = v_typemind_app_id
  LIMIT 1;
  
  SELECT role INTO v_employee_role
  FROM employees
  WHERE id = p_user_id;
  
  SELECT role INTO v_current_typemind_role
  FROM typemind_profiles
  WHERE id = p_user_id;
  
  IF v_app_role = 'admin' THEN
    v_new_typemind_role := 'admin';
  ELSIF v_employee_role IN ('admin', 'super_admin') THEN
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
