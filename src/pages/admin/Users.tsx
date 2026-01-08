import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, UserCog, Search, Download, MapPin, UserPlus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Users = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedNgoUser, setSelectedNgoUser] = useState<string | null>(null);
  
  // Add user dialog state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('citizen');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          cities(name),
          user_roles(role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: ngoRegions } = useQuery({
    queryKey: ['ngo-regions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ngo_regions')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Filter users by search and role
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user: any) => {
      const matchesSearch = !searchQuery.trim() || 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const userRole = user.user_roles?.[0]?.role || 'citizen';
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'municipality' | 'citizen' | 'tourist' | 'ngo' }) => {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.users.updateSuccess'),
        description: t('admin.users.roleUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.users.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ userId, cityId }: { userId: string; cityId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ city_id: cityId })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.users.updateSuccess'),
        description: t('admin.users.cityUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.users.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get assigned regions for a specific NGO user
  const getAssignedCityIds = (userId: string) => {
    return ngoRegions?.filter(r => r.ngo_user_id === userId).map(r => r.city_id) || [];
  };

  // Toggle region assignment for NGO
  const toggleRegionMutation = useMutation({
    mutationFn: async ({ userId, cityId, isAssigned }: { userId: string; cityId: string; isAssigned: boolean }) => {
      if (isAssigned) {
        // Remove assignment
        const { error } = await supabase
          .from('ngo_regions')
          .delete()
          .eq('ngo_user_id', userId)
          .eq('city_id', cityId);
        if (error) throw error;
      } else {
        // Add assignment
        const { error } = await supabase
          .from('ngo_regions')
          .insert([{ ngo_user_id: userId, city_id: cityId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-regions-all'] });
      toast({
        title: t('admin.users.updateSuccess'),
        description: t('admin.users.regionsUpdated', 'NGO regions updated successfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.users.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create_user',
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserFullName,
          role: newUserRole
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setAddUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('citizen');
      toast({
        title: t('admin.users.addSuccess', 'User Added'),
        description: t('admin.users.addSuccessMessage', 'New user has been created successfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.users.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_user',
          user_id: userId
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('admin.users.deleteSuccess', 'User Deleted'),
        description: t('admin.users.deleteSuccessMessage', 'User has been deleted successfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin.users.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const exportToCSV = () => {
    if (!filteredUsers.length) return;

    const headers = ['Name', 'Email', 'Role', 'City', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map((user: any) => [
        `"${user.full_name?.replace(/"/g, '""') || ''}"`,
        user.email,
        user.user_roles?.[0]?.role || 'citizen',
        user.cities?.name || '',
        new Date(user.created_at || '').toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: t('admin.users.exportSuccess'),
      description: t('admin.users.exportMessage'),
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'municipality':
        return 'bg-primary text-primary-foreground';
      case 'ngo':
        return 'bg-info text-info-foreground';
      case 'citizen':
        return 'bg-secondary text-secondary-foreground';
      case 'tourist':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <UserCog className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <CardTitle>{t('admin.users.allUsers')} ({filteredUsers.length})</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('admin.users.addUser', 'Add User')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('admin.users.addNewUser', 'Add New User')}</DialogTitle>
                        <DialogDescription>
                          {t('admin.users.addUserDesc', 'Create a new user account with the specified details.')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">{t('admin.users.name')}</Label>
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={newUserFullName}
                            onChange={(e) => setNewUserFullName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('admin.users.email')}</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('admin.users.password', 'Password')}</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">{t('admin.users.role')}</Label>
                          <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="citizen">{t('auth.roles.citizen')}</SelectItem>
                              <SelectItem value="municipality">{t('auth.roles.municipality')}</SelectItem>
                              <SelectItem value="ngo">{t('auth.roles.ngo', 'NGO')}</SelectItem>
                              <SelectItem value="admin">{t('auth.roles.admin')}</SelectItem>
                              <SelectItem value="tourist">{t('auth.roles.tourist')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button 
                          onClick={() => addUserMutation.mutate()}
                          disabled={!newUserEmail || !newUserPassword || !newUserFullName || addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? t('common.loading') : t('admin.users.createUser', 'Create User')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={exportToCSV} variant="outline" disabled={!filteredUsers.length}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('admin.users.exportCSV')}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('admin.users.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('admin.users.role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.users.allRoles')}</SelectItem>
                    <SelectItem value="admin">{t('auth.roles.admin')}</SelectItem>
                    <SelectItem value="municipality">{t('auth.roles.municipality')}</SelectItem>
                    <SelectItem value="ngo">{t('auth.roles.ngo', 'NGO')}</SelectItem>
                    <SelectItem value="citizen">{t('auth.roles.citizen')}</SelectItem>
                    <SelectItem value="tourist">{t('auth.roles.tourist')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">{t('common.loading')}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t('admin.users.noResults')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.name')}</TableHead>
                      <TableHead>{t('admin.users.email')}</TableHead>
                      <TableHead>{t('admin.users.role')}</TableHead>
                      <TableHead>{t('admin.users.assignedCity')}</TableHead>
                      <TableHead>{t('admin.users.ngoRegions', 'NGO Regions')}</TableHead>
                      <TableHead>{t('admin.users.joined')}</TableHead>
                      <TableHead className="text-right">{t('admin.users.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.user_roles?.[0]?.role || 'citizen'}
                            onValueChange={(value: 'admin' | 'municipality' | 'citizen' | 'tourist' | 'ngo') =>
                              updateRoleMutation.mutate({ userId: user.id, newRole: value })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{t('auth.roles.admin')}</SelectItem>
                              <SelectItem value="municipality">{t('auth.roles.municipality')}</SelectItem>
                              <SelectItem value="ngo">{t('auth.roles.ngo', 'NGO')}</SelectItem>
                              <SelectItem value="citizen">{t('auth.roles.citizen')}</SelectItem>
                              <SelectItem value="tourist">{t('auth.roles.tourist')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.city_id || 'none'}
                            onValueChange={(value) =>
                              updateCityMutation.mutate({
                                userId: user.id,
                                cityId: value === 'none' ? null : value
                              })
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder={t('admin.users.noCity')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('admin.users.noCity')}</SelectItem>
                              {cities?.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.user_roles?.[0]?.role === 'ngo' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedNgoUser(user.id)}>
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {t('admin.users.manageRegions', 'Manage')} ({getAssignedCityIds(user.id).length})
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('admin.users.assignRegions', 'Assign Regions to NGO')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                  {cities?.map((city) => {
                                    const isAssigned = getAssignedCityIds(user.id).includes(city.id);
                                    return (
                                      <div key={city.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`city-${city.id}`}
                                          checked={isAssigned}
                                          onCheckedChange={() => 
                                            toggleRegionMutation.mutate({ 
                                              userId: user.id, 
                                              cityId: city.id, 
                                              isAssigned 
                                            })
                                          }
                                        />
                                        <label htmlFor={`city-${city.id}`} className="text-sm cursor-pointer">
                                          {city.name}, {city.country}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.users.deleteUser', 'Delete User')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('admin.users.deleteConfirm', 'Are you sure you want to delete this user? This action cannot be undone.')}
                                  <br />
                                  <strong className="text-foreground">{user.full_name}</strong> ({user.email})
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUserMutation.isPending ? t('common.loading') : t('admin.users.delete', 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Users;
