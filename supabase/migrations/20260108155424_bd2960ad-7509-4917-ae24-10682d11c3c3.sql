-- Fix SECURITY DEFINER views - recreate as SECURITY INVOKER

-- Drop and recreate reports_public view as SECURITY INVOKER
DROP VIEW IF EXISTS public.reports_public;
CREATE VIEW public.reports_public 
WITH (security_invoker = true)
AS
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

-- Grant access to the public view
GRANT SELECT ON public.reports_public TO anon, authenticated;

-- Drop and recreate profiles_public view as SECURITY INVOKER
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
FROM public.profiles
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO anon, authenticated;