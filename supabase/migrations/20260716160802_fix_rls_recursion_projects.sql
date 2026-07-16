-- Fix infinite recursion in RLS policies
-- The circular reference: projects -> user_project_invitations -> projects
-- Solution: use SECURITY DEFINER functions to break the cycle

-- ============================================================
-- Helper: check if user can access a project (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_can_access_project(pid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = pid)
    OR EXISTS (
      SELECT 1 FROM public.projects WHERE id = pid AND visibility = 'public'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_project_invitations
      WHERE project_id = pid
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );
END;
$$;

-- ============================================================
-- Helper: check if user can see an invitation (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_can_see_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_project_id UUID;
  inv_user_id UUID;
  inv_invited_by UUID;
BEGIN
  SELECT project_id, user_id, invited_by INTO inv_project_id, inv_user_id, inv_invited_by
  FROM public.user_project_invitations
  WHERE id = invitation_id;

  RETURN (
    auth.uid() = inv_user_id
    OR auth.uid() = inv_invited_by
    OR auth.uid() = (SELECT user_id FROM public.projects WHERE id = inv_project_id)
  );
END;
$$;

-- ============================================================
-- Fix projects SELECT policy (remove circular reference)
-- ============================================================
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (public.user_can_access_project(id));

-- ============================================================
-- Fix user_project_invitations SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "Read invitations user is part of" ON public.user_project_invitations;
CREATE POLICY "Read invitations user is part of"
  ON public.user_project_invitations FOR SELECT
  USING (public.user_can_see_invitation(id));

-- ============================================================
-- Fix user_project_invitations INSERT policy (already OK, just ensure)
-- ============================================================
DROP POLICY IF EXISTS "Project owners can invite" ON public.user_project_invitations;
CREATE POLICY "Project owners can invite"
  ON public.user_project_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
    OR auth.uid() = user_id
  );

-- ============================================================
-- Fix projects UPDATE policy
-- ============================================================
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (public.user_can_edit_project(id))
  WITH CHECK (public.user_can_edit_project(id));
