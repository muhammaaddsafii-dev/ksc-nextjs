"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { usersService, type UserAPI, type UserPayload } from '@/services/users.service';
import { ROLE_LABELS, type UserRole } from '@/lib/permissions';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_tender', label: 'Admin Tender' },
  { value: 'admin_non_tender', label: 'Admin Non-Tender' },
  { value: 'admin_inventaris', label: 'Admin Inventaris' },
  { value: 'admin_website', label: 'Admin Website' },
];

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  admin_tender: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  admin_non_tender: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin_inventaris: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  admin_website: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

interface FormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole | '';
  password: string;
}

const initialFormData: FormData = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  role: '',
  password: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAPI | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = selectedUser !== null;

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
    } catch {
      toast.error('Gagal memuat data user.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setSelectedUser(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEdit = (user: UserAPI) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      role: user.role ?? '',
      password: '',
    });
    setModalOpen(true);
  };

  const openDelete = (user: UserAPI) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error('Pilih role terlebih dahulu.');
      return;
    }
    if (!isEditMode && !formData.password) {
      toast.error('Password wajib diisi untuk user baru.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: UserPayload = {
        username: formData.username,
        email: formData.email || undefined,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        role: formData.role as UserRole,
        password: formData.password || undefined,
      };

      if (isEditMode && selectedUser) {
        const updated = await usersService.update(selectedUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast.success('User berhasil diperbarui.');
      } else {
        const created = await usersService.create(payload);
        setUsers((prev) => [...prev, created]);
        toast.success('User berhasil ditambahkan.');
      }
      setModalOpen(false);
    } catch {
      toast.error(isEditMode ? 'Gagal memperbarui user.' : 'Gagal menambahkan user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    usersService
      .delete(selectedUser.id)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        toast.success(`User '${selectedUser.username}' berhasil dihapus.`);
        setDeleteDialogOpen(false);
      })
      .catch(() => {
        toast.error('Gagal menghapus user.');
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <MainLayout title="Users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold">Manajemen User</h2>
              <p className="text-sm text-muted-foreground">Kelola akun dan role pengguna sistem</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
        </div>

        <Card>
          {/* <CardHeader>
            <CardTitle>Daftar User ({users.length})</CardTitle>
          </CardHeader> */}
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Belum ada user terdaftar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                required
                disabled={isEditMode}
                placeholder="Masukkan username"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nama Depan</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="Nama depan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nama Belakang</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Nama belakang"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData((p) => ({ ...p, role: val as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!isEditMode && '*'}
                {isEditMode && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (kosongkan jika tidak diubah)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                minLength={!isEditMode ? 6 : undefined}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? 'Simpan Perubahan' : 'Tambah User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus User"
        description={`Yakin ingin menghapus user "${selectedUser?.username}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus'}
        variant="destructive"
      />
    </MainLayout>
  );
}
