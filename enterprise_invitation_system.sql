-- Enhanced Enterprise User Invitation & Management System
-- Complete functions for enterprise manager user invitations

-- Create user invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'enterprise_user',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(email, company_id) -- Prevent duplicate invitations for same email to same company
);

-- Function to invite a single user
CREATE OR REPLACE FUNCTION public.invite_enterprise_user(
  user_email TEXT,
  user_name TEXT,
  user_role user_role DEFAULT 'enterprise_user',
  manager_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
  invitation_id UUID;
  invitation_token UUID;
  company_name TEXT;
  manager_name TEXT;
  manager_email TEXT;
  existing_user_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only enterprise managers can invite users'
    );
  END IF;
  
  -- Get company and manager details for the invitation email
  SELECT c.name, u.name, u.email INTO company_name, manager_name, manager_email
  FROM public.companies c
  JOIN public.users u ON u.id = manager_id
  WHERE c.id = manager_company_id;
  
  -- Check if user already exists in the system
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = user_email;
  
  -- If user exists and is already in this company, return error
  IF existing_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.users WHERE id = existing_user_id AND company_id = manager_company_id) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'User is already a member of your company'
      );
    END IF;
  END IF;
  
  -- Check if there's already a pending invitation
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email = user_email 
      AND company_id = manager_company_id 
      AND status = 'pending'
      AND expires_at > NOW()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'There is already a pending invitation for this email'
    );
  END IF;
  
  -- Check company user limits
  DECLARE
    current_user_count INTEGER;
    max_users INTEGER;
  BEGIN
    SELECT current_users, max_users INTO current_user_count, max_users
    FROM public.companies
    WHERE id = manager_company_id;
    
    IF current_user_count >= max_users THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Company has reached maximum user limit'
      );
    END IF;
  END;
  
  -- Create the invitation
  INSERT INTO public.user_invitations (
    email,
    name,
    company_id,
    invited_by,
    role,
    status
  ) VALUES (
    user_email,
    user_name,
    manager_company_id,
    manager_id,
    user_role,
    'pending'
  ) RETURNING id, invitation_token INTO invitation_id, invitation_token;
  
  -- Return invitation details for email sending
  RETURN json_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'invitation_token', invitation_token,
    'email', user_email,
    'name', user_name,
    'company_name', company_name,
    'manager_name', manager_name,
    'manager_email', manager_email,
    'expires_at', (NOW() + INTERVAL '7 days')::TEXT,
    'invitation_url', 'https://yourdomain.com/accept-invitation/' || invitation_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk invite users from CSV data
CREATE OR REPLACE FUNCTION public.bulk_invite_enterprise_users(
  users_data JSON,
  manager_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
  user_record JSON;
  invitation_result JSON;
  successful_invitations JSON[] := '{}';
  failed_invitations JSON[] := '{}';
  total_processed INTEGER := 0;
  successful_count INTEGER := 0;
  failed_count INTEGER := 0;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only enterprise managers can bulk invite users'
    );
  END IF;
  
  -- Process each user in the JSON array
  FOR user_record IN SELECT * FROM json_array_elements(users_data)
  LOOP
    total_processed := total_processed + 1;
    
    -- Validate required fields
    IF NOT (user_record ? 'email') OR NOT (user_record ? 'name') THEN
      failed_invitations := failed_invitations || json_build_object(
        'email', COALESCE(user_record->>'email', 'missing'),
        'name', COALESCE(user_record->>'name', 'missing'),
        'error', 'Missing required fields (email or name)'
      );
      failed_count := failed_count + 1;
      CONTINUE;
    END IF;
    
    -- Attempt to invite the user
    SELECT public.invite_enterprise_user(
      user_record->>'email',
      user_record->>'name',
      COALESCE((user_record->>'role')::user_role, 'enterprise_user'),
      manager_id
    ) INTO invitation_result;
    
    IF (invitation_result->>'success')::boolean THEN
      successful_invitations := successful_invitations || invitation_result;
      successful_count := successful_count + 1;
    ELSE
      failed_invitations := failed_invitations || json_build_object(
        'email', user_record->>'email',
        'name', user_record->>'name',
        'error', invitation_result->>'error'
      );
      failed_count := failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_processed', total_processed,
    'successful_count', successful_count,
    'failed_count', failed_count,
    'successful_invitations', array_to_json(successful_invitations),
    'failed_invitations', array_to_json(failed_invitations)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token_param UUID,
  auth_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  invitation RECORD;
  target_user_id UUID;
  company_max_users INTEGER;
  company_current_users INTEGER;
BEGIN
  -- Get the auth user ID (default to current authenticated user)
  target_user_id := COALESCE(auth_user_id, auth.uid());
  
  -- Find the invitation
  SELECT * INTO invitation
  FROM public.user_invitations
  WHERE invitation_token = invitation_token_param
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Check company user limits
  SELECT max_users, current_users INTO company_max_users, company_current_users
  FROM public.companies
  WHERE id = invitation.company_id;
  
  IF company_current_users >= company_max_users THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Company has reached maximum user limit'
    );
  END IF;
  
  -- Create or update the user record
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    company_id,
    status
  ) VALUES (
    target_user_id,
    invitation.email,
    invitation.name,
    invitation.role,
    invitation.company_id,
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    company_id = invitation.company_id,
    role = invitation.role,
    updated_at = NOW();
  
  -- Update the invitation status
  UPDATE public.user_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = invitation.id;
  
  -- Update company user count
  UPDATE public.companies
  SET 
    current_users = current_users + 1,
    updated_at = NOW()
  WHERE id = invitation.company_id;
  
  -- Get company details for response
  DECLARE
    company_name TEXT;
  BEGIN
    SELECT name INTO company_name
    FROM public.companies
    WHERE id = invitation.company_id;
    
    RETURN json_build_object(
      'success', true,
      'user_id', target_user_id,
      'company_id', invitation.company_id,
      'company_name', company_name,
      'role', invitation.role,
      'message', 'Successfully joined ' || company_name
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending invitations for a manager
CREATE OR REPLACE FUNCTION public.get_pending_invitations(manager_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role user_role,
  status TEXT,
  invitation_token UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RAISE EXCEPTION 'Only enterprise managers can view pending invitations';
  END IF;
  
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.name,
    i.role,
    i.status,
    i.invitation_token,
    i.expires_at,
    i.created_at,
    EXTRACT(DAY FROM (i.expires_at - NOW()))::INTEGER as days_remaining
  FROM public.user_invitations i
  WHERE i.company_id = manager_company_id
    AND i.status = 'pending'
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel an invitation
CREATE OR REPLACE FUNCTION public.cancel_invitation(
  invitation_id UUID,
  manager_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
  invitation_company_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RAISE EXCEPTION 'Only enterprise managers can cancel invitations';
  END IF;
  
  -- Get invitation company
  SELECT company_id INTO invitation_company_id
  FROM public.user_invitations
  WHERE id = invitation_id AND status = 'pending';
  
  IF invitation_company_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify manager can cancel this invitation
  IF manager_company_id != invitation_company_id THEN
    RAISE EXCEPTION 'Manager can only cancel invitations from their company';
  END IF;
  
  -- Cancel the invitation
  UPDATE public.user_invitations
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = invitation_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend invitation (extends expiry and generates new token)
CREATE OR REPLACE FUNCTION public.resend_invitation(
  invitation_id UUID,
  manager_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
  invitation_company_id UUID;
  new_token UUID;
  invitation_record RECORD;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only enterprise managers can resend invitations'
    );
  END IF;
  
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE id = invitation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found or not pending'
    );
  END IF;
  
  -- Verify manager can resend this invitation
  IF manager_company_id != invitation_record.company_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Manager can only resend invitations from their company'
    );
  END IF;
  
  -- Generate new token and extend expiry
  new_token := gen_random_uuid();
  
  UPDATE public.user_invitations
  SET 
    invitation_token = new_token,
    expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Get company and manager details for the invitation email
  DECLARE
    company_name TEXT;
    manager_name TEXT;
    manager_email TEXT;
  BEGIN
    SELECT c.name, u.name, u.email INTO company_name, manager_name, manager_email
    FROM public.companies c
    JOIN public.users u ON u.id = manager_id
    WHERE c.id = manager_company_id;
    
    RETURN json_build_object(
      'success', true,
      'invitation_id', invitation_id,
      'invitation_token', new_token,
      'email', invitation_record.email,
      'name', invitation_record.name,
      'company_name', company_name,
      'manager_name', manager_name,
      'manager_email', manager_email,
      'expires_at', (NOW() + INTERVAL '7 days')::TEXT,
      'invitation_url', 'https://yourdomain.com/accept-invitation/' || new_token
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company users for enterprise manager
CREATE OR REPLACE FUNCTION public.get_company_users(manager_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role user_role,
  status user_status,
  daily_usage INTEGER,
  monthly_usage INTEGER,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  manager_id UUID;
  manager_company_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RAISE EXCEPTION 'Only enterprise managers can view company users';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.daily_usage,
    u.monthly_usage,
    u.daily_limit,
    u.monthly_limit,
    ud.last_active,
    u.created_at
  FROM public.users u
  LEFT JOIN (
    SELECT 
      user_id,
      MAX(last_active) as last_active
    FROM public.user_devices
    GROUP BY user_id
  ) ud ON u.id = ud.user_id
  WHERE u.company_id = manager_company_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired invitations (can be run as a scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    UPDATE public.user_invitations
    SET status = 'expired'
    WHERE status = 'pending' 
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.invite_enterprise_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_invite_enterprise_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.resend_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations TO authenticated;

-- Create RLS policies for user_invitations table
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Enterprise managers can view/manage invitations from their company
CREATE POLICY "Enterprise managers can manage company invitations" ON public.user_invitations
  FOR ALL USING (
    company_id = (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid() AND role = 'enterprise_manager'
    )
  );

-- Users can view invitations sent to their email (for accepting)
CREATE POLICY "Users can view invitations sent to them" ON public.user_invitations
  FOR SELECT USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Superusers can see all invitations
CREATE POLICY "Superusers can view all invitations" ON public.user_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );