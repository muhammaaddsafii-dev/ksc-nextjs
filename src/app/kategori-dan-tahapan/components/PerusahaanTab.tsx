'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { usePerusahaanStore } from '@/stores/perusahaanStore';
import { Perusahaan } from '@/types';
import { toast } from 'sonner';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function PerusahaanTab() {
    const { items: perusahaanList, fetchItems: fetchPerusahaan, addItem: addPerusahaan, updateItem: updatePerusahaan, deleteItem: deletePerusahaan } = usePerusahaanStore();
    const [perusahaanModalOpen, setPerusahaanModalOpen] = useState(false);
    const [perusahaanDeleteDialogOpen, setPerusahaanDeleteDialogOpen] = useState(false);
    const [selectedPerusahaan, setSelectedPerusahaan] = useState<Perusahaan | null>(null);
    const [perusahaanFormData, setPerusahaanFormData] = useState<Omit<Perusahaan, 'id' | 'createdAt' | 'updatedAt'>>({
        nama: '',
        alamat: '',
        email: '',
        telepon: '',
    });
    const [perusahaanViewMode, setPerusahaanViewMode] = useState(false);

    useEffect(() => {
        fetchPerusahaan();
    }, [fetchPerusahaan]);

    const handleCreatePerusahaan = () => {
        setSelectedPerusahaan(null);
        setPerusahaanFormData({ nama: '', alamat: '', email: '', telepon: '' });
        setPerusahaanViewMode(false);
        setPerusahaanModalOpen(true);
    };

    const handleEditPerusahaan = (item: Perusahaan) => {
        setSelectedPerusahaan(item);
        setPerusahaanFormData({
            nama: item.nama,
            alamat: item.alamat || '',
            email: item.email || '',
            telepon: item.telepon || '',
        });
        setPerusahaanViewMode(false);
        setPerusahaanModalOpen(true);
    };

    const handleViewPerusahaan = (item: Perusahaan) => {
        setSelectedPerusahaan(item);
        setPerusahaanFormData({
            nama: item.nama,
            alamat: item.alamat || '',
            email: item.email || '',
            telepon: item.telepon || '',
        });
        setPerusahaanViewMode(true);
        setPerusahaanModalOpen(true);
    };

    const handleDeletePerusahaan = (item: Perusahaan) => {
        setSelectedPerusahaan(item);
        setPerusahaanDeleteDialogOpen(true);
    };

    const confirmDeletePerusahaan = () => {
        if (selectedPerusahaan) {
            deletePerusahaan(selectedPerusahaan.id);
            toast.success('Perusahaan berhasil dihapus');
        }
        setPerusahaanDeleteDialogOpen(false);
        setSelectedPerusahaan(null);
    };

    const handleSubmitPerusahaan = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPerusahaan) {
            updatePerusahaan(selectedPerusahaan.id, perusahaanFormData);
            toast.success('Perusahaan berhasil diperbarui');
        } else {
            addPerusahaan(perusahaanFormData);
            toast.success('Perusahaan berhasil ditambahkan');
        }
        setPerusahaanModalOpen(false);
    };

    const perusahaanColumns = [
        {
            key: 'nama',
            header: 'Nama Perusahaan',
            sortable: true,
            render: (item: Perusahaan) => (
                <div className="font-medium text-center">{item.nama}</div>
            ),
        },
        {
            key: 'alamat',
            header: 'Alamat',
            render: (item: Perusahaan) => (
                <div className="text-sm text-muted-foreground truncate max-w-[200px] text-center mx-auto">{item.alamat || '-'}</div>
            ),
        },
        {
            key: 'kontak',
            header: 'Kontak',
            render: (item: Perusahaan) => (
                <div className="text-sm text-center">
                    {item.telepon && <div>{item.telepon}</div>}
                    {item.email && <div className="text-muted-foreground text-xs">{item.email}</div>}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item: Perusahaan) => (
                <div className="flex items-center gap-1 justify-center min-w-[120px]">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleViewPerusahaan(item); }}>
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditPerusahaan(item); }}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeletePerusahaan(item); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4 sm:hidden"> {/* Mobile Only button? Use consistent style from parent. */}
                {/* Wait, the parent had the button in tabs trigger area. */}
                {/* The requirement is to verify responsive for tab buttons. */}
                {/* I will add the create button inside the tab content for mobile responsiveness or keep it separate? */}
                {/* The original code had the button outside the tabs content, conditional based on active tab. */}
                {/* I should probably keep the create button logic in the parent or pass a prop to render it, OR verify where user wants it. */}
                {/* In the original code, the button is: */}
                {/* <div className="flex flex-col sm:flex-row ..."> <TabsList ...> {activeTab === ... ? <Button ...> : ...} </div> */}
                {/* So the button is NOT inside the tab content. */}
                {/* However, the user asked to make each tab a component. */}
                {/* I can expose the "Create Handler" to the parent via `ref` or just move the button inside the component. */}
                {/* Moving the button inside the component is cleaner for component isolation. */}
            </div>

            <div className="flex justify-end mb-4">
                <Button onClick={handleCreatePerusahaan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Perusahaan
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Daftar Perusahaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={perusahaanList}
                        columns={perusahaanColumns}
                        searchPlaceholder="Cari perusahaan..."
                    />
                </CardContent>
            </Card>

            <Dialog open={perusahaanModalOpen} onOpenChange={setPerusahaanModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {perusahaanViewMode ? 'Detail Perusahaan' : selectedPerusahaan ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitPerusahaan} className="space-y-4">
                        <div>
                            <Label htmlFor="namaPerusahaan">Nama Perusahaan</Label>
                            <Input
                                id="namaPerusahaan"
                                value={perusahaanFormData.nama}
                                onChange={(e) => setPerusahaanFormData({ ...perusahaanFormData, nama: e.target.value })}
                                disabled={perusahaanViewMode}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="alamatPerusahaan">Alamat</Label>
                            <Textarea
                                id="alamatPerusahaan"
                                value={perusahaanFormData.alamat}
                                onChange={(e) => setPerusahaanFormData({ ...perusahaanFormData, alamat: e.target.value })}
                                disabled={perusahaanViewMode}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="emailPerusahaan">Email</Label>
                                <Input
                                    id="emailPerusahaan"
                                    type="email"
                                    value={perusahaanFormData.email}
                                    onChange={(e) => setPerusahaanFormData({ ...perusahaanFormData, email: e.target.value })}
                                    disabled={perusahaanViewMode}
                                />
                            </div>
                            <div>
                                <Label htmlFor="teleponPerusahaan">Telepon</Label>
                                <Input
                                    id="teleponPerusahaan"
                                    value={perusahaanFormData.telepon}
                                    onChange={(e) => setPerusahaanFormData({ ...perusahaanFormData, telepon: e.target.value })}
                                    disabled={perusahaanViewMode}
                                />
                            </div>
                        </div>
                        {!perusahaanViewMode && (
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setPerusahaanModalOpen(false)}>Batal</Button>
                                <Button type="submit">Simpan</Button>
                            </div>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={perusahaanDeleteDialogOpen}
                onOpenChange={setPerusahaanDeleteDialogOpen}
                title="Hapus Perusahaan"
                description="Apakah Anda yakin ingin menghapus data perusahaan ini?"
                onConfirm={confirmDeletePerusahaan}
            />
        </div>
    );
}
