import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Organizations API
export const useOrganizations = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["organizations", page, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "list", page, limit },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "get", organization_id: id },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orgData: { name: string; type: string; description?: string; email?: string; phone?: string }) => {
      const { data, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "create", data: orgData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "update", organization_id: id, data },
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", variables.id] });
    },
  });
};

export const useOrganizationMembers = (organizationId: string) => {
  return useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "list_members", organization_id: organizationId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
};

export const useAddOrganizationMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, userId, role }: { organizationId: string; userId: string; role?: string }) => {
      const { data, error } = await supabase.functions.invoke("organization-management", {
        body: { action: "add_member", organization_id: organizationId, user_id: userId, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", variables.organizationId] });
    },
  });
};

// SLA API
export const useSLADashboard = () => {
  return useQuery({
    queryKey: ["sla-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sla-tracking", {
        body: { action: "dashboard" },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useSLAOverdue = (page = 1, cityId?: string) => {
  return useQuery({
    queryKey: ["sla-overdue", page, cityId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sla-tracking", {
        body: { action: "overdue", page, city_id: cityId },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useSLADueSoon = (page = 1) => {
  return useQuery({
    queryKey: ["sla-due-soon", page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sla-tracking", {
        body: { action: "due_soon", page },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useSLAStats = () => {
  return useQuery({
    queryKey: ["sla-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sla-tracking", {
        body: { action: "stats" },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useSLAByTerritory = () => {
  return useQuery({
    queryKey: ["sla-by-territory"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sla-tracking", {
        body: { action: "by_territory" },
      });
      if (error) throw error;
      return data;
    },
  });
};

// Audit Logs API
export const useAuditLogs = (page = 1, filters?: { user_id?: string; action_type?: string; start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ["audit-logs", page, filters],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("audit-logs", {
        body: { action: "query", page, limit: 50, filters },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: async (filters?: { start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.functions.invoke("audit-logs", {
        body: { action: "export", format: "csv", filters },
      });
      if (error) throw error;
      return data;
    },
  });
};

// Analytics Export
export const useExportData = () => {
  return useMutation({
    mutationFn: async ({ type, format, filters }: { type: "reports" | "users" | "organizations" | "summary"; format: "json" | "csv"; filters?: any }) => {
      const { data, error } = await supabase.functions.invoke("analytics-export", {
        body: { action: type, format, filters },
      });
      if (error) throw error;
      return data;
    },
  });
};

// Role Management
export const useUserRoles = (userId: string) => {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("role-management", {
        body: { action: "list", user_id: userId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("role-management", {
        body: { action: "assign", user_id: userId, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("role-management", {
        body: { action: "revoke", user_id: userId, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    },
  });
};

export const useUsersWithRoles = (page = 1) => {
  return useQuery({
    queryKey: ["users-with-roles", page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("role-management", {
        body: { action: "list_users", page, limit: 50 },
      });
      if (error) throw error;
      return data;
    },
  });
};
