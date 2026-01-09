-- Fix: Remove RLS policy that exposes sensitive profile data (email, phone) to territory managers
-- Territory managers should use the get_user_profile() function instead, which properly limits data

DROP POLICY IF EXISTS "Territory managers can view profiles for reports" ON public.profiles;

-- The get_user_profile() function already exists and properly controls data access:
-- - Own profile: full access
-- - Admin: full access  
-- - Others: limited data (no email/phone)
-- So territory managers will use that function via the API/edge functions instead