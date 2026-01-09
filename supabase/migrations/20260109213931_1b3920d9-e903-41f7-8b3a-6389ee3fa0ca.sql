-- Fix SECURITY DEFINER views by recreating them with SECURITY INVOKER

-- Drop and recreate discharge_sites_public view with security_invoker
DROP VIEW IF EXISTS public.discharge_sites_public;
CREATE VIEW public.discharge_sites_public
WITH (security_invoker = true)
AS
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
FROM public.discharge_sites
WHERE status = 'operational';

-- Drop and recreate sorting_centers_public view with security_invoker
DROP VIEW IF EXISTS public.sorting_centers_public;
CREATE VIEW public.sorting_centers_public
WITH (security_invoker = true)
AS
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
FROM public.sorting_centers
WHERE status = 'operational';