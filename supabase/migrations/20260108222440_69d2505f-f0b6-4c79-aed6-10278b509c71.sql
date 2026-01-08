-- Create collection events table
CREATE TABLE public.collection_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  location_name TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  event_type TEXT NOT NULL DEFAULT 'cleanup' CHECK (event_type IN ('cleanup', 'collection', 'awareness', 'recycling')),
  required_equipment TEXT[],
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collection routes table
CREATE TABLE public.collection_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  route_type TEXT NOT NULL DEFAULT 'waste' CHECK (route_type IN ('waste', 'recycling', 'hazardous', 'organic')),
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  schedule_days TEXT[] DEFAULT '{}',
  schedule_time TIME,
  estimated_duration_minutes INTEGER,
  assigned_team TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create volunteer/company registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.collection_events(id) ON DELETE CASCADE NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('volunteer', 'company')),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  participant_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  team_size INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'attended', 'no_show')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Collection events policies
CREATE POLICY "Anyone can view scheduled events" ON public.collection_events
  FOR SELECT USING (status IN ('scheduled', 'in_progress'));

CREATE POLICY "Municipality can manage events in their city" ON public.collection_events
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    (has_role(auth.uid(), 'municipality'::app_role) AND 
     city_id IN (SELECT city_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Admins can manage all events" ON public.collection_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Collection routes policies
CREATE POLICY "Municipality can view routes in their city" ON public.collection_routes
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'municipality'::app_role) AND 
     city_id IN (SELECT city_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Municipality can manage routes in their city" ON public.collection_routes
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'municipality'::app_role) AND 
     city_id IN (SELECT city_id FROM profiles WHERE id = auth.uid()))
  );

-- Event registrations policies
CREATE POLICY "Anyone can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT USING (user_id = auth.uid() OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Municipality can manage registrations for their events" ON public.event_registrations
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'municipality'::app_role) AND 
     event_id IN (
       SELECT id FROM collection_events WHERE city_id IN (SELECT city_id FROM profiles WHERE id = auth.uid())
     ))
  );

CREATE POLICY "Admins can manage all registrations" ON public.event_registrations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_collection_events_updated_at
  BEFORE UPDATE ON public.collection_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_routes_updated_at
  BEFORE UPDATE ON public.collection_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();