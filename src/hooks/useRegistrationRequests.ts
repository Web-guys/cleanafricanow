import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type RegistrationStatus = Database["public"]["Enums"]["registration_status"];
export type RequestedRole = "municipality" | "ngo" | "partner";
export type AppRole = Database["public"]["Enums"]["app_role"];
export type OrganizationType = Database["public"]["Enums"]["organization_type"];

export interface RegistrationRequest {
  id: string;
  user_id: string | null;
  requested_role: AppRole;
  organization_name: string;
  organization_type?: OrganizationType | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  city_id?: string | null;
  region?: string | null;
  address?: string | null;
  website?: string | null;
  description?: string | null;
  official_document_url?: string | null;
  id_document_url?: string | null;
  license_document_url?: string | null;
  status: RegistrationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  city?: { name: string; country: string } | null;
  user_profile?: { full_name: string; email: string } | null;
}

export interface CreateRegistrationRequest {
  requested_role: RequestedRole;
  organization_name: string;
  organization_type?: OrganizationType;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  city_id?: string;
  region?: string;
  address?: string;
  website?: string;
  description?: string;
  official_document_url?: string;
  id_document_url?: string;
  license_document_url?: string;
}

export const useRegistrationRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all registration requests (admin only)
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["registration-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_requests")
        .select(`
          *,
          city:cities(name, country)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RegistrationRequest[];
    },
  });

  // Fetch user's own request
  const { data: userRequest, isLoading: isLoadingUserRequest } = useQuery({
    queryKey: ["my-registration-request", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("registration_requests")
        .select(`
          *,
          city:cities(name, country)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as RegistrationRequest | null;
    },
    enabled: !!user?.id,
  });

  // Create new registration request
  const createRequestMutation = useMutation({
    mutationFn: async (request: CreateRegistrationRequest) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("registration_requests")
        .insert({
          user_id: user.id,
          requested_role: request.requested_role,
          organization_name: request.organization_name,
          organization_type: request.organization_type,
          contact_name: request.contact_name,
          contact_email: request.contact_email,
          contact_phone: request.contact_phone,
          city_id: request.city_id || null,
          region: request.region,
          address: request.address,
          website: request.website,
          description: request.description,
          official_document_url: request.official_document_url,
          id_document_url: request.id_document_url,
          license_document_url: request.license_document_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-registration-request"] });
      toast({
        title: "Request Submitted",
        description: "Your registration request has been submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve registration request (admin only)
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes?: string }) => {
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from("registration_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from("registration_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Add the role to user via edge function
      const { error: roleError } = await supabase.functions.invoke("role-management", {
        body: {
          action: "add_role",
          user_id: request.user_id,
          role: request.requested_role,
        },
      });

      if (roleError) throw roleError;

      // If organization type is specified, create the organization
      if (request.organization_name) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: request.organization_name,
            type: request.organization_type || "ngo",
            email: request.contact_email,
            phone: request.contact_phone,
            address: request.address,
            website: request.website,
            description: request.description,
            is_active: true,
          })
          .select()
          .single();

        if (!orgError && org && request.user_id) {
          // Add user as admin of the organization
          await supabase.from("organization_members").insert({
            organization_id: org.id,
            user_id: request.user_id,
            role: "admin",
            is_active: true,
          });

          // If city_id is specified, add territory
          if (request.city_id) {
            await supabase.from("organization_territories").insert({
              organization_id: org.id,
              city_id: request.city_id,
              assigned_by: user?.id,
            });
          }
        }

        // Update user's profile with city assignment if specified
        if (request.city_id && request.user_id) {
          await supabase
            .from("profiles")
            .update({ city_id: request.city_id })
            .eq("id", request.user_id);
        }
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      toast({
        title: "Request Approved",
        description: "The registration request has been approved and the user has been granted the requested role.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject registration request (admin only)
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, rejectionReason }: { requestId: string; rejectionReason: string }) => {
      const { error } = await supabase
        .from("registration_requests")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      toast({
        title: "Request Rejected",
        description: "The registration request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set request under review (admin only)
  const setUnderReviewMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes?: string }) => {
      const { error } = await supabase
        .from("registration_requests")
        .update({
          status: "under_review",
          admin_notes: adminNotes,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      toast({
        title: "Status Updated",
        description: "The request is now under review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    requests,
    userRequest,
    isLoading,
    isLoadingUserRequest,
    error,
    createRequest: createRequestMutation.mutate,
    isCreating: createRequestMutation.isPending,
    approveRequest: approveRequestMutation.mutate,
    isApproving: approveRequestMutation.isPending,
    rejectRequest: rejectRequestMutation.mutate,
    isRejecting: rejectRequestMutation.isPending,
    setUnderReview: setUnderReviewMutation.mutate,
    isSettingUnderReview: setUnderReviewMutation.isPending,
  };
};
