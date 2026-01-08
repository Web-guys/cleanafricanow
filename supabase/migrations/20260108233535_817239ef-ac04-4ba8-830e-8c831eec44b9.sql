-- Drop existing restrictive UPDATE policies on reports
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;
DROP POLICY IF EXISTS "Municipality can update reports in their city" ON public.reports;
DROP POLICY IF EXISTS "NGOs can update reports in assigned regions" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;

-- Create permissive UPDATE policies (only one needs to match)
CREATE POLICY "Admins can update all reports" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Municipality can update reports in their city" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'municipality'::app_role) 
  AND city_id IN (SELECT profiles.city_id FROM profiles WHERE profiles.id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'municipality'::app_role) 
  AND city_id IN (SELECT profiles.city_id FROM profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "NGOs can update reports in assigned regions" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'ngo'::app_role) 
  AND city_id IN (SELECT ngo_regions.city_id FROM ngo_regions WHERE ngo_regions.ngo_user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'ngo'::app_role) 
  AND city_id IN (SELECT ngo_regions.city_id FROM ngo_regions WHERE ngo_regions.ngo_user_id = auth.uid())
);

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);