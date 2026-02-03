-- Drop the existing authenticated-only policy for viewing reports
DROP POLICY IF EXISTS "Authenticated users can view all reports" ON public.reports;

-- Create a new policy that allows ANYONE (including anonymous) to view non-deleted reports
CREATE POLICY "Anyone can view reports"
ON public.reports
FOR SELECT
USING (is_deleted = false OR is_deleted IS NULL);