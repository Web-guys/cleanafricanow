-- Drop existing restrictive policies for cities UPDATE
DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;

-- Create new policies allowing admin, municipality, and NGO to manage cities
CREATE POLICY "Authorized roles can insert cities"
ON public.cities FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'municipality'::app_role)
  OR has_role(auth.uid(), 'ngo'::app_role)
);

CREATE POLICY "Authorized roles can update cities"
ON public.cities FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'municipality'::app_role)
  OR has_role(auth.uid(), 'ngo'::app_role)
);

CREATE POLICY "Admins can delete cities"
ON public.cities FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));