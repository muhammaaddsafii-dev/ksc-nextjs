'use client';

import { useState } from 'react';
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
import { JenisPekerjaan, TahapanTemplate } from '@/types';
import { toast } from 'sonner';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type JenisFormData = Omit<JenisPekerjaan, 'id' | 'createdAt' | 'updatedAt'>;

const initialJenisFormData: JenisFormData = {
    kode: '',
    nama: '',
    deskripsi: '',
    warna: '#3B82F6',
    aktif: true,
};

interface JenisPekerjaanTabProps {
    jenisPekerjaanList: JenisPekerjaan[];
    setJenisPekerjaanList: React.Dispatch<React.SetStateAction<JenisPekerjaan[]>>;
    setTahapanTemplateList: React.Dispatch<React.SetStateAction<TahapanTemplate[]>>;
    getTahapanCountByJenis: (jenisId: string) => number;
}

export function JenisPekerjaanTab({
    jenisPekerjaanList,
    setJenisPekerjaanList,
    setTahapanTemplateList,
    getTahapanCountByJenis,
}: JenisPekerjaanTabProps) {
    const [jenisModalOpen, setJenisModalOpen] = useState(false);
    const [jenisDeleteDialogOpen, setJenisDeleteDialogOpen] = useState(false);
    const [selectedJenis, setSelectedJenis] = useState<JenisPekerjaan | null>(null);
    const [jenisFormData, setJenisFormData] = useState<JenisFormData>(initialJenisFormData);
    const [jenisViewMode, setJenisViewMode] = useState(false);

    const handleCreateJenis = () => {
        setSelectedJenis(null);
        setJenisFormData(initialJenisFormData);
        setJenisViewMode(false);
        setJenisModalOpen(true);
    };

    const handleEditJenis = (item: JenisPekerjaan) => {
        setSelectedJenis(item);
        setJenisFormData({
            kode: item.kode,
            nama: item.nama,
            deskripsi: item.deskripsi || '',
            warna: item.warna,
            aktif: item.aktif,
        });
        setJenisViewMode(false);
        setJenisModalOpen(true);
    };

    const handleViewJenis = (item: JenisPekerjaan) => {
        setSelectedJenis(item);
        setJenisFormData({
            kode: item.kode,
            nama: item.nama,
            deskripsi: item.deskripsi || '',
            warna: item.warna,
            aktif: item.aktif,
        });
        setJenisViewMode(true);
        setJenisModalOpen(true);
    };

    const handleDeleteJenis = (item: JenisPekerjaan) => {
        setSelectedJenis(item);
        setJenisDeleteDialogOpen(true);
    };

    const confirmDeleteJenis = () => {
        if (selectedJenis) {
            setJenisPekerjaanList(prev => prev.filter(j => j.id !== selectedJenis.id));
            setTahapanTemplateList(prev => prev.filter(t => t.jenisPekerjaanId !== selectedJenis.id));
            toast.success('Jenis pekerjaan berhasil dihapus');
        }
        setJenisDeleteDialogOpen(false);
        setSelectedJenis(null);
    };

    const handleSubmitJenis = (e: React.FormEvent) => {
        e.preventDefault();

        if (!jenisFormData.kode || !jenisFormData.nama) {
            toast.error('Kode dan Nama harus diisi!');
            return;
        }

        if (selectedJenis) {
            setJenisPekerjaanList(prev =>
                prev.map(jenis =>
                    jenis.id === selectedJenis.id
                        ? { ...jenis, ...jenisFormData, updatedAt: new Date() }
                        : jenis
                )
            );
            toast.success('Jenis pekerjaan berhasil diperbarui');
        } else {
            const newJenis: JenisPekerjaan = {
                id: Date.now().toString(),
                ...jenisFormData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            setJenisPekerjaanList(prev => [...prev, newJenis]);
            toast.success('Jenis pekerjaan berhasil ditambahkan');
        }

        setJenisModalOpen(false);
    };

    const jenisColumns = [
        {
            key: 'kode',
            header: 'Jenis Pekerjaan',
            sortable: true,
            render: (item: JenisPekerjaan) => (
                <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
                    <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: item.warna }}
                    />
                    <div className="min-w-0">
                        <p className="font-medium text-sm">{item.kode}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.nama}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'deskripsi',
            header: 'Deskripsi',
            render: (item: JenisPekerjaan) => (
                <p className="text-sm text-muted-foreground line-clamp-2 min-w-[200px]">
                    {item.deskripsi || '-'}
                </p>
            ),
        },
        {
            key: 'tahapan',
            header: 'Tahapan',
            render: (item: JenisPekerjaan) => (
                <div className="text-center min-w-[100px]">
                    <p className="text-sm font-medium">{getTahapanCountByJenis(item.id)}</p>
                    <p className="text-xs text-muted-foreground">tahapan</p>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item: JenisPekerjaan) => (
                <div className="flex items-center gap-1 justify-center min-w-[120px]">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewJenis(item);
                        }}
                        title="Lihat Detail"
                    >
                        <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditJenis(item);
                        }}
                        title="Edit"
                    >
                        <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJenis(item);
                        }}
                        title="Hapus"
                    >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreateJenis}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Jenis Pekerjaan
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Daftar Jenis Pekerjaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={jenisPekerjaanList}
                        columns={jenisColumns}
                        searchPlaceholder="Cari jenis pekerjaan..."
                    />
                </CardContent>
            </Card>

            <Dialog open={jenisModalOpen} onOpenChange={setJenisModalOpen}>
                <DialogContent className="max-w-lg w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {jenisViewMode
                                ? 'Detail Jenis Pekerjaan'
                                : selectedJenis
                                    ? 'Edit Jenis Pekerjaan'
                                    : 'Tambah Jenis Pekerjaan Baru'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitJenis} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="kode">Kode</Label>
                                <Input
                                    id="kode"
                                    value={jenisFormData.kode}
                                    onChange={(e) =>
                                        setJenisFormData({ ...jenisFormData, kode: e.target.value.toUpperCase() })
                                    }
                                    disabled={jenisViewMode}
                                    placeholder="AMDAL, PPKH, dll"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="nama">Nama</Label>
                                <Input
                                    id="nama"
                                    value={jenisFormData.nama}
                                    onChange={(e) =>
                                        setJenisFormData({ ...jenisFormData, nama: e.target.value })
                                    }
                                    disabled={jenisViewMode}
                                    placeholder="Nama lengkap jenis pekerjaan"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="deskripsi">Deskripsi</Label>
                                <Textarea
                                    id="deskripsi"
                                    value={jenisFormData.deskripsi}
                                    onChange={(e) =>
                                        setJenisFormData({ ...jenisFormData, deskripsi: e.target.value })
                                    }
                                    disabled={jenisViewMode}
                                    placeholder="Deskripsi singkat (opsional)"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="warna">Warna</Label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        id="warna"
                                        type="color"
                                        value={jenisFormData.warna}
                                        onChange={(e) =>
                                            setJenisFormData({ ...jenisFormData, warna: e.target.value })
                                        }
                                        disabled={jenisViewMode}
                                        className="h-10 w-20 rounded border cursor-pointer"
                                    />
                                    <Input
                                        value={jenisFormData.warna}
                                        onChange={(e) =>
                                            setJenisFormData({ ...jenisFormData, warna: e.target.value })
                                        }
                                        disabled={jenisViewMode}
                                        placeholder="#3B82F6"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            {jenisViewMode ? (
                                <Button type="button" onClick={() => setJenisModalOpen(false)} className="w-full sm:w-auto">
                                    Tutup
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setJenisModalOpen(false)}
                                        className="w-full sm:w-auto"
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" className="w-full sm:w-auto">
                                        {selectedJenis ? 'Simpan Perubahan' : 'Tambah'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={jenisDeleteDialogOpen}
                onOpenChange={setJenisDeleteDialogOpen}
                title="Hapus Jenis Pekerjaan"
                description={`Apakah Anda yakin ingin menghapus "${selectedJenis?.nama}"? Semua template tahapan terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDeleteJenis}
                confirmText="Hapus"
                variant="destructive"
            />
        </div>
    );
}
