-- Remove anonymous access to the reports table to prevent user_id exposure
-- Anonymous users should use the reports_public view which excludes sensitive fields
-- The view is already security definer and doesn't expose user_id
DROP POLICY IF EXISTS "Anonymous can view non-deleted reports" ON public.reports;