"use client";

import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Upload, X, FileText, Download, CheckCircle2, Circle, Calendar, Flag, AlertTriangle, Clock, Loader2, ArrowUp, ArrowDown, AlertCircle, ListChecks, FolderOpen, FilePlus, ExternalLink } from 'lucide-react';
import { TahapanKerja, TahapanAdendum } from '@/types';
import { FormData } from '../../hooks/useFormManagement';
import { formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { FileIcon } from '../';
import { getFileIconClass } from '../../utils/fileHelpers';
import { calculateWeightedProgress, calculateSisaBobot } from '../../utils/calculations';
import { mockJenisPekerjaan, mockTahapanTemplate } from '@/mocks/data';
import { useState, useMemo } from 'react';

interface TahapanTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
  // newTahapan: TahapanKerja;
  // setNewTahapan: (data: TahapanKerja) => void;
  newTahapan: Omit<TahapanKerja, 'id'>;
  setNewTahapan: (data: Omit<TahapanKerja, 'id'>) => void;
  tahapanManagement: any;
  fileManagement: any;
  handleAddTahapan: () => void;
  handleTahapanFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExistingTahapanFileUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removeTahapanFile: (fileName: string) => void;
  removeExistingTahapanFile: (idx: number, fileName: string) => void;
}

export function TahapanTab({
  formData,
  setFormData,
  viewMode,
  newTahapan,
  setNewTahapan,
  tahapanManagement,
  fileManagement,
  handleAddTahapan,
  handleTahapanFileUpload,
  handleExistingTahapanFileUpload,
  removeTahapanFile,
  removeExistingTahapanFile
}: TahapanTabProps) {
  const sisaBobot = calculateSisaBobot(formData.tahapan);

  // State untuk template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedJenisIdForTemplate, setSelectedJenisIdForTemplate] = useState<string>('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // State untuk Adendum
  const [adendumDialogOpen, setAdendumDialogOpen] = useState(false);
  const [selectedTahapanIdForAdendum, setSelectedTahapanIdForAdendum] = useState<string | null>(null);
  const [newAdendumData, setNewAdendumData] = useState<{
    tanggal: Date;
    keterangan: string;
    files: string[];
  }>({
    tanggal: new Date(),
    keterangan: '',
    files: []
  });

  // State for Sub-Tahapan Input
  const [subTahapanInput, setSubTahapanInput] = useState('');
  const [editSubTahapanInput, setEditSubTahapanInput] = useState('');

  // Group tahapan template by jenis pekerjaan
  const groupedTemplate = useMemo(() => {
    const groups: Record<string, typeof mockTahapanTemplate> = {};

    mockTahapanTemplate.forEach(tahapan => {
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
  }, []);

  // Handler untuk membuka dialog template
  const handleOpenTemplateDialog = () => {
    setTemplateDialogOpen(true);
    setSelectedJenisIdForTemplate('');
    setSelectedTemplates([]);
  };

  // Handler untuk toggle selection template
  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  // Handler untuk apply template yang dipilih
  const handleApplyTemplates = () => {
    if (selectedTemplates.length === 0) {
      toast.error('Pilih minimal satu template tahapan!');
      return;
    }

    // Get selected templates
    const templates = mockTahapanTemplate.filter(t => selectedTemplates.includes(t.id));

    // Convert templates to TahapanKerja format
    const newTahapanList: Omit<TahapanKerja, 'id'>[] = templates.map((template, index) => ({
      nomor: formData.tahapan.length + index + 1,
      nama: template.nama,
      progress: 0,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
      status: 'pending' as const,
      bobot: template.bobotDefault,
      files: []
    }));

    // Check if total bobot would exceed 100
    const currentBobot = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
    const newBobot = newTahapanList.reduce((sum, t) => sum + t.bobot, 0);

    if (currentBobot + newBobot > 100) {
      toast.error(`Total bobot akan melebihi 100% (${(currentBobot + newBobot).toFixed(1)}%). Silakan sesuaikan bobot tahapan.`);
      return;
    }

    // Add to existing tahapan
    const updatedTahapan = [...formData.tahapan];
    newTahapanList.forEach(tahapan => {
      updatedTahapan.push({
        ...tahapan,
        id: Date.now().toString() + Math.random().toString()
      } as TahapanKerja);
    });

    setFormData({
      ...formData,
      tahapan: updatedTahapan
    });

    toast.success(`${selectedTemplates.length} tahapan berhasil ditambahkan dari template!`);
    setTemplateDialogOpen(false);
    setSelectedTemplates([]);
  };

  // Handler untuk mengisi form dari satu template
  const handleFillFromTemplate = (templateId: string) => {
    const template = mockTahapanTemplate.find(t => t.id === templateId);
    if (!template) return;

    setNewTahapan({
      nomor: formData.tahapan.length + 1,
      nama: template.nama,
      progress: 0,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      bobot: template.bobotDefault,
      files: []
    });

    setTemplateDialogOpen(false);
    toast.success('Form berhasil diisi dari template! Anda dapat mengeditnya sebelum menambahkan.');
  };

  const getJenisNama = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.nama || 'Unknown';
  };

  const getJenisKode = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.kode || 'N/A';
  };

  const getJenisWarna = (jenisId: string) => {
    return mockJenisPekerjaan.find(j => j.id === jenisId)?.warna || '#3B82F6';
  };

  // Handlers for Adendum
  const handleOpenAdendumDialog = (tahapanId: string) => {
    setSelectedTahapanIdForAdendum(tahapanId);
    setNewAdendumData({
      tanggal: new Date(),
      keterangan: '',
      files: []
    });
    setAdendumDialogOpen(true);
  };

  const handleAdendumFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock upload - in real app would upload to server
      const newFiles = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setNewAdendumData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  const removeAdendumFile = (fileUrl: string) => {
    setNewAdendumData(prev => ({
      ...prev,
      files: prev.files.filter(f => f !== fileUrl)
    }));
  };

  const handleSaveAdendum = () => {
    if (!selectedTahapanIdForAdendum) return;
    if (!newAdendumData.keterangan) {
      toast.error('Keterangan adendum harus diisi');
      return;
    }

    tahapanManagement.handleAddAdendum(selectedTahapanIdForAdendum, {
      tanggal: newAdendumData.tanggal,
      keterangan: newAdendumData.keterangan,
      files: newAdendumData.files
    });

    setAdendumDialogOpen(false);
  };

  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
    setNewTahapan({
      ...newTahapan,
      dokumenInvoice: [...(newTahapan.dokumenInvoice || []), ...fileNames]
    });
    toast.success(`${files.length} dokumen invoice ditambahkan`);
  };

  const removeInvoiceFile = (fileName: string) => {
    setNewTahapan({
      ...newTahapan,
      dokumenInvoice: newTahapan.dokumenInvoice?.filter(f => f !== fileName) || []
    });
  };

  const handleEditInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !tahapanManagement.editTahapanData) return;
    const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
    tahapanManagement.setEditTahapanData({
      ...tahapanManagement.editTahapanData,
      dokumenInvoice: [...(tahapanManagement.editTahapanData.dokumenInvoice || []), ...fileNames]
    });
    toast.success(`${files.length} dokumen invoice ditambahkan`);
  };

  const removeEditInvoiceFile = (fileName: string) => {
    if (!tahapanManagement.editTahapanData) return;
    tahapanManagement.setEditTahapanData({
      ...tahapanManagement.editTahapanData,
      dokumenInvoice: tahapanManagement.editTahapanData.dokumenInvoice?.filter((f: string) => f !== fileName) || []
    });
  };

  return (
    <TabsContent value="tahapan" className="space-y-4 px-4 sm:px-6 py-4">
      {!viewMode && (
        <div className="space-y-4">
          {/* Tombol Ambil dari Template */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenTemplateDialog}
              className="h-10 border-2 border-dashed hover:border-solid"
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Ambil dari Template
            </Button>
          </div>

          {/* Form Tambah Tahapan */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tambah Tahapan Baru</h3>
                <p className="text-xs text-gray-500">Isi form untuk menambahkan tahapan pekerjaan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Nomor & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Nomor Urut</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.tahapan.length > 0 ? Math.max(...formData.tahapan.map(t => t.nomor || 0)) + 1 : 1}
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
                    value={newTahapan.nama}
                    onChange={(e) => setNewTahapan({ ...newTahapan, nama: e.target.value })}
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 1.5: Deskripsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Deskripsi (Opsional)
                </Label>
                <Input
                  value={newTahapan.deskripsi || ''}
                  onChange={(e) => setNewTahapan({ ...newTahapan, deskripsi: e.target.value })}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1"
                />
              </div>

              {/* Row 2: Bobot, Status & Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      value={newTahapan.bobot || ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, bobot: Number(e.target.value) })}
                      className="h-10 pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      %
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sisa bobot: <span className="font-semibold">{sisaBobot.toFixed(1)}%</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newTahapan.status}
                    onValueChange={(v: any) => setNewTahapan({ ...newTahapan, status: v as TahapanKerja['status'] })}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="progress">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-blue-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="done">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Selesai</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Anggaran (Rp)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newTahapan.paguAnggaran || ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, paguAnggaran: Number(e.target.value) })}
                      className="h-10 pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formatDateInput(newTahapan.tanggalMulai)}
                    onChange={(e) => setNewTahapan({ ...newTahapan, tanggalMulai: new Date(e.target.value) })}
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    <Flag className="h-3.5 w-3.5 inline mr-1" />
                    Tanggal Selesai (Deadline) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formatDateInput(newTahapan.tanggalSelesai)}
                    onChange={(e) => setNewTahapan({ ...newTahapan, tanggalSelesai: new Date(e.target.value) })}
                    className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Invoice Info */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Informasi Invoice
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Tanggal Invoice</Label>
                    <Input
                      type="date"
                      value={newTahapan.tanggalInvoice ? formatDateInput(newTahapan.tanggalInvoice) : ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, tanggalInvoice: e.target.value ? new Date(e.target.value) : undefined })}
                      className="h-10 border-gray-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Perkiraan Invoice Masuk</Label>
                    <Input
                      type="date"
                      value={newTahapan.perkiraanInvoiceMasuk ? formatDateInput(newTahapan.perkiraanInvoiceMasuk) : ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, perkiraanInvoiceMasuk: e.target.value ? new Date(e.target.value) : undefined })}
                      className="h-10 border-gray-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Jumlah Tagihan Invoice</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                      <Input
                        type="number"
                        value={newTahapan.jumlahTagihanInvoice || ''}
                        onChange={(e) => setNewTahapan({ ...newTahapan, jumlahTagihanInvoice: Number(e.target.value) })}
                        className="h-10 pl-9 border-gray-300"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Status Pembayaran</Label>
                    <Select
                      value={newTahapan.statusPembayaran}
                      onValueChange={(v: any) => setNewTahapan({ ...newTahapan, statusPembayaran: v })}
                    >
                      <SelectTrigger className="h-10 border-gray-300">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="lunas">✅ Lunas</SelectItem>
                        <SelectItem value="overdue">⚠️ Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Invoice Note</Label>
                    <Input
                      value={newTahapan.invoiceNote || ''}
                      onChange={(e) => setNewTahapan({ ...newTahapan, invoiceNote: e.target.value })}
                      className="h-10 border-gray-300"
                      placeholder="Catatan invoice..."
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Dokumen Invoice</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="invoice-file-upload-new"
                        type="file"
                        multiple
                        onChange={handleInvoiceFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto border-dashed"
                        onClick={() => document.getElementById('invoice-file-upload-new')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        Upload Invoice
                      </Button>
                    </div>
                    {newTahapan.dokumenInvoice && newTahapan.dokumenInvoice.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newTahapan.dokumenInvoice.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 border px-2 py-1 rounded text-xs">
                            <span className="truncate max-w-[150px]">{file.split('/').pop()}</span>
                            <button type="button" onClick={() => removeInvoiceFile(file)}>
                              <X className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold text-gray-700">
                  {/* <ListChecks className="h-3.5 w-3.5 inline mr-1" /> */}
                  Sub-Tahapan (Opsional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={subTahapanInput}
                    onChange={(e) => setSubTahapanInput(e.target.value)}
                    placeholder="Contoh: Diskusi Awal, Draft 1..."
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subTahapanInput.trim()) {
                          setNewTahapan({
                            ...newTahapan,
                            subTahapan: [
                              ...(newTahapan.subTahapan || []),
                              {
                                id: Date.now().toString(),
                                nama: subTahapanInput,
                                status: 'pending'
                              }
                            ]
                          });
                          setSubTahapanInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (subTahapanInput.trim()) {
                        setNewTahapan({
                          ...newTahapan,
                          subTahapan: [
                            ...(newTahapan.subTahapan || []),
                            {
                              id: Date.now().toString(),
                              nama: subTahapanInput,
                              status: 'pending'
                            }
                          ]
                        });
                        setSubTahapanInput('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newTahapan.subTahapan && newTahapan.subTahapan.length > 0 && (
                  <div className="space-y-1 mt-2 bg-gray-50 p-2 rounded-md border">
                    {newTahapan.subTahapan.map((sub, idx) => (
                      <div key={sub.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500">{idx + 1}.</span>
                          <span>{sub.nama}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTahapan({
                              ...newTahapan,
                              subTahapan: newTahapan.subTahapan?.filter(s => s.id !== sub.id)
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold text-gray-700">
                  <Upload className="h-3.5 w-3.5 inline mr-1" />
                  Upload Bukti Tahapan (Opsional)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="tahapan-file-upload"
                    type="file"
                    multiple
                    onChange={handleTahapanFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto h-10 border-2 border-dashed hover:border-solid hover:bg-gray-50"
                    onClick={() => document.getElementById('tahapan-file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File
                  </Button>
                  <p className="text-xs text-gray-500 flex items-center">
                    PDF, Word, Excel, Gambar, dll.
                  </p>
                </div>
                {newTahapan.files && newTahapan.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newTahapan.files.map((file, idx) => {
                      const fileName = file.split('/').pop() || '';
                      const iconClass = getFileIconClass(file);
                      return (
                        <div key={idx} className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
                          <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-700 max-w-[150px] truncate">
                            {fileName}
                          </span>
                          <button
                            type="button"
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeTahapanFile(file)}
                          >
                            <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleAddTahapan}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tahapan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Dialog Template Tahapan */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Template Tahapan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Jenis Pekerjaan */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Pilih Jenis Pekerjaan</Label>
              <Select
                value={selectedJenisIdForTemplate}
                onValueChange={setSelectedJenisIdForTemplate}
              >
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue placeholder="Pilih Jenis Pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  {mockJenisPekerjaan
                    .filter((j) => j.aktif && groupedTemplate[j.id])
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

            {/* Daftar Template */}
            {selectedJenisIdForTemplate && groupedTemplate[selectedJenisIdForTemplate] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Template Tahapan ({groupedTemplate[selectedJenisIdForTemplate].length})
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allIds = groupedTemplate[selectedJenisIdForTemplate].map(t => t.id);
                        setSelectedTemplates(allIds);
                      }}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplates([])}
                    >
                      Bersihkan
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                  {groupedTemplate[selectedJenisIdForTemplate].map((template) => {
                    const isSelected = selectedTemplates.includes(template.id);

                    return (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        onClick={() => handleToggleTemplate(template.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            #{template.urutan}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{template.nama}</p>
                            {template.deskripsi && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {template.deskripsi}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {template.bobotDefault}%
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-3 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFillFromTemplate(template.id);
                          }}
                          title="Isi Form dari Template Ini"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Isi Form
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Info Total Bobot */}
                {selectedTemplates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {selectedTemplates.length} tahapan dipilih
                      </span>
                      <span className="font-semibold text-blue-700">
                        Total Bobot: {
                          mockTahapanTemplate
                            .filter(t => selectedTemplates.includes(t.id))
                            .reduce((sum, t) => sum + t.bobotDefault, 0)
                            .toFixed(1)
                        }%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!selectedJenisIdForTemplate && (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Pilih jenis pekerjaan untuk melihat template</p>
              </div>
            )}

            {selectedJenisIdForTemplate && !groupedTemplate[selectedJenisIdForTemplate] && (
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Belum ada template untuk jenis pekerjaan ini</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApplyTemplates}
              disabled={selectedTemplates.length === 0}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambahkan {selectedTemplates.length > 0 ? `(${selectedTemplates.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Add Adendum */}
      <Dialog open={adendumDialogOpen} onOpenChange={setAdendumDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Adendum</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tanggal Adendum</Label>
              <Input
                type="date"
                value={formatDateInput(newAdendumData.tanggal)}
                onChange={(e) => setNewAdendumData({ ...newAdendumData, tanggal: new Date(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan Adendum</Label>
              <Input
                placeholder="Jelaskan perubahan adendum..."
                value={newAdendumData.keterangan}
                onChange={(e) => setNewAdendumData({ ...newAdendumData, keterangan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dokumen Adendum</Label>
              <div className="flex gap-2">
                <Input
                  id="adendum-file-upload"
                  type="file"
                  multiple
                  onChange={handleAdendumFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('adendum-file-upload')?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Dokumen
                </Button>
              </div>
              {newAdendumData.files.length > 0 && (
                <div className="space-y-1 mt-2">
                  {newAdendumData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                      <span className="truncate max-w-[200px]">{file.split('/').pop()}</span>
                      <button onClick={() => removeAdendumFile(file)} className="text-red-500 hover:text-red-700">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAdendum} className="bg-blue-600 hover:bg-blue-700 text-white">
                Simpan Adendum
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Tahapan - Vertical Timeline Style */}
      <div className="space-y-4">
        {formData.tahapan.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada tahapan yang ditambahkan</p>
          </div>
        ) : (
          <>
            {/* Progress Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">Progress Keseluruhan</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formData.tahapan.filter(t => t.status === 'done').length} dari {formData.tahapan.length} tahapan selesai
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-[#416F39]">
                    {calculateWeightedProgress(formData.tahapan).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500">Progress Total</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B8DB8] to-[#416F39] transition-all duration-500 rounded-full"
                    style={{ width: `${calculateWeightedProgress(formData.tahapan)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[30px] sm:left-[44px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-[#5B8DB8] to-[#416F39]"></div>

              {/* Timeline Items - Sorted by nomor */}
              <div className="space-y-6">
                {[...formData.tahapan].sort((a, b) => (a.nomor || 0) - (b.nomor || 0)).map((t, idx) => {
                  // Check if overdue
                  const today = new Date();
                  const deadline = new Date(t.tanggalSelesai);
                  const isOverdue = t.status !== 'done' && deadline < today;

                  const statusConfig = {
                    pending: {
                      icon: Circle,
                      dotColor: 'bg-gray-400',
                      cardBg: 'bg-gray-50',
                      cardBorder: 'border-gray-300',
                      titleColor: 'text-gray-700',
                      badgeBg: 'bg-gray-100',
                      badgeText: 'text-gray-700',
                      yearBg: 'bg-gray-100',
                      yearBorder: 'border-gray-300',
                      yearText: 'text-gray-700'
                    },
                    progress: {
                      icon: Circle,
                      dotColor: 'bg-[#5B8DB8]',
                      cardBg: 'bg-blue-50',
                      cardBorder: 'border-[#5B8DB8]',
                      titleColor: 'text-[#2F5F8C]',
                      badgeBg: 'bg-[#5B8DB8]',
                      badgeText: 'text-white',
                      yearBg: 'bg-blue-100',
                      yearBorder: 'border-[#5B8DB8]',
                      yearText: 'text-[#2F5F8C]'
                    },
                    done: {
                      icon: CheckCircle2,
                      dotColor: 'bg-[#416F39]',
                      cardBg: 'bg-green-50',
                      cardBorder: 'border-[#416F39]',
                      titleColor: 'text-[#416F39]',
                      badgeBg: 'bg-[#416F39]',
                      badgeText: 'text-white',
                      yearBg: 'bg-green-100',
                      yearBorder: 'border-[#416F39]',
                      yearText: 'text-[#416F39]'
                    },
                    overdue: {
                      icon: AlertCircle,
                      dotColor: 'bg-red-500',
                      cardBg: 'bg-red-50',
                      cardBorder: 'border-red-400',
                      titleColor: 'text-red-700',
                      badgeBg: 'bg-red-500',
                      badgeText: 'text-white',
                      yearBg: 'bg-red-100',
                      yearBorder: 'border-red-400',
                      yearText: 'text-red-700'
                    }
                  };
                  const config = isOverdue ? statusConfig.overdue : statusConfig[t.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={t.id} className="relative flex gap-2 sm:gap-4">
                      {/* Left: Number Box */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div className={`w-[60px] sm:w-[88px] h-10 sm:h-12 ${config.yearBg} ${config.yearBorder} border-2 rounded-lg flex items-center justify-center shadow-sm`}>
                          <span className={`text-lg sm:text-xl font-bold ${config.yearText}`}>
                            {t.nomor || idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Right: Content Card */}
                      <div className="flex-1 min-w-0">
                        <div className={`${config.cardBg} border-2 ${config.cardBorder} rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all`}>
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 mb-3">
                            <div className="flex-1 min-w-0 w-full">
                              {tahapanManagement.editingTahapanId === t.id ? (
                                // Mode Edit
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs mb-1">Nomor Urut</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={tahapanManagement.editTahapanData?.nomor || ''}
                                        onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, nomor: Number(e.target.value) })}
                                        className="h-8 text-sm"
                                        placeholder="Nomor"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs mb-1">Nama Tahapan</Label>
                                      <Input
                                        value={tahapanManagement.editTahapanData?.nama || ''}
                                        onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, nama: e.target.value })}
                                        className="h-8 text-sm"
                                        placeholder="Nama tahapan"
                                      />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Deskripsi</Label>
                                        <Input
                                          value={tahapanManagement.editTahapanData?.deskripsi || ''}
                                          onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, deskripsi: e.target.value })}
                                          className="h-8 text-sm"
                                          placeholder="Deskripsi tahapan"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-xs mb-1">Bobot (%)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={tahapanManagement.editTahapanData?.bobot || ''}
                                        onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, bobot: Number(e.target.value) })}
                                        className="h-8 text-sm"
                                        placeholder="Bobot"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs mb-1">Anggaran</Label>
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Rp</span>
                                        <Input
                                          type="number"
                                          value={tahapanManagement.editTahapanData?.paguAnggaran || ''}
                                          onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, paguAnggaran: Number(e.target.value) })}
                                          className="h-8 pl-6 text-sm"
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs mb-1">Tanggal Mulai</Label>
                                      <Input
                                        type="date"
                                        value={formatDateInput(tahapanManagement.editTahapanData?.tanggalMulai || new Date())}
                                        onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, tanggalMulai: new Date(e.target.value) })}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs mb-1">Tanggal Selesai (Deadline)</Label>
                                      <Input
                                        type="date"
                                        value={formatDateInput(tahapanManagement.editTahapanData?.tanggalSelesai || new Date())}
                                        onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, tanggalSelesai: new Date(e.target.value) })}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="text-xs mb-1">Status</Label>
                                      <Select
                                        value={tahapanManagement.editTahapanData?.status}
                                        onValueChange={(v: any) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, status: v as TahapanKerja['status'] })}
                                      >
                                        <SelectTrigger className="h-8 text-xs w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">⏳ Pending</SelectItem>
                                          <SelectItem value="progress">🔄 In Progress</SelectItem>
                                          <SelectItem value="done">✅ Selesai</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="sm:col-span-2 pt-2 border-t mt-2">
                                      <Label className="text-xs font-semibold mb-2 block">Sub-Tahapan</Label>
                                      <div className="flex gap-2 mb-2">
                                        <Input
                                          value={editSubTahapanInput}
                                          onChange={(e) => setEditSubTahapanInput(e.target.value)}
                                          placeholder="Tambah sub-tahapan..."
                                          className="h-8 text-xs"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (editSubTahapanInput.trim()) {
                                                tahapanManagement.setEditTahapanData({
                                                  ...tahapanManagement.editTahapanData,
                                                  subTahapan: [
                                                    ...(tahapanManagement.editTahapanData.subTahapan || []),
                                                    {
                                                      id: Date.now().toString(),
                                                      nama: editSubTahapanInput,
                                                      status: 'pending'
                                                    }
                                                  ]
                                                });
                                                setEditSubTahapanInput('');
                                              }
                                            }
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            if (editSubTahapanInput.trim()) {
                                              tahapanManagement.setEditTahapanData({
                                                ...tahapanManagement.editTahapanData,
                                                subTahapan: [
                                                  ...(tahapanManagement.editTahapanData.subTahapan || []),
                                                  {
                                                    id: Date.now().toString(),
                                                    nama: editSubTahapanInput,
                                                    status: 'pending'
                                                  }
                                                ]
                                              });
                                              setEditSubTahapanInput('');
                                            }
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      {tahapanManagement.editTahapanData?.subTahapan && tahapanManagement.editTahapanData.subTahapan.length > 0 && (
                                        <div className="space-y-1">
                                          {tahapanManagement.editTahapanData.subTahapan.map((sub: any, idx: number) => (
                                            <div key={sub.id} className="flex items-center justify-between text-xs bg-gray-50 p-1.5 rounded border">
                                              <div className="flex items-center gap-2">
                                                <Checkbox
                                                  checked={sub.status === 'done'}
                                                  onCheckedChange={(checked) => {
                                                    const updatedSub = tahapanManagement.editTahapanData.subTahapan.map((s: any) =>
                                                      s.id === sub.id ? { ...s, status: checked ? 'done' : 'pending' } : s
                                                    );
                                                    tahapanManagement.setEditTahapanData({
                                                      ...tahapanManagement.editTahapanData,
                                                      subTahapan: updatedSub
                                                    });
                                                  }}
                                                  className="h-3 w-3"
                                                />
                                                <span className={sub.status === 'done' ? 'line-through text-gray-400' : ''}>{sub.nama}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  tahapanManagement.setEditTahapanData({
                                                    ...tahapanManagement.editTahapanData,
                                                    subTahapan: tahapanManagement.editTahapanData.subTahapan.filter((s: any) => s.id !== sub.id)
                                                  });
                                                }}
                                              >
                                                <X className="h-3 w-3 text-red-400" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="sm:col-span-2 pt-2 border-t mt-2">
                                      <Label className="text-xs font-semibold mb-2 block">Informasi Invoice</Label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs mb-1">Tgl Invoice</Label>
                                          <Input
                                            type="date"
                                            value={tahapanManagement.editTahapanData?.tanggalInvoice ? formatDateInput(tahapanManagement.editTahapanData.tanggalInvoice) : ''}
                                            onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, tanggalInvoice: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs mb-1">Est. Masuk</Label>
                                          <Input
                                            type="date"
                                            value={tahapanManagement.editTahapanData?.perkiraanInvoiceMasuk ? formatDateInput(tahapanManagement.editTahapanData.perkiraanInvoiceMasuk) : ''}
                                            onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, perkiraanInvoiceMasuk: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs mb-1">Jumlah</Label>
                                          <Input
                                            type="number"
                                            value={tahapanManagement.editTahapanData?.jumlahTagihanInvoice || ''}
                                            onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, jumlahTagihanInvoice: Number(e.target.value) })}
                                            className="h-8 text-sm"
                                            placeholder="Rp"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs mb-1">Status Bayar</Label>
                                          <Select
                                            value={tahapanManagement.editTahapanData?.statusPembayaran}
                                            onValueChange={(v: any) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, statusPembayaran: v })}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">⏳ Pending</SelectItem>
                                              <SelectItem value="lunas">✅ Lunas</SelectItem>
                                              <SelectItem value="overdue">⚠️ Overdue</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="sm:col-span-2">
                                          <Label className="text-xs mb-1">Note</Label>
                                          <Input
                                            value={tahapanManagement.editTahapanData?.invoiceNote || ''}
                                            onChange={(e) => tahapanManagement.setEditTahapanData({ ...tahapanManagement.editTahapanData!, invoiceNote: e.target.value })}
                                            className="h-8 text-sm"
                                            placeholder="Catatan..."
                                          />
                                        </div>
                                        <div className="sm:col-span-2">
                                          <Label className="text-xs mb-1">Dokumen Invoice</Label>
                                          <div className="flex gap-2 mb-2">
                                            <Input
                                              id={`edit-invoice-upload-${t.id}`}
                                              type="file"
                                              multiple
                                              onChange={handleEditInvoiceFileUpload}
                                              className="hidden"
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-xs"
                                              onClick={() => document.getElementById(`edit-invoice-upload-${t.id}`)?.click()}
                                            >
                                              <Upload className="h-3 w-3 mr-1" /> Upload
                                            </Button>
                                          </div>
                                          {tahapanManagement.editTahapanData?.dokumenInvoice && (
                                            <div className="flex flex-wrap gap-1">
                                              {tahapanManagement.editTahapanData.dokumenInvoice.map((f: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1 bg-gray-50 border px-1.5 py-0.5 rounded text-[10px]">
                                                  <span className="truncate max-w-[100px]">{f.split('/').pop()}</span>
                                                  <button type="button" onClick={() => removeEditInvoiceFile(f)}>
                                                    <X className="h-2.5 w-2.5 text-red-500" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Mode View
                                <>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 className={`font-bold ${config.titleColor} text-sm sm:text-base truncate`}>{t.nama}</h4>
                                    {t.adendum && t.adendum.length > 0 && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 text-[10px] px-2">
                                        <FilePlus className="h-3 w-3" />
                                        {t.adendum.length > 1 ? `${t.adendum.length} Adendum` : 'Adendum'}
                                      </Badge>
                                    )}
                                    <span className={`px-2.5 py-1 ${config.badgeBg} ${config.badgeText} rounded-full text-xs font-semibold flex items-center gap-1`}>
                                      {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                                      {!isOverdue && t.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                      {!isOverdue && t.status === 'progress' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                      {!isOverdue && t.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      {isOverdue ? 'Terlambat' : t.status === 'pending' ? 'Pending' : t.status === 'progress' ? 'In Progress' : 'Selesai'}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-2.5 -mt-1">
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                      <span className="font-semibold text-gray-500">Bobot:</span> {t.bobot}%
                                    </span>
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      <Calendar className="h-3 w-3 text-gray-400" />
                                      <span>{formatDate(t.tanggalMulai)}</span>
                                      <span className="mx-1 text-gray-400">-</span>
                                      <span className={`${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                        {formatDate(t.tanggalSelesai)}
                                      </span>
                                      {isOverdue && (
                                        <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 rounded-sm font-medium">
                                          Terlewat
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {t.deskripsi && (
                                    <p className="text-sm text-gray-600 mb-2 italic">
                                      {t.deskripsi}
                                    </p>
                                  )}

                                  {/* Sub-Tahapan List in View Mode */}
                                  {t.subTahapan && t.subTahapan.length > 0 && (
                                    <div className="mb-3 pl-1">
                                      <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                        {/* <ListChecks className="h-3 w-3" /> */}
                                        Sub-Tahapan:
                                      </div>
                                      <div className="space-y-1">
                                        {t.subTahapan.map((sub, sIdx) => (
                                          <div key={sub.id || sIdx} className="flex items-center gap-2 text-xs text-gray-700">
                                            {sub.status === 'done' ? (
                                              <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                            ) : (
                                              <Circle className="h-3 w-3 text-gray-300 flex-shrink-0" />
                                            )}
                                            <span className={sub.status === 'done' ? 'line-through text-gray-400' : ''}>
                                              {sub.nama}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                                    {t.paguAnggaran && (
                                      <span className="flex items-center gap-1 font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
                                        <span>Anggaran:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.paguAnggaran)}
                                      </span>
                                    )}

                                  </div>
                                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-2">
                                    {t.jumlahTagihanInvoice && (
                                      <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        <span>Invoice:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.jumlahTagihanInvoice)}
                                      </span>
                                    )}
                                    {t.statusPembayaran && (
                                      <Badge variant="outline" className={`text-[10px] ${t.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                        t.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {t.statusPembayaran.toUpperCase()}
                                      </Badge>
                                    )}
                                    {t.perkiraanInvoiceMasuk && (
                                      <span className="flex items-center gap-1 text-[10px]">
                                        Est. Masuk: {t.perkiraanInvoiceMasuk ? formatDate(t.perkiraanInvoiceMasuk) : '-'}
                                      </span>
                                    )}
                                    {t.dokumenInvoice && t.dokumenInvoice.length > 0 && (
                                      <div className="flex gap-1">
                                        {t.dokumenInvoice.map((f, i) => (
                                          <a key={i} href={f} target="_blank" className="text-blue-500 hover:underline text-[10px]">
                                            <FileText className="h-3 w-3 inline" /> Inv {i + 1}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* List Adendum */}
                                  {t.adendum && t.adendum.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <div className="text-xs font-semibold text-yellow-800 flex items-center gap-1">
                                        <FilePlus className="h-3.5 w-3.5" />
                                        Riwayat Adendum ({t.adendum.length})
                                      </div>
                                      <div className="space-y-2 pl-2 border-l-2 border-yellow-200">
                                        {t.adendum.map((ad, adIdx) => (
                                          <div key={ad.id} className="bg-yellow-50/50 p-2 rounded text-xs space-y-1">
                                            <div className="flex justify-between items-start">
                                              <span className="font-medium text-gray-900">{formatDate(ad.tanggal)}</span>
                                              {!viewMode && (
                                                <button
                                                  onClick={() => tahapanManagement.handleDeleteAdendum(t.id, ad.id)}
                                                  className="text-red-400 hover:text-red-600"
                                                  title="Hapus Adendum"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              )}
                                            </div>
                                            <p className="text-gray-700">{ad.keterangan}</p>
                                            {ad.files && ad.files.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {ad.files.map((f, fIdx) => (
                                                  <a key={fIdx} href={f} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-white border border-yellow-200 px-1.5 py-0.5 rounded text-[10px] text-blue-600 hover:underline">
                                                    <FileText className="h-2.5 w-2.5" />
                                                    Dokumen {fIdx + 1}
                                                  </a>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            {!viewMode && (
                              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                                {tahapanManagement.editingTahapanId === t.id ? (
                                  // Edit mode buttons
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 sm:h-8 hover:bg-green-50"
                                      onClick={() => tahapanManagement.handleSaveEditTahapan()}
                                      title="Simpan"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mr-1" />
                                      Simpan
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 sm:h-8 hover:bg-red-50"
                                      onClick={() => tahapanManagement.handleCancelEditTahapan()}
                                      title="Batal"
                                    >
                                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mr-1" />
                                      Batal
                                    </Button>
                                  </>
                                ) : (
                                  // Normal mode buttons
                                  <>
                                    {/* Tombol Naik */}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                      onClick={() => tahapanManagement.handleMoveTahapanUp(t.id)}
                                      disabled={idx === 0}
                                      title="Pindah ke Atas"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    {/* Tombol Turun */}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0"
                                      onClick={() => tahapanManagement.handleMoveTahapanDown(t.id)}
                                      disabled={idx === formData.tahapan.length - 1}
                                      title="Pindah ke Bawah"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 hover:text-blue-600 flex-shrink-0"
                                      onClick={() => tahapanManagement.handleEditTahapan(t)}
                                      title="Edit Tahapan"
                                    >
                                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-yellow-50 hover:text-yellow-600 flex-shrink-0"
                                      onClick={() => handleOpenAdendumDialog(t.id)}
                                      title="Tambah Adendum"
                                    >
                                      <FilePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                      onClick={() => {
                                        // Hapus tahapan dan atur ulang nomor urut
                                        const updatedTahapan = formData.tahapan
                                          .filter((tahapan) => tahapan.id !== t.id)
                                          .map((tahapan, index) => ({
                                            ...tahapan,
                                            nomor: index + 1
                                          }));

                                        setFormData({
                                          ...formData,
                                          tahapan: updatedTahapan
                                        });
                                        toast.success('Tahapan berhasil dihapus dan urutan disesuaikan');
                                      }}
                                      title="Hapus Tahapan"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Files Section */}
                          {t.files && t.files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5 sm:gap-2">
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Dokumen ({t.files.length})
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {t.files.map((file, fileIdx) => {
                                  const fileName = file.split('/').pop() || '';
                                  return (
                                    <div key={fileIdx} className="group flex items-center justify-between gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs font-medium text-gray-700 truncate">
                                          {fileName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => fileManagement.handleDownloadFile(file)}
                                          title="Download"
                                        >
                                          <Download className="h-3.5 w-3.5 text-[#2F5F8C]" />
                                        </Button>
                                        {!viewMode && (
                                          <button
                                            type="button"
                                            className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExistingTahapanFile(idx, file)}
                                            title="Hapus"
                                          >
                                            <X className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Upload Button */}
                          {!viewMode && (
                            <div className="mt-3">
                              <Input
                                id={`tahapan-file-${idx}`}
                                type="file"
                                multiple
                                onChange={(e) => handleExistingTahapanFileUpload(idx, e)}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-dashed hover:border-solid"
                                onClick={() => document.getElementById(`tahapan-file-${idx}`)?.click()}
                              >
                                <>
                                  <Upload className="h-3.5 w-3.5 mr-2" />
                                  Upload Dokumen
                                </>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </TabsContent >
  );
}