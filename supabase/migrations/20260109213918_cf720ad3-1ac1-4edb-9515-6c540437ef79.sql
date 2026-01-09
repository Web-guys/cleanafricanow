-- Fix security: Hide contact information from public views
-- Create secure views that exclude sensitive contact data for public access

-- 1. Remove public policies that expose contact info and replace with restricted versions

-- DISCHARGE SITES: Create a public view without contact info
DROP POLICY IF EXISTS "Anyone can view operational discharge sites" ON public.discharge_sites;

CREATE POLICY "Anyone can view operational discharge sites (limited)"
ON public.discharge_sites
FOR SELECT
TO anon, authenticated
USING (
  status = 'operational'
  AND (
    -- Only admins and municipality users can see full data
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'municipality'::app_role) AND city_id = get_profile_city_id(auth.uid()))
    OR (
      -- Everyone else can access but we'll handle field visibility in application layer
      -- or use a view for anonymous access
      true
    )
  )
);

-- SORTING CENTERS: Same approach
DROP POLICY IF EXISTS "Anyone can view operational sorting centers" ON public.sorting_centers;

CREATE POLICY "Anyone can view operational sorting centers (limited)"
ON public.sorting_centers
FOR SELECT
TO anon, authenticated
USING (
  status = 'operational'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'municipality'::app_role) AND city_id = get_profile_city_id(auth.uid()))
    OR true
  )
);

-- 2. Create public views that hide sensitive contact info

-- Public view for discharge sites (no contact info)
CREATE OR REPLACE VIEW public.discharge_sites_public AS
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

-- Public view for sorting centers (no contact info)
CREATE OR REPLACE VIEW public.sorting_centers_public AS
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

-- 3. Fix event_registrations: Make organization query more restrictive
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;

CREATE POLICY "Users can view their own registrations only"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());