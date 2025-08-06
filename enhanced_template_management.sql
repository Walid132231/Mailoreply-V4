-- Enhanced Template Management & Approval System
-- Comprehensive functions for enterprise template approval and security

-- Function to approve a company template (Enterprise Managers only)
CREATE OR REPLACE FUNCTION public.approve_template(
  template_id UUID,
  manager_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  manager_id UUID;
  template_company_id UUID;
  manager_company_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RAISE EXCEPTION 'Only enterprise managers can approve templates';
  END IF;
  
  -- Get template company
  SELECT company_id INTO template_company_id
  FROM public.templates
  WHERE id = template_id AND visibility = 'pending_approval';
  
  IF template_company_id IS NULL THEN
    RAISE EXCEPTION 'Template not found or not pending approval';
  END IF;
  
  -- Verify manager is from same company
  IF manager_company_id != template_company_id THEN
    RAISE EXCEPTION 'Manager can only approve templates from their company';
  END IF;
  
  -- Approve the template
  UPDATE public.templates 
  SET 
    visibility = 'company',
    approved_by = manager_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = template_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a company template
CREATE OR REPLACE FUNCTION public.reject_template(
  template_id UUID,
  rejection_reason TEXT DEFAULT NULL,
  manager_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  manager_id UUID;
  template_company_id UUID;
  manager_company_id UUID;
BEGIN
  -- Get the manager user ID (default to current authenticated user)
  manager_id := COALESCE(manager_user_id, auth.uid());
  
  -- Verify the user is an enterprise manager
  SELECT company_id INTO manager_company_id
  FROM public.users 
  WHERE id = manager_id AND role = 'enterprise_manager';
  
  IF manager_company_id IS NULL THEN
    RAISE EXCEPTION 'Only enterprise managers can reject templates';
  END IF;
  
  -- Get template company
  SELECT company_id INTO template_company_id
  FROM public.templates
  WHERE id = template_id AND visibility = 'pending_approval';
  
  IF template_company_id IS NULL THEN
    RAISE EXCEPTION 'Template not found or not pending approval';
  END IF;
  
  -- Verify manager is from same company
  IF manager_company_id != template_company_id THEN
    RAISE EXCEPTION 'Manager can only reject templates from their company';
  END IF;
  
  -- Reject the template (change back to private with rejection note)
  UPDATE public.templates 
  SET 
    visibility = 'private',
    approved_by = NULL,
    approved_at = NULL,
    updated_at = NOW(),
    tags = COALESCE(tags, '{}') || ARRAY['rejected: ' || COALESCE(rejection_reason, 'No reason provided')]
  WHERE id = template_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending templates for approval (Enterprise Managers only)
CREATE OR REPLACE FUNCTION public.get_pending_templates_for_approval(manager_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  subject TEXT,
  hotkey TEXT,
  tags TEXT[],
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT
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
    RAISE EXCEPTION 'Only enterprise managers can view pending templates';
  END IF;
  
  -- Return pending templates from the manager's company
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.subject,
    t.hotkey,
    t.tags,
    u.name as created_by,
    t.created_at,
    u.email as user_email
  FROM public.templates t
  JOIN public.users u ON t.user_id = u.id
  WHERE t.company_id = manager_company_id 
    AND t.visibility = 'pending_approval'
  ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's private templates (ensures privacy)
CREATE OR REPLACE FUNCTION public.get_user_private_templates(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  subject TEXT,
  hotkey TEXT,
  tags TEXT[],
  usage_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID (default to current authenticated user)
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Security check: users can only see their own private templates
  IF target_user_id != auth.uid() THEN
    -- Only superusers can view other users' private templates
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser') THEN
      RAISE EXCEPTION 'Access denied: can only view your own private templates';
    END IF;
  END IF;
  
  -- Return user's private templates only
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.subject,
    t.hotkey,
    t.tags,
    t.usage_count,
    t.created_at,
    t.updated_at
  FROM public.templates t
  WHERE t.user_id = target_user_id 
    AND t.visibility = 'private'
  ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit template for company approval
CREATE OR REPLACE FUNCTION public.submit_template_for_approval(
  template_id UUID,
  user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  user_company_id UUID;
  user_role user_role;
BEGIN
  -- Get the user ID (default to current authenticated user)
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Security check: users can only submit their own templates
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only submit your own templates';
  END IF;
  
  -- Get user's company and role
  SELECT company_id, role INTO user_company_id, user_role
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Check if user is in a company and is enterprise user
  IF user_company_id IS NULL OR user_role != 'enterprise_user' THEN
    RAISE EXCEPTION 'Only enterprise users can submit templates for company approval';
  END IF;
  
  -- Verify template ownership and current visibility
  IF NOT EXISTS (
    SELECT 1 FROM public.templates 
    WHERE id = template_id 
      AND user_id = target_user_id 
      AND visibility = 'private'
  ) THEN
    RAISE EXCEPTION 'Template not found or not eligible for submission';
  END IF;
  
  -- Submit for approval
  UPDATE public.templates 
  SET 
    visibility = 'pending_approval',
    company_id = user_company_id,
    updated_at = NOW()
  WHERE id = template_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get templates for extension use (with hotkeys)
CREATE OR REPLACE FUNCTION public.get_templates_for_extension(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  subject TEXT,
  hotkey TEXT,
  visibility TEXT,
  source TEXT
) AS $$
DECLARE
  target_user_id UUID;
  user_company_id UUID;
BEGIN
  -- Get the user ID (default to current authenticated user)
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Get user's company
  SELECT company_id INTO user_company_id
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Return user's private templates + approved company templates
  RETURN QUERY
  -- User's private templates
  SELECT 
    t.id,
    t.title,
    t.content,
    t.subject,
    t.hotkey,
    t.visibility,
    'private' as source
  FROM public.templates t
  WHERE t.user_id = target_user_id 
    AND t.visibility = 'private'
    AND t.hotkey IS NOT NULL 
    AND t.hotkey != ''
  
  UNION ALL
  
  -- Approved company templates (if user is in a company)
  SELECT 
    t.id,
    t.title,
    t.content,
    t.subject,
    t.hotkey,
    t.visibility,
    'company' as source
  FROM public.templates t
  WHERE user_company_id IS NOT NULL
    AND t.company_id = user_company_id
    AND t.visibility = 'company'
    AND t.approved_at IS NOT NULL
    AND t.hotkey IS NOT NULL 
    AND t.hotkey != ''
  
  ORDER BY hotkey ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(
  template_id UUID,
  user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  user_company_id UUID;
  template_company_id UUID;
  template_visibility TEXT;
  template_owner UUID;
BEGIN
  -- Get the user ID (default to current authenticated user)
  target_user_id := COALESCE(user_uuid, auth.uid());
  
  -- Get template details
  SELECT user_id, company_id, visibility INTO template_owner, template_company_id, template_visibility
  FROM public.templates 
  WHERE id = template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Get user's company
  SELECT company_id INTO user_company_id
  FROM public.users 
  WHERE id = target_user_id;
  
  -- Check access permissions
  IF template_visibility = 'private' AND template_owner != target_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot use private templates of other users';
  END IF;
  
  IF template_visibility = 'company' AND user_company_id != template_company_id THEN
    RAISE EXCEPTION 'Access denied: cannot use company templates from other companies';
  END IF;
  
  -- Increment usage count
  UPDATE public.templates 
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = template_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for templates
DROP POLICY IF EXISTS "Users can manage own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view company templates" ON public.templates;

-- Users can manage their own private templates
CREATE POLICY "Users can manage own private templates" ON public.templates
  FOR ALL USING (auth.uid() = user_id AND visibility = 'private');

-- Users can view their own templates regardless of visibility
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view approved company templates from their company
CREATE POLICY "Users can view approved company templates" ON public.templates
  FOR SELECT USING (
    company_id IS NOT NULL AND 
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    visibility = 'company' AND
    approved_at IS NOT NULL
  );

-- Enterprise managers can view and manage pending templates from their company
CREATE POLICY "Enterprise managers can manage pending templates" ON public.templates
  FOR ALL USING (
    company_id = (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid() AND role = 'enterprise_manager'
    ) AND 
    visibility = 'pending_approval'
  );

-- Superusers can view all templates
CREATE POLICY "Superusers can view all templates" ON public.templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_template TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_template TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_templates_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_private_templates TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_template_for_approval TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_templates_for_extension TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage TO authenticated;