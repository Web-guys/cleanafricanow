-- =========================================
-- SECURITY FIX 1: Fix reports_public view to use SECURITY INVOKER
-- =========================================
DROP VIEW IF EXISTS public.reports_public;

CREATE VIEW public.reports_public
WITH (security_invoker = true)
AS SELECT 
  id,
  category,
  description,
  ROUND(latitude::numeric, 2) as latitude,
  ROUND(longitude::numeric, 2) as longitude,
  city_id,
  status,
  priority,
  photos,
  created_at,
  updated_at,
  sla_due_date,
  verified_at,
  resolved_at,
  is_deleted
FROM reports
WHERE is_deleted = false OR is_deleted IS NULL;

-- Grant select to authenticated and anon users
GRANT SELECT ON public.reports_public TO authenticated, anon;

-- =========================================
-- SECURITY FIX 2: Restrict profiles table access 
-- =========================================

-- Drop existing policies and create stricter ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile only"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Municipality can view profiles in their city for coordination
CREATE POLICY "Municipality can view profiles in their city"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'municipality'::app_role) AND
  city_id = get_profile_city_id(auth.uid())
);

-- =========================================
-- SECURITY FIX 3: Restrict event_registrations contact exposure
-- =========================================

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own registrations only" ON public.event_registrations;

-- Users can view only their own registrations
CREATE POLICY "Users can view their own registrations"
ON public.event_registrations FOR SELECT
USING (user_id = auth.uid());

-- Event organizers (municipality) can view registrations for their events
CREATE POLICY "Event organizers can view event registrations"
ON public.event_registrations FOR SELECT
USING (
  has_role(auth.uid(), 'municipality'::app_role) AND
  event_id IN (
    SELECT id FROM collection_events 
    WHERE city_id = get_profile_city_id(auth.uid())
  )
);