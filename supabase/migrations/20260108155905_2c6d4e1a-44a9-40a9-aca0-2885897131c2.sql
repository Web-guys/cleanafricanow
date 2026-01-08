-- ============================================
-- SECURITY FIX: Restrict profile access to prevent email/phone exposure
-- ============================================

-- First, let's see and clean up all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a secure view for public profile data (no email/phone)
-- Already exists from previous migration, but ensure it's correct
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  city_id,
  impact_score,
  reports_count,
  created_at
  -- Explicitly excludes: email, phone, bio, last_login_at, preferred_language
FROM public.profiles
WHERE is_active = true;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Now create PERMISSIVE policies that properly restrict access

-- Users can ONLY view their own full profile (with email/phone)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Municipality/NGO users can view profiles in their territory (for report management)
-- But they should use the function, not direct access
CREATE POLICY "Territory managers can view profiles for reports"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Only if user is municipality or ngo AND the profile belongs to someone who reported in their territory
  (has_role(auth.uid(), 'municipality') OR has_role(auth.uid(), 'ngo'))
  AND EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.user_id = profiles.id
    AND can_access_territory(auth.uid(), r.city_id)
  )
);

-- Organization members can see basic info of other members (through function, not direct)
-- No direct policy - they should use profiles_public view or specific functions

-- Create a secure function to get user profile with proper authorization
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city_id UUID,
  impact_score INTEGER,
  reports_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id UUID;
BEGIN
  viewer_id := auth.uid();
  
  -- Check if viewer can see full profile
  IF viewer_id = _user_id 
     OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = viewer_id AND role = 'admin')
  THEN
    -- Full profile access
    RETURN QUERY
    SELECT 
      p.id,
      p.full_name,
      p.email,
      p.phone,
      p.avatar_url,
      p.bio,
      p.city_id,
      p.impact_score,
      p.reports_count,
      p.created_at
    FROM public.profiles p
    WHERE p.id = _user_id;
  ELSE
    -- Limited profile (no email/phone)
    RETURN QUERY
    SELECT 
      p.id,
      p.full_name,
      NULL::TEXT as email,
      NULL::TEXT as phone,
      p.avatar_url,
      NULL::TEXT as bio,
      p.city_id,
      p.impact_score,
      p.reports_count,
      p.created_at
    FROM public.profiles p
    WHERE p.id = _user_id AND p.is_active = true;
  END IF;
END;
$$;