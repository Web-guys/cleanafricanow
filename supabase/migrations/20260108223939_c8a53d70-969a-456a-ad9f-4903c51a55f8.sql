-- Team Workers table
CREATE TABLE public.team_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'collector',
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_route_id UUID REFERENCES public.collection_routes(id) ON DELETE SET NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  schedule_start TIME,
  schedule_end TIME,
  working_days TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Companies table
CREATE TABLE public.partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_type TEXT NOT NULL DEFAULT 'waste_collection',
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  contract_start DATE,
  contract_end DATE,
  status TEXT NOT NULL DEFAULT 'active',
  services TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discharge Sites (Décharges) table
CREATE TABLE public.discharge_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  site_type TEXT NOT NULL DEFAULT 'landfill',
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  current_capacity_tons NUMERIC DEFAULT 0,
  max_capacity_tons NUMERIC,
  capacity_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN max_capacity_tons > 0 THEN (current_capacity_tons / max_capacity_tons) * 100 ELSE 0 END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'operational',
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  opening_time TIME,
  closing_time TIME,
  operating_days TEXT[] DEFAULT '{}',
  waste_types_accepted TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sorting Centers (Centres de tri) table
CREATE TABLE public.sorting_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  center_type TEXT NOT NULL DEFAULT 'recycling',
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  daily_capacity_tons NUMERIC,
  current_load_tons NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'operational',
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  opening_time TIME,
  closing_time TIME,
  operating_days TEXT[] DEFAULT '{}',
  materials_processed TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.team_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorting_centers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Team Workers
CREATE POLICY "Admins can manage all team workers" ON public.team_workers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Municipality can manage team workers in their city" ON public.team_workers
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'municipality') AND city_id IN (
      SELECT city_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- RLS Policies for Partner Companies
CREATE POLICY "Admins can manage all partner companies" ON public.partner_companies
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Municipality can manage partner companies in their city" ON public.partner_companies
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'municipality') AND city_id IN (
      SELECT city_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- RLS Policies for Discharge Sites
CREATE POLICY "Admins can manage all discharge sites" ON public.discharge_sites
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Municipality can manage discharge sites in their city" ON public.discharge_sites
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'municipality') AND city_id IN (
      SELECT city_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Anyone can view operational discharge sites" ON public.discharge_sites
  FOR SELECT USING (status = 'operational');

-- RLS Policies for Sorting Centers
CREATE POLICY "Admins can manage all sorting centers" ON public.sorting_centers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Municipality can manage sorting centers in their city" ON public.sorting_centers
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'municipality') AND city_id IN (
      SELECT city_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Anyone can view operational sorting centers" ON public.sorting_centers
  FOR SELECT USING (status = 'operational');

-- Add triggers for updated_at
CREATE TRIGGER update_team_workers_updated_at BEFORE UPDATE ON public.team_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_companies_updated_at BEFORE UPDATE ON public.partner_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discharge_sites_updated_at BEFORE UPDATE ON public.discharge_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sorting_centers_updated_at BEFORE UPDATE ON public.sorting_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();