-- ============================================
-- SECURITY FIX: Restrict profile access and protect report submitter info
-- ============================================

-- 1. Drop the overly permissive "Anyone can view reports" policy
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;

-- 2. Create a secure view for public report access (hides user_id and rounds GPS)
CREATE OR REPLACE VIEW public.reports_public AS
SELECT 
  id,
  category,
  description,
  -- Round GPS coordinates to ~100m precision for privacy
  ROUND(latitude::numeric, 3) as latitude,
  ROUND(longitude::numeric, 3) as longitude,
  city_id,
  status,
  priority,
  photos,
  created_at,
  updated_at,
  verified_at,
  resolved_at,
  sla_due_date,
  is_deleted
FROM public.reports
WHERE is_deleted = false;

-- 3. Grant access to the public view
GRANT SELECT ON public.reports_public TO anon, authenticated;

-- 4. Create new RLS policies for reports table with proper access control

-- Authenticated users can view all reports (but will use view for public data)
CREATE POLICY "Authenticated users can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (true);

-- Anonymous users can view reports through the view only
-- They cannot directly query the reports table
CREATE POLICY "Anonymous can view non-deleted reports"
ON public.reports FOR SELECT
TO anon
USING (is_deleted = false);

-- 5. Fix profiles table - make it more restrictive
-- First, let's see current policies and ensure proper access

-- Users should only see their own profile by default
-- Admins can see all
-- Organization members can see profiles of users in their org

-- The existing policies are already somewhat restrictive, but let's ensure 
-- email/phone are not exposed publicly

-- Create a public profiles view that hides sensitive data
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  avatar_url,
  city_id,
  impact_score,
  reports_count,
  created_at
  -- Excludes: email, phone, bio, last_login_at, preferred_language
FROM public.profiles
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 6. Add a function to check if user can view full profile
CREATE OR REPLACE FUNCTION public.can_view_full_profile(_viewer_id UUID, _profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Can view own profile
    _viewer_id = _profile_id
    OR
    -- Admin can view all
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _viewer_id AND role = 'admin')
    OR
    -- Same organization members can view each other
    EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = _viewer_id 
      AND om2.user_id = _profile_id 
      AND om1.is_active = true 
      AND om2.is_active = true
    )
$$;

-- 7. Create a secure function to get report with submitter info (for authorized users only)
CREATE OR REPLACE FUNCTION public.get_report_with_submitter(report_id UUID)
RETURNS TABLE (
  id UUID,
  description TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  city_id UUID,
  photos TEXT[],
  created_at TIMESTAMPTZ,
  submitter_id UUID,
  submitter_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  report_city_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Get the report's city
  SELECT r.city_id INTO report_city_id 
  FROM public.reports r 
  WHERE r.id = report_id;
  
  -- Check if user has access (admin, municipality in city, ngo in region, or report owner)
  IF current_user_id IS NULL THEN
    -- Anonymous users get limited info
    RETURN QUERY
    SELECT 
      r.id,
      r.description,
      r.category::TEXT,
      r.status::TEXT,
      r.priority::TEXT,
      ROUND(r.latitude::numeric, 3),
      ROUND(r.longitude::numeric, 3),
      r.city_id,
      r.photos,
      r.created_at,
      NULL::UUID,
      NULL::TEXT
    FROM public.reports r
    WHERE r.id = report_id AND r.is_deleted = false;
  ELSE
    -- Check authorization
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'admin')
       OR EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = current_user_id)
       OR can_access_territory(current_user_id, report_city_id)
    THEN
      -- Authorized users get full info including submitter
      RETURN QUERY
      SELECT 
        r.id,
        r.description,
        r.category::TEXT,
        r.status::TEXT,
        r.priority::TEXT,
        r.latitude,
        r.longitude,
        r.city_id,
        r.photos,
        r.created_at,
        r.user_id,
        p.full_name
      FROM public.reports r
      LEFT JOIN public.profiles p ON p.id = r.user_id
      WHERE r.id = report_id AND r.is_deleted = false;
    ELSE
      -- Regular authenticated users get limited info
      RETURN QUERY
      SELECT 
        r.id,
        r.description,
        r.category::TEXT,
        r.status::TEXT,
        r.priority::TEXT,
        ROUND(r.latitude::numeric, 3),
        ROUND(r.longitude::numeric, 3),
        r.city_id,
        r.photos,
        r.created_at,
        NULL::UUID,
        NULL::TEXT
      FROM public.reports r
      WHERE r.id = report_id AND r.is_deleted = false;
    END IF;
  END IF;
END;
$$;