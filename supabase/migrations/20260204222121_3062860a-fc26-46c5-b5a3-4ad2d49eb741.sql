-- Create registration request status enum
CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');

-- Create table for institutional registration requests
CREATE TABLE public.registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_role app_role NOT NULL,
    organization_name TEXT NOT NULL,
    organization_type organization_type,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    city_id UUID REFERENCES public.cities(id),
    region TEXT,
    address TEXT,
    website TEXT,
    description TEXT,
    -- Document verification
    official_document_url TEXT,
    id_document_url TEXT,
    license_document_url TEXT,
    -- Status tracking
    status registration_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    admin_notes TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own requests
CREATE POLICY "Users can view their own registration requests"
ON public.registration_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create requests
CREATE POLICY "Authenticated users can create registration requests"
ON public.registration_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all registration requests"
ON public.registration_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update registration requests"
ON public.registration_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete registration requests"
ON public.registration_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_registration_requests_updated_at
    BEFORE UPDATE ON public.registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for registration documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for registration documents
CREATE POLICY "Users can upload their registration documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'registration-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own registration documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'registration-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all registration documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'registration-documents' 
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete registration documents"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'registration-documents' 
    AND has_role(auth.uid(), 'admin')
);