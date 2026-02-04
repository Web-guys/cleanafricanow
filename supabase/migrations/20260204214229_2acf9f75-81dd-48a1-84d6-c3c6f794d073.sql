-- Create bin type enum
CREATE TYPE public.bin_type AS ENUM ('plastic', 'organic', 'mixed', 'glass', 'paper', 'metal', 'electronic');

-- Create bin status enum
CREATE TYPE public.bin_status AS ENUM ('empty', 'half_full', 'almost_full', 'full', 'overflowing', 'damaged', 'missing');

-- Create bin capacity enum
CREATE TYPE public.bin_capacity AS ENUM ('small', 'medium', 'large', 'extra_large');

-- Waste bins table - core bin registration
CREATE TABLE public.waste_bins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bin_code TEXT NOT NULL UNIQUE, -- Unique human-readable code like "BIN-CAS-001"
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    bin_type public.bin_type NOT NULL DEFAULT 'mixed',
    capacity public.bin_capacity NOT NULL DEFAULT 'medium',
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address TEXT,
    district TEXT,
    street TEXT,
    current_status public.bin_status NOT NULL DEFAULT 'empty',
    last_collection_at TIMESTAMP WITH TIME ZONE,
    last_status_update_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    installed_at DATE DEFAULT CURRENT_DATE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- Bin status reports - citizen/worker submissions
CREATE TABLE public.bin_status_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES public.waste_bins(id) ON DELETE CASCADE,
    reported_by UUID, -- NULL for anonymous reports
    reported_status public.bin_status NOT NULL,
    photo_url TEXT,
    notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bin alerts - smart notifications
CREATE TABLE public.bin_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES public.waste_bins(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'full', 'overflow', 'repeated_reports', 'damaged'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bin collection logs - for tracking collections
CREATE TABLE public.bin_collection_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES public.waste_bins(id) ON DELETE CASCADE,
    collected_by UUID,
    collection_route_id UUID REFERENCES public.collection_routes(id) ON DELETE SET NULL,
    status_before public.bin_status,
    status_after public.bin_status DEFAULT 'empty',
    notes TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waste_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_status_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_collection_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waste_bins
CREATE POLICY "Anyone can view active bins"
ON public.waste_bins FOR SELECT
USING (is_active = true);

CREATE POLICY "Municipality can manage bins in their city"
ON public.waste_bins FOR ALL
USING (
    has_role(auth.uid(), 'admin') 
    OR (has_role(auth.uid(), 'municipality') AND city_id = get_profile_city_id(auth.uid()))
);

CREATE POLICY "Admins can manage all bins"
ON public.waste_bins FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for bin_status_reports
CREATE POLICY "Anyone can view reports"
ON public.bin_status_reports FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reports"
ON public.bin_status_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reports"
ON public.bin_status_reports FOR UPDATE
USING (reported_by = auth.uid());

CREATE POLICY "Admins and municipality can manage reports"
ON public.bin_status_reports FOR ALL
USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'municipality')
);

-- RLS Policies for bin_alerts
CREATE POLICY "Authorized users can view alerts"
ON public.bin_alerts FOR SELECT
USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'municipality')
);

CREATE POLICY "System and admins can manage alerts"
ON public.bin_alerts FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Municipality can manage alerts in their city"
ON public.bin_alerts FOR ALL
USING (
    has_role(auth.uid(), 'municipality') 
    AND EXISTS (
        SELECT 1 FROM public.waste_bins wb 
        WHERE wb.id = bin_alerts.bin_id 
        AND wb.city_id = get_profile_city_id(auth.uid())
    )
);

-- RLS Policies for bin_collection_logs
CREATE POLICY "Authorized users can view collection logs"
ON public.bin_collection_logs FOR SELECT
USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'municipality')
);

CREATE POLICY "Municipality can manage collection logs"
ON public.bin_collection_logs FOR ALL
USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'municipality')
);

-- Create function to update bin status from reports
CREATE OR REPLACE FUNCTION public.update_bin_status_from_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the bin's current status
    UPDATE public.waste_bins
    SET 
        current_status = NEW.reported_status,
        last_status_update_at = now(),
        updated_at = now()
    WHERE id = NEW.bin_id;
    
    -- Create alert if bin is full, overflowing, or damaged
    IF NEW.reported_status IN ('full', 'overflowing', 'damaged', 'missing') THEN
        INSERT INTO public.bin_alerts (bin_id, alert_type, severity, message)
        VALUES (
            NEW.bin_id,
            CASE 
                WHEN NEW.reported_status = 'overflowing' THEN 'overflow'
                WHEN NEW.reported_status IN ('damaged', 'missing') THEN 'damaged'
                ELSE 'full'
            END,
            CASE 
                WHEN NEW.reported_status = 'overflowing' THEN 'critical'
                WHEN NEW.reported_status IN ('damaged', 'missing') THEN 'high'
                ELSE 'medium'
            END,
            CASE 
                WHEN NEW.reported_status = 'overflowing' THEN 'Bin is overflowing and needs immediate attention'
                WHEN NEW.reported_status = 'damaged' THEN 'Bin has been reported as damaged'
                WHEN NEW.reported_status = 'missing' THEN 'Bin has been reported as missing'
                ELSE 'Bin is full and ready for collection'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic status updates
CREATE TRIGGER trigger_update_bin_status
AFTER INSERT ON public.bin_status_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_bin_status_from_report();

-- Create function to mark bin as collected
CREATE OR REPLACE FUNCTION public.mark_bin_collected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update bin status to empty and record collection time
    UPDATE public.waste_bins
    SET 
        current_status = 'empty',
        last_collection_at = now(),
        last_status_update_at = now(),
        updated_at = now()
    WHERE id = NEW.bin_id;
    
    -- Resolve any active alerts for this bin
    UPDATE public.bin_alerts
    SET 
        is_resolved = true,
        resolved_at = now(),
        resolved_by = NEW.collected_by
    WHERE bin_id = NEW.bin_id AND is_resolved = false;
    
    RETURN NEW;
END;
$$;

-- Create trigger for collection updates
CREATE TRIGGER trigger_mark_bin_collected
AFTER INSERT ON public.bin_collection_logs
FOR EACH ROW
EXECUTE FUNCTION public.mark_bin_collected();

-- Create public view for bins (hides sensitive data)
CREATE VIEW public.waste_bins_public
WITH (security_invoker = on) AS
SELECT 
    id,
    bin_code,
    city_id,
    bin_type,
    capacity,
    latitude,
    longitude,
    district,
    street,
    current_status,
    last_collection_at,
    last_status_update_at,
    is_active
FROM public.waste_bins
WHERE is_active = true;

-- Indexes for performance
CREATE INDEX idx_waste_bins_city ON public.waste_bins(city_id);
CREATE INDEX idx_waste_bins_status ON public.waste_bins(current_status);
CREATE INDEX idx_waste_bins_location ON public.waste_bins(latitude, longitude);
CREATE INDEX idx_bin_status_reports_bin ON public.bin_status_reports(bin_id);
CREATE INDEX idx_bin_status_reports_created ON public.bin_status_reports(created_at DESC);
CREATE INDEX idx_bin_alerts_bin ON public.bin_alerts(bin_id);
CREATE INDEX idx_bin_alerts_unresolved ON public.bin_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_bin_collection_logs_bin ON public.bin_collection_logs(bin_id);