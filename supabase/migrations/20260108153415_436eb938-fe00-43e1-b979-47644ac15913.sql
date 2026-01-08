
-- ============================================
-- PHASE 1: CORE INFRASTRUCTURE
-- Non-breaking additions to extend the platform
-- ============================================

-- 1. Extend app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- 2. Extend report_category enum with more categories
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'water_pollution';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'sewage';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'chemical_waste';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'medical_waste';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'electronic_waste';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'construction_debris';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'agricultural_waste';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'oil_spill';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'wildlife_harm';
ALTER TYPE public.report_category ADD VALUE IF NOT EXISTS 'other';

-- 3. Extend report_status enum
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'verified';

-- 4. Create organization_type enum
CREATE TYPE public.organization_type AS ENUM ('municipality', 'ngo', 'government', 'private', 'international');

-- 5. Create priority_level enum
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- org-level role: admin, manager, member, volunteer
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATION TERRITORIES TABLE
-- ============================================
CREATE TABLE public.organization_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(organization_id, city_id)
);

ALTER TABLE public.organization_territories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REPORT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE public.report_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID NOT NULL, -- user_id
  assigned_by UUID NOT NULL, -- user_id
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, in_progress, completed, declined
  notes TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REPORT HISTORY TABLE (Audit Trail)
-- ============================================
CREATE TABLE public.report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID,
  action TEXT NOT NULL, -- created, status_changed, assigned, updated, deleted
  old_status TEXT,
  new_status TEXT,
  old_data JSONB,
  new_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- login, logout, report_created, report_updated, etc.
  entity_type TEXT, -- report, user, organization, etc.
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXTEND REPORTS TABLE
-- ============================================
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS sla_due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_priority_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_duplicate_of UUID,
  ADD COLUMN IF NOT EXISTS environmental_impact_score NUMERIC;

-- ============================================
-- EXTEND PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is organization member
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
    AND organization_id = _org_id 
    AND is_active = true
  )
$$;

-- Function to check if user is organization admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
    AND organization_id = _org_id 
    AND role = 'admin'
    AND is_active = true
  )
$$;

-- Function to check if user can access territory
CREATE OR REPLACE FUNCTION public.can_access_territory(_user_id UUID, _city_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin can access all
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
    UNION
    -- Municipality in their city
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _user_id AND p.city_id = _city_id AND ur.role = 'municipality'
    UNION
    -- NGO in assigned regions
    SELECT 1 FROM public.ngo_regions nr
    WHERE nr.ngo_user_id = _user_id AND nr.city_id = _city_id
    UNION
    -- Organization members with territory access
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_territories ot ON ot.organization_id = om.organization_id
    WHERE om.user_id = _user_id AND ot.city_id = _city_id AND om.is_active = true
  )
$$;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id AND is_active = true
$$;

-- ============================================
-- RLS POLICIES - ORGANIZATIONS
-- ============================================
CREATE POLICY "Anyone can view active organizations"
ON public.organizations FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all organizations"
ON public.organizations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update their organization"
ON public.organizations FOR UPDATE
USING (is_org_admin(auth.uid(), id));

-- ============================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================
CREATE POLICY "Members can view their organization members"
ON public.organization_members FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage all org members"
ON public.organization_members FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage their members"
ON public.organization_members FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- ============================================
-- RLS POLICIES - ORGANIZATION TERRITORIES
-- ============================================
CREATE POLICY "Anyone can view org territories"
ON public.organization_territories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage territories"
ON public.organization_territories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - REPORT ASSIGNMENTS
-- ============================================
CREATE POLICY "Users can view their assignments"
ON public.report_assignments FOR SELECT
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Org members can view org assignments"
ON public.report_assignments FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage all assignments"
ON public.report_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Territory managers can create assignments"
ON public.report_assignments FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'municipality') OR 
  has_role(auth.uid(), 'ngo') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Assignees can update their assignments"
ON public.report_assignments FOR UPDATE
USING (assigned_to = auth.uid());

-- ============================================
-- RLS POLICIES - REPORT HISTORY
-- ============================================
CREATE POLICY "Report owners can view history"
ON public.report_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all history"
ON public.report_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Territory managers can view history"
ON public.report_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_id AND can_access_territory(auth.uid(), r.city_id)
  )
);

CREATE POLICY "System can insert history"
ON public.report_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES - USER ACTIVITY LOGS
-- ============================================
CREATE POLICY "Users can view their own logs"
ON public.user_activity_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all logs"
ON public.user_activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
ON public.user_activity_logs FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES - SYSTEM SETTINGS
-- ============================================
CREATE POLICY "Anyone can view public settings"
ON public.system_settings FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for report_assignments
CREATE TRIGGER update_report_assignments_updated_at
BEFORE UPDATE ON public.report_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for system_settings
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REPORT HISTORY TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.log_report_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.report_history (report_id, changed_by, action, new_status, new_data)
    VALUES (NEW.id, NEW.user_id, 'created', NEW.status, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.report_history (report_id, changed_by, action, old_status, new_status)
      VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_report_changes_trigger
AFTER INSERT OR UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.log_report_changes();

-- ============================================
-- SLA DUE DATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.set_sla_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set SLA based on priority (default: 7 days for medium)
  IF NEW.sla_due_date IS NULL THEN
    NEW.sla_due_date := CASE NEW.priority
      WHEN 'critical' THEN NEW.created_at + INTERVAL '24 hours'
      WHEN 'high' THEN NEW.created_at + INTERVAL '3 days'
      WHEN 'medium' THEN NEW.created_at + INTERVAL '7 days'
      WHEN 'low' THEN NEW.created_at + INTERVAL '14 days'
      ELSE NEW.created_at + INTERVAL '7 days'
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_sla_trigger
BEFORE INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.set_sla_due_date();

-- ============================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ============================================
INSERT INTO public.system_settings (key, value, description, category, is_public) VALUES
  ('platform_name', '"CleanAfricaNow"', 'Platform display name', 'branding', true),
  ('default_language', '"en"', 'Default platform language', 'localization', true),
  ('supported_languages', '["en", "fr", "ar", "es"]', 'Supported languages', 'localization', true),
  ('sla_defaults', '{"critical": 24, "high": 72, "medium": 168, "low": 336}', 'SLA hours by priority', 'workflow', false),
  ('ai_enabled', 'false', 'Enable AI features', 'ai', false),
  ('duplicate_detection_radius_meters', '100', 'Radius for duplicate detection', 'ai', false),
  ('max_photos_per_report', '5', 'Maximum photos per report', 'limits', true);
