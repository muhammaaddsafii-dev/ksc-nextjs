'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, ListChecks, X, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { JenisPekerjaan, TahapanTemplate } from '@/types';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type TahapanInput = {
    tempId: string;
    nama: string;
    deskripsi: string;
    urutan: number;
    bobotDefault: number;
    aktif: boolean;
};

const initialTahapanInput: TahapanInput = {
    tempId: '',
    nama: '',
    deskripsi: '',
    urutan: 1,
    bobotDefault: 0,
    aktif: true,
};

interface TahapanTemplateTabProps {
    tahapanTemplateList: TahapanTemplate[];
    setTahapanTemplateList: React.Dispatch<React.SetStateAction<TahapanTemplate[]>>;
    jenisPekerjaanList: JenisPekerjaan[];
}

export function TahapanTemplateTab({
    tahapanTemplateList,
    setTahapanTemplateList,
    jenisPekerjaanList,
}: TahapanTemplateTabProps) {
    const [tahapanModalOpen, setTahapanModalOpen] = useState(false);
    const [tahapanDeleteDialogOpen, setTahapanDeleteDialogOpen] = useState(false);
    const [selectedTahapan, setSelectedTahapan] = useState<TahapanTemplate | null>(null);
    const [tahapanViewMode, setTahapanViewMode] = useState(false);

    // State untuk batch input tahapan
    const [selectedJenisId, setSelectedJenisId] = useState<string>('');
    const [tahapanInputList, setTahapanInputList] = useState<TahapanInput[]>([]);
    const [currentTahapanInput, setCurrentTahapanInput] = useState<TahapanInput>(initialTahapanInput);

    // State untuk edit mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTahapanId, setEditingTahapanId] = useState<string | null>(null);
    const [editingTahapanOriginalPosition, setEditingTahapanOriginalPosition] = useState<number>(0);

    // Group tahapan by jenis pekerjaan
    const groupedTahapan = useMemo(() => {
        const groups: Record<string, TahapanTemplate[]> = {};

        tahapanTemplateList.forEach(tahapan => {
            if (!groups[tahapan.jenisPekerjaanId]) {
                groups[tahapan.jenisPekerjaanId] = [];
            }
            groups[tahapan.jenisPekerjaanId].push(tahapan);
        });

        // Sort tahapan by urutan within each group
        Object.keys(groups).forEach(jenisId => {
            groups[jenisId].sort((a, b) => a.urutan - b.urutan);
        });

        return groups;
    }, [tahapanTemplateList]);

    // Helpers
    const getJenisNama = (jenisId: string) => {
        return jenisPekerjaanList.find(j => j.id === jenisId)?.nama || 'Unknown';
    };

    const getJenisKode = (jenisId: string) => {
        return jenisPekerjaanList.find(j => j.id === jenisId)?.kode || 'N/A';
    };

    const getJenisWarna = (jenisId: string) => {
        return jenisPekerjaanList.find(j => j.id === jenisId)?.warna || '#3B82F6';
    };

    const getTotalBobotInputList = () => {
        return tahapanInputList.reduce((sum, t) => sum + t.bobotDefault, 0);
    };

    const getSisaBobot = () => {
        return 100 - getTotalBobotInputList();
    };

    // Handlers
    const handleCreateTahapan = () => {
        setSelectedTahapan(null);
        setSelectedJenisId('');
        setTahapanInputList([]);
        setCurrentTahapanInput({ ...initialTahapanInput, urutan: 1 });
        setTahapanViewMode(false);
        setIsEditMode(false);
        setTahapanModalOpen(true);
        setEditingTahapanOriginalPosition(0);
    };

    const handleEditTahapanByJenis = (jenisId: string) => {
        const tahapanForJenis = tahapanTemplateList
            .filter(t => t.jenisPekerjaanId === jenisId)
            .sort((a, b) => a.urutan - b.urutan)
            .map(t => ({
                tempId: t.id,
                nama: t.nama,
                deskripsi: t.deskripsi || '',
                urutan: t.urutan,
                bobotDefault: t.bobotDefault,
                aktif: t.aktif,
            }));

        setSelectedJenisId(jenisId);
        setTahapanInputList(tahapanForJenis);
        setCurrentTahapanInput({ ...initialTahapanInput, urutan: tahapanForJenis.length + 1 });
        setTahapanViewMode(false);
        setIsEditMode(true);
        setTahapanModalOpen(true);
        setEditingTahapanOriginalPosition(0);
    };

    const handleViewTahapan = (item: TahapanTemplate) => {
        setSelectedTahapan(item);
        setSelectedJenisId(item.jenisPekerjaanId);
        setTahapanInputList([{
            tempId: item.id,
            nama: item.nama,
            deskripsi: item.deskripsi || '',
            urutan: item.urutan,
            bobotDefault: item.bobotDefault,
            aktif: item.aktif,
        }]);
        setTahapanViewMode(true);
        setIsEditMode(false);
        setTahapanModalOpen(true);
        setEditingTahapanOriginalPosition(0);
    };

    const handleDeleteTahapan = (item: TahapanTemplate) => {
        setSelectedTahapan(item);
        setTahapanDeleteDialogOpen(true);
    };

    const confirmDeleteTahapan = () => {
        if (selectedTahapan) {
            const updatedList = tahapanTemplateList
                .filter(t => t.id !== selectedTahapan.id)
                .map((t, index) => {
                    if (t.jenisPekerjaanId === selectedTahapan.jenisPekerjaanId) {
                        const sameTahapan = tahapanTemplateList
                            .filter(th => th.jenisPekerjaanId === selectedTahapan.jenisPekerjaanId && th.id !== selectedTahapan.id)
                            .sort((a, b) => a.urutan - b.urutan);
                        const newUrutan = sameTahapan.findIndex(th => th.id === t.id) + 1;
                        return { ...t, urutan: newUrutan };
                    }
                    return t;
                });

            setTahapanTemplateList(updatedList);
            toast.success('Template tahapan berhasil dihapus dan urutan disesuaikan');
        }
        setTahapanDeleteDialogOpen(false);
        setSelectedTahapan(null);
    };

    const handleAddTahapanToList = () => {
        if (!selectedJenisId) {
            toast.error('Pilih jenis pekerjaan terlebih dahulu!');
            return;
        }
        if (!currentTahapanInput.nama) {
            toast.error('Nama tahapan harus diisi!');
            return;
        }
        if (currentTahapanInput.bobotDefault < 0 || currentTahapanInput.bobotDefault > 100) {
            toast.error('Bobot harus antara 0-100!');
            return;
        }

        if (editingTahapanId) {
            setTahapanInputList(prev => {
                const updatedList = [...prev];
                updatedList.splice(editingTahapanOriginalPosition, 0, {
                    ...currentTahapanInput,
                    tempId: editingTahapanId,
                });
                return updatedList.map((t, idx) => ({ ...t, urutan: idx + 1 }));
            });
            toast.success('Tahapan berhasil diperbarui');
        } else {
            const newTahapan: TahapanInput = {
                ...currentTahapanInput,
                tempId: Date.now().toString(),
                urutan: tahapanInputList.length + 1,
            };

            setTahapanInputList(prev => [...prev, newTahapan]);
            toast.success('Tahapan ditambahkan ke daftar');
        }

        setCurrentTahapanInput({
            ...initialTahapanInput,
            urutan: tahapanInputList.length + 1,
        });
        setEditingTahapanId(null);
        setEditingTahapanOriginalPosition(0);
    };

    const handleRemoveTahapanFromList = (tempId: string) => {
        setTahapanInputList(prev => {
            const updated = prev.filter(t => t.tempId !== tempId);
            return updated.map((t, idx) => ({ ...t, urutan: idx + 1 }));
        });
        setCurrentTahapanInput({
            ...currentTahapanInput,
            urutan: tahapanInputList.length,
        });
        toast.success('Tahapan dihapus dari daftar');
    };

    const handleEditTahapanInList = (tahapan: TahapanInput) => {
        const originalIndex = tahapanInputList.findIndex(t => t.tempId === tahapan.tempId);

        setEditingTahapanId(tahapan.tempId);
        setEditingTahapanOriginalPosition(originalIndex);
        setCurrentTahapanInput(tahapan);

        setTahapanInputList(prev => prev.filter(t => t.tempId !== tahapan.tempId));
    };

    const handleMoveTahapanUp = (tempId: string) => {
        const index = tahapanInputList.findIndex(t => t.tempId === tempId);
        if (index <= 0) return;

        const newList = [...tahapanInputList];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];

        const reordered = newList.map((t, idx) => ({ ...t, urutan: idx + 1 }));
        setTahapanInputList(reordered);
        toast.success('Urutan tahapan diubah');
    };

    const handleMoveTahapanDown = (tempId: string) => {
        const index = tahapanInputList.findIndex(t => t.tempId === tempId);
        if (index >= tahapanInputList.length - 1) return;

        const newList = [...tahapanInputList];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];

        const reordered = newList.map((t, idx) => ({ ...t, urutan: idx + 1 }));
        setTahapanInputList(reordered);
        toast.success('Urutan tahapan diubah');
    };

    const handleSaveAllTahapan = () => {
        if (!selectedJenisId) {
            toast.error('Pilih jenis pekerjaan terlebih dahulu!');
            return;
        }

        if (tahapanInputList.length === 0) {
            toast.error('Tambahkan minimal satu tahapan!');
            return;
        }

        const totalBobot = tahapanInputList.reduce((sum, t) => sum + t.bobotDefault, 0);
        if (totalBobot > 100) {
            toast.error(`Total bobot melebihi 100% (${totalBobot}%)`);
            return;
        }

        if (isEditMode) {
            const otherTahapan = tahapanTemplateList.filter(t => t.jenisPekerjaanId !== selectedJenisId);

            const updatedTahapanList: TahapanTemplate[] = tahapanInputList.map((input, index) => {
                const existingTahapan = tahapanTemplateList.find(t => t.id === input.tempId);

                return {
                    id: existingTahapan ? existingTahapan.id : Date.now().toString() + Math.random().toString(),
                    jenisPekerjaanId: selectedJenisId,
                    nama: input.nama,
                    deskripsi: input.deskripsi,
                    urutan: input.urutan,
                    bobotDefault: input.bobotDefault,
                    aktif: input.aktif,
                    createdAt: existingTahapan ? existingTahapan.createdAt : new Date(),
                    updatedAt: new Date(),
                };
            });

            setTahapanTemplateList([...otherTahapan, ...updatedTahapanList]);
            toast.success(`${updatedTahapanList.length} template tahapan berhasil diperbarui!`);
        } else {
            const newTahapanList: TahapanTemplate[] = tahapanInputList.map(input => ({
                id: Date.now().toString() + Math.random().toString(),
                jenisPekerjaanId: selectedJenisId,
                nama: input.nama,
                deskripsi: input.deskripsi,
                urutan: input.urutan,
                bobotDefault: input.bobotDefault,
                aktif: input.aktif,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            setTahapanTemplateList(prev => [...prev, ...newTahapanList]);
            toast.success(`${newTahapanList.length} template tahapan berhasil ditambahkan!`);
        }

        setTahapanModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreateTahapan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Template Tahapan
                </Button>
            </div>

            <div className="space-y-4">
                {Object.entries(groupedTahapan).map(([jenisId, tahapanList]) => {
                    const jenis = jenisPekerjaanList.find(j => j.id === jenisId);
                    if (!jenis) return null;

                    const totalBobot = tahapanList.reduce((sum, t) => sum + t.bobotDefault, 0);
                    const activeCount = tahapanList.filter(t => t.aktif).length;

                    return (
                        <Card key={jenisId}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: jenis.warna }}
                                        />
                                        <div>
                                            <CardTitle className="text-base">
                                                {jenis.kode} - {jenis.nama}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {tahapanList.length} tahapan • {activeCount} aktif • Total bobot: {totalBobot}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={totalBobot === 100 ? 'default' : 'secondary'}
                                            className="ml-2"
                                        >
                                            {totalBobot}%
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditTahapanByJenis(jenisId)}
                                            title="Edit Semua Tahapan"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {tahapanList.map((tahapan) => (
                                        <div
                                            key={tahapan.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                    #{tahapan.urutan}
                                                </Badge>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm">{tahapan.nama}</p>
                                                        {!tahapan.aktif && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {tahapan.deskripsi && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                            {tahapan.deskripsi}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                    {tahapan.bobotDefault}%
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 ml-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => handleViewTahapan(tahapan)}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => handleDeleteTahapan(tahapan)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {Object.keys(groupedTahapan).length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Belum ada template tahapan</p>
                                <p className="text-xs mt-1">Silakan tambah template tahapan baru</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={tahapanModalOpen} onOpenChange={setTahapanModalOpen}>
                <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {tahapanViewMode
                                ? 'Detail Template Tahapan'
                                : isEditMode
                                    ? 'Edit Template Tahapan'
                                    : 'Tambah Template Tahapan'}
                        </DialogTitle>
                    </DialogHeader>

                    {!tahapanViewMode ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-700">
                                    Pilih Jenis Pekerjaan <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={selectedJenisId}
                                    onValueChange={setSelectedJenisId}
                                    disabled={isEditMode}
                                >
                                    <SelectTrigger className="h-10 border-gray-300">
                                        <SelectValue placeholder="Pilih Jenis Pekerjaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jenisPekerjaanList
                                            .filter((j) => j.aktif)
                                            .map((jenis) => (
                                                <SelectItem key={jenis.id} value={jenis.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded"
                                                            style={{ backgroundColor: jenis.warna }}
                                                        />
                                                        {jenis.kode} - {jenis.nama}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedJenisId && (
                                <>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Plus className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {editingTahapanId ? 'Edit Tahapan' : 'Tambah Tahapan'}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {editingTahapanId
                                                        ? 'Edit dan klik tombol Update'
                                                        : 'Isi form dan klik tombol Tambah ke Daftar'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-gray-700">Nomor Urut</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={currentTahapanInput.urutan}
                                                            className="h-10 pr-8 font-semibold text-center bg-gray-100 border-gray-300"
                                                            disabled
                                                        />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                                                            Auto
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="sm:col-span-3 space-y-1.5">
                                                    <Label className="text-xs font-semibold text-gray-700">
                                                        Nama Tahapan <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        placeholder="Contoh: Perencanaan, Desain, Pengembangan..."
                                                        value={currentTahapanInput.nama}
                                                        onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, nama: e.target.value })}
                                                        className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-gray-700">Deskripsi</Label>
                                                <Textarea
                                                    placeholder="Deskripsi singkat tentang tahapan ini (opsional)"
                                                    value={currentTahapanInput.deskripsi}
                                                    onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, deskripsi: e.target.value })}
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-gray-700">
                                                    Bobot (%) <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={currentTahapanInput.bobotDefault || ''}
                                                        onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, bobotDefault: parseFloat(e.target.value) || 0 })}
                                                        className="h-10 pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                                                        %
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Sisa bobot: <span className="font-semibold">{getSisaBobot().toFixed(1)}%</span>
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-end pt-2 gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={handleAddTahapanToList}
                                                    className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    {editingTahapanId ? 'Update' : 'Tambah ke Daftar'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {tahapanInputList.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <Label className="text-sm font-semibold">
                                                    Daftar Tahapan ({tahapanInputList.length})
                                                </Label>
                                                <Badge variant={getTotalBobotInputList() === 100 ? 'default' : 'secondary'}>
                                                    Total: {getTotalBobotInputList().toFixed(1)}%
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                {tahapanInputList.map((tahapan, index) => (
                                                    <div
                                                        key={tahapan.tempId}
                                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                                                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                                                #{tahapan.urutan}
                                                            </Badge>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-sm">{tahapan.nama}</p>
                                                                {tahapan.deskripsi && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                                        {tahapan.deskripsi}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                                                {tahapan.bobotDefault}%
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-end gap-1 w-full sm:w-auto">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                                                onClick={() => handleMoveTahapanUp(tahapan.tempId)}
                                                                disabled={index === 0}
                                                                title="Pindah ke Atas"
                                                            >
                                                                <ArrowUp className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                                                onClick={() => handleMoveTahapanDown(tahapan.tempId)}
                                                                disabled={index === tahapanInputList.length - 1}
                                                                title="Pindah ke Bawah"
                                                            >
                                                                <ArrowDown className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 flex-shrink-0"
                                                                onClick={() => handleEditTahapanInList(tahapan)}
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 flex-shrink-0"
                                                                onClick={() => handleRemoveTahapanFromList(tahapan.tempId)}
                                                                title="Hapus"
                                                            >
                                                                <X className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setTahapanModalOpen(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveAllTahapan}
                                    disabled={tahapanInputList.length === 0}
                                    className="w-full sm:w-auto h-10 px-6 bg-green-600 hover:bg-green-700"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditMode ? 'Update Semua' : 'Simpan Semua'} ({tahapanInputList.length})
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Jenis Pekerjaan</Label>
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: getJenisWarna(selectedJenisId) }}
                                    />
                                    <span>{getJenisKode(selectedJenisId)} - {getJenisNama(selectedJenisId)}</span>
                                </div>
                            </div>

                            {tahapanInputList.map((tahapan) => (
                                <div key={tahapan.tempId} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Nama Tahapan</Label>
                                            <p className="font-medium">{tahapan.nama}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Urutan</Label>
                                            <p className="font-medium">#{tahapan.urutan}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                                            <p className="text-sm">{tahapan.deskripsi || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Bobot</Label>
                                            <p className="font-medium">{tahapan.bobotDefault}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    type="button"
                                    onClick={() => setTahapanModalOpen(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={tahapanDeleteDialogOpen}
                onOpenChange={setTahapanDeleteDialogOpen}
                title="Hapus Template Tahapan"
                description={`Apakah Anda yakin ingin menghapus template "${selectedTahapan?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={confirmDeleteTahapan}
                confirmText="Hapus"
                variant="destructive"
            />
        </div>
    );
}
