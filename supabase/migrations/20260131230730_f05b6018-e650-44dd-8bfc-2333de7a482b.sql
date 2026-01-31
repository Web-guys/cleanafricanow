-- Fix 1: Drop and recreate public views with SECURITY INVOKER to enforce RLS of querying user

-- Recreate reports_public with SECURITY INVOKER
DROP VIEW IF EXISTS public.reports_public;
CREATE VIEW public.reports_public WITH (security_invoker = on) AS
SELECT 
  id,
  description,
  category,
  status,
  priority,
  ROUND(latitude::numeric, 3) as latitude,
  ROUND(longitude::numeric, 3) as longitude,
  city_id,
  photos,
  created_at,
  updated_at,
  sla_due_date,
  verified_at,
  resolved_at,
  is_deleted
FROM public.reports
WHERE is_deleted = false;

-- Recreate profiles_public with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
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

-- Recreate sorting_centers_public with SECURITY INVOKER
DROP VIEW IF EXISTS public.sorting_centers_public;
CREATE VIEW public.sorting_centers_public WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  center_type,
  address,
  city_id,
  latitude,
  longitude,
  status,
  materials_processed,
  operating_days,
  opening_time,
  closing_time,
  daily_capacity_tons,
  current_load_tons,
  created_at
FROM public.sorting_centers;

-- Recreate discharge_sites_public with SECURITY INVOKER  
DROP VIEW IF EXISTS public.discharge_sites_public;
CREATE VIEW public.discharge_sites_public WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  site_type,
  address,
  city_id,
  latitude,
  longitude,
  status,
  waste_types_accepted,
  operating_days,
  opening_time,
  closing_time,
  max_capacity_tons,
  current_capacity_tons,
  capacity_percentage,
  created_at
FROM public.discharge_sites;

-- Fix 2: Create organizations_public view without sensitive contact info
CREATE OR REPLACE VIEW public.organizations_public WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  description,
  type,
  logo_url,
  website,
  is_active,
  created_at
FROM public.organizations
WHERE is_active = true;

-- Grant SELECT on the new view
GRANT SELECT ON public.organizations_public TO anon, authenticated;