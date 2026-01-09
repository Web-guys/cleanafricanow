-- Fix: Remove public access to full discharge_sites and sorting_centers tables
-- Only the public views (without contact info) should be accessible to everyone

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view operational discharge sites (limited)" ON public.discharge_sites;
DROP POLICY IF EXISTS "Anyone can view operational sorting centers (limited)" ON public.sorting_centers;

-- Create proper restrictive policies for the base tables
-- Only admins and municipality users in their city can access full data
CREATE POLICY "Authorized users can view discharge sites"
ON public.discharge_sites
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'municipality'::app_role) AND city_id = get_profile_city_id(auth.uid()))
);

CREATE POLICY "Authorized users can view sorting centers"
ON public.sorting_centers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'municipality'::app_role) AND city_id = get_profile_city_id(auth.uid()))
);

-- The public views (discharge_sites_public and sorting_centers_public) 
-- already exist and exclude contact information
-- Grant access to the public views for anonymous users
GRANT SELECT ON public.discharge_sites_public TO anon;
GRANT SELECT ON public.sorting_centers_public TO anon;
GRANT SELECT ON public.discharge_sites_public TO authenticated;
GRANT SELECT ON public.sorting_centers_public TO authenticated;