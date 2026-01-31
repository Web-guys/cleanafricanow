import { useState } from "react";
import { Users, UserPlus, Trash2, Search, Crown, Shield, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationMembers, useAddOrganizationMember } from "@/hooks/useAdminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationMembersDialogProps {
  organization: { id: string; name: string; type: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMBER_ROLES = [
  { value: "admin", label: "Admin", icon: Crown, color: "text-amber-500" },
  { value: "manager", label: "Manager", icon: Shield, color: "text-blue-500" },
  { value: "member", label: "Member", icon: User, color: "text-muted-foreground" },
];

export const OrganizationMembersDialog = ({ organization, open, onOpenChange }: OrganizationMembersDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(organization?.id || "");
  const addMemberMutation = useAddOrganizationMember();

  // Search available users (not yet members)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Success", description: "Member removed successfully" });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("organization_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members", organization?.id] });
      toast({ title: "Success", description: "Role updated successfully" });
    },
  });

  const handleAddMember = async () => {
    if (!selectedUserId || !organization) return;
    try {
      await addMemberMutation.mutateAsync({
        organizationId: organization.id,
        userId: selectedUserId,
        role: selectedRole,
      });
      toast({ title: "Success", description: "Member added successfully" });
      setSearchQuery("");
      setSelectedUserId("");
      setSelectedRole("member");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getRoleIcon = (role: string) => {
    const roleData = MEMBER_ROLES.find((r) => r.value === role);
    if (!roleData) return <User className="h-4 w-4" />;
    const Icon = roleData.icon;
    return <Icon className={`h-4 w-4 ${roleData.color}`} />;
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {organization.name} - Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Add Member Section */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New Member
            </h4>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedUserId("");
                  }}
                  className="pl-9"
                />
                {searchResults && searchResults.length > 0 && !selectedUserId && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user: any) => (
                      <button
                        key={user.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-3"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSearchQuery(user.full_name || user.email);
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {(user.full_name || user.email || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <span className="flex items-center gap-2">
                        <role.icon className={`h-3 w-3 ${role.color}`} />
                        {role.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddMember} 
                disabled={!selectedUserId || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-medium mb-3">
              Current Members ({membersData?.members?.length || 0})
            </h4>
            {membersLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : membersData?.members?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersData?.members?.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback>
                              {(member.profile?.full_name || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.profile?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role || "member"}
                          onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(member.role)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {MEMBER_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <span className="flex items-center gap-2">
                                  <role.icon className={`h-3 w-3 ${role.color}`} />
                                  {role.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
