'use client';

import { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Download, Upload, Trash2, MapPin, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArsipPekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatDate } from '@/lib/helpers';

// ─── Tipe Dokumen Entry ────────────────────────────────────────────────────
interface DokumenEntry {
    id: string;
    nama: string;
    kategori: 'SPK' | 'Invoice' | 'Lainnya';
    note: string;
    tanggalUpload: Date;
}

type FormData = Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
    tim?: string[];
    tahapan?: TahapanKerja[];
    anggaran?: AnggaranItem[];
    tenderType?: 'tender' | 'non-tender';
    dokumenLelang?: {
        dokumenTender?: string[];
        dokumenAdministrasi?: string[];
        dokumenTeknis?: string[];
        dokumenPenawaran?: string[];
    };
    dokumenNonLelang?: string[];
    dokumenKontrak?: DokumenEntry[];
    // legacy fields (backward compat — ignored in render)
    dokumenSPK?: string[];
    dokumenInvoice?: string[];
    aoiFile?: string;
};

interface DokumenTabProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    viewMode: boolean;
    handleDownloadDokumen: (fileName: string) => void;
}

const kategoriColor: Record<DokumenEntry['kategori'], string> = {
    SPK: 'bg-amber-100 text-amber-800 border-amber-200',
    Invoice: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Lainnya: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function DokumenTab({ formData, setFormData, viewMode, handleDownloadDokumen }: DokumenTabProps) {
    const [newNote, setNewNote] = useState('');
    const [newKategori, setNewKategori] = useState<DokumenEntry['kategori']>('SPK');

    const hasLelangDocs = formData.tenderType === 'tender' && formData.dokumenLelang && (
        (formData.dokumenLelang.dokumenTender?.length || 0) > 0 ||
        (formData.dokumenLelang.dokumenAdministrasi?.length || 0) > 0 ||
        (formData.dokumenLelang.dokumenTeknis?.length || 0) > 0 ||
        (formData.dokumenLelang.dokumenPenawaran?.length || 0) > 0
    );
    const hasNonLelangDocs = formData.tenderType === 'non-tender' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0;

    // Migrate legacy string[] to DokumenEntry[] if needed
    const dokumenKontrak: DokumenEntry[] = (() => {
        if (formData.dokumenKontrak && formData.dokumenKontrak.length > 0) {
            return formData.dokumenKontrak;
        }
        const now = new Date();
        const spk: DokumenEntry[] = (formData.dokumenSPK || []).map((nama, i) => ({
            id: `spk-legacy-${i}`,
            nama,
            kategori: 'SPK',
            note: '',
            tanggalUpload: now,
        }));
        const inv: DokumenEntry[] = (formData.dokumenInvoice || []).map((nama, i) => ({
            id: `inv-legacy-${i}`,
            nama,
            kategori: 'Invoice',
            note: '',
            tanggalUpload: now,
        }));
        return [...spk, ...inv];
    })();

    // ─── Helper: render read-only Lelang/NonLelang table ──────────────────
    const renderDocTable = (
        title: string,
        docs: string[],
        color: { bg: string; icon: string; header: string }
    ) => (
        <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className={`p-1.5 sm:p-2 ${color.bg} rounded-lg`}>
                    <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${color.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{title}</h4>
                    <p className="text-xs text-gray-500">{docs.length} dokumen</p>
                </div>
                <Badge variant="secondary" className="ml-auto flex-shrink-0">{docs.length}</Badge>
            </div>
            <div className="rounded-lg border overflow-x-auto">
                <table className="w-full min-w-[400px]">
                    <thead className={color.header}>
                        <tr>
                            <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-10">#</th>
                            <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                            <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16">Unduh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {docs.map((doc, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="p-2 sm:p-3 text-xs text-gray-500">{idx + 1}</td>
                                <td className="p-2 sm:p-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className={`h-3.5 w-3.5 ${color.icon} flex-shrink-0`} />
                                        <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                    </div>
                                </td>
                                <td className="p-2 sm:p-3 text-center">
                                    <Button
                                        type="button" variant="ghost" size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleDownloadDokumen(doc)}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // ─── Handler upload dokumen kontrak ────────────────────────────────────
    const handleUploadDokumen = (files: FileList) => {
        const newEntries: DokumenEntry[] = Array.from(files).map((file) => ({
            id: `dok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nama: `uploads/kontrak/${Date.now()}_${file.name}`,
            kategori: newKategori,
            note: newNote.trim(),
            tanggalUpload: new Date(),
        }));
        setFormData({
            ...formData,
            dokumenKontrak: [...dokumenKontrak, ...newEntries],
        });
        setNewNote('');
        toast.success(`${files.length} dokumen berhasil ditambahkan`);
    };

    const handleRemoveDokumen = (id: string) => {
        setFormData({
            ...formData,
            dokumenKontrak: dokumenKontrak.filter((d) => d.id !== id),
        });
        toast.success('Dokumen dihapus');
    };

    return (
        <TabsContent value="dokumen" className="space-y-6 px-3 sm:px-6 py-4 w-full overflow-x-hidden">

            {/* ── Dokumen Sumber (Lelang / Non-Lelang) ── */}
            {(hasLelangDocs || hasNonLelangDocs) && (
                <div className="space-y-6">
                    {hasLelangDocs && formData.dokumenLelang && (
                        <>
                            {formData.dokumenLelang.dokumenTender && formData.dokumenLelang.dokumenTender.length > 0 &&
                                renderDocTable('Dokumen Tender', formData.dokumenLelang.dokumenTender, { bg: 'bg-[#D4E4F0]', icon: 'text-[#2F5F8C]', header: 'bg-[#E8F0F7]' })}
                            {formData.dokumenLelang.dokumenAdministrasi && formData.dokumenLelang.dokumenAdministrasi.length > 0 &&
                                renderDocTable('Dokumen Administrasi', formData.dokumenLelang.dokumenAdministrasi, { bg: 'bg-[#D8E9D5]', icon: 'text-[#416F39]', header: 'bg-[#E8F2E6]' })}
                            {formData.dokumenLelang.dokumenTeknis && formData.dokumenLelang.dokumenTeknis.length > 0 &&
                                renderDocTable('Dokumen Teknis', formData.dokumenLelang.dokumenTeknis, { bg: 'bg-[#FFE8D1]', icon: 'text-[#A67039]', header: 'bg-[#FFF3E8]' })}
                            {formData.dokumenLelang.dokumenPenawaran && formData.dokumenLelang.dokumenPenawaran.length > 0 &&
                                renderDocTable('Dokumen Penawaran', formData.dokumenLelang.dokumenPenawaran, { bg: 'bg-[#E8D9F0]', icon: 'text-[#6F5485]', header: 'bg-[#F3EBF7]' })}
                        </>
                    )}
                    {hasNonLelangDocs && formData.dokumenNonLelang &&
                        renderDocTable('Dokumen Proyek', formData.dokumenNonLelang, { bg: 'bg-[#D4E4F0]', icon: 'text-[#2F5F8C]', header: 'bg-[#E8F0F7]' })}
                    <div className="border-t" />
                </div>
            )}

            {/* ── Dokumen Kontrak (SPK, Invoice, Lainnya) — tabel gabungan ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                        <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900">Dokumen Kontrak</h4>
                        <p className="text-xs text-gray-500">SPK, Invoice, dan dokumen lainnya</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">{dokumenKontrak.length}</Badge>
                </div>

                {/* Panel upload (hanya saat edit) */}
                {!viewMode && (
                    <div className="border rounded-lg p-3 sm:p-4 bg-muted/30 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Upload Dokumen Baru</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Kategori</Label>
                                <Select
                                    value={newKategori}
                                    onValueChange={(v) => setNewKategori(v as DokumenEntry['kategori'])}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SPK">SPK</SelectItem>
                                        <SelectItem value="Invoice">Invoice</SelectItem>
                                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <Label className="text-xs">Keterangan / Note</Label>
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Tulis keterangan dokumen..."
                                    rows={1}
                                    className="resize-none text-sm h-9 min-h-[36px]"
                                />
                            </div>
                        </div>
                        <div>
                            <Input
                                id="arsip-dokumen-kontrak-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleUploadDokumen(e.target.files);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto border-dashed hover:border-solid"
                                onClick={() => document.getElementById('arsip-dokumen-kontrak-upload')?.click()}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Pilih File & Upload
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tabel gabungan */}
                {dokumenKontrak.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">Belum ada dokumen kontrak</p>
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full min-w-[560px]">
                            <thead className="bg-muted/60">
                                <tr>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-10">#</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-24">Kategori</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama File</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm min-w-[140px]">Keterangan</th>
                                    <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm min-w-[100px]">Tgl Upload</th>
                                    <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dokumenKontrak.map((doc, idx) => (
                                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-2 sm:p-3 text-xs text-muted-foreground">{idx + 1}</td>
                                        <td className="p-2 sm:p-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${kategoriColor[doc.kategori]}`}>
                                                {doc.kategori}
                                            </span>
                                        </td>
                                        <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium truncate max-w-[180px]">
                                                    {doc.nama.split('/').pop()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-2 sm:p-3 text-xs text-muted-foreground">
                                            {doc.note || <span className="italic opacity-50">—</span>}
                                        </td>
                                        <td className="p-2 sm:p-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(new Date(doc.tanggalUpload))}
                                        </td>
                                        <td className="p-2 sm:p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    type="button" variant="ghost" size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleDownloadDokumen(doc.nama.split('/').pop()!)}
                                                    title="Download"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                {!viewMode && (
                                                    <Button
                                                        type="button" variant="ghost" size="sm"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => handleRemoveDokumen(doc.id)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── AOI File ── */}
            <div className="border-t pt-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="p-1.5 sm:p-2 bg-[#E3F2FD] rounded-lg">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#1976D2]" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900">Area of Interest (AOI)</h4>
                        <p className="text-xs text-gray-500">{formData.aoiFile ? 'File AOI terupload' : 'Belum ada file AOI'}</p>
                    </div>
                    {formData.aoiFile && <Badge variant="secondary">✓</Badge>}
                </div>

                {!formData.aoiFile ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-lg bg-gray-50">
                        <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 mb-3">Belum ada file AOI (GeoJSON/KML/Shapefile)</p>
                        {!viewMode && (
                            <>
                                <Input
                                    id="arsip-aoi-upload"
                                    type="file"
                                    accept=".geojson,.json,.kml,.shp,.zip"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFormData({ ...formData, aoiFile: `uploads/aoi/${Date.now()}_${file.name}` });
                                            toast.success('File AOI berhasil diupload');
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Button type="button" variant="outline"
                                    onClick={() => document.getElementById('arsip-aoi-upload')?.click()}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload AOI
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full min-w-[400px]">
                            <thead className="bg-[#E3F2FD]">
                                <tr>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama File</th>
                                    <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-50">
                                    <td className="p-2 sm:p-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-[#1976D2] flex-shrink-0" />
                                            <span className="text-xs sm:text-sm font-medium truncate">{formData.aoiFile.split('/').pop()}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 sm:p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                onClick={() => handleDownloadDokumen(formData.aoiFile!.split('/').pop()!)}>
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            {!viewMode && (
                                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                    onClick={() => { setFormData({ ...formData, aoiFile: undefined }); toast.success('File AOI dihapus'); }}>
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {!viewMode && (
                            <div className="p-2 border-t">
                                <Input id="arsip-aoi-reupload" type="file" accept=".geojson,.json,.kml,.shp,.zip"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setFormData({ ...formData, aoiFile: `uploads/aoi/${Date.now()}_${file.name}` });
                                            toast.success('File AOI berhasil diupdate');
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Button type="button" variant="outline" size="sm"
                                    className="w-full border-dashed hover:border-solid"
                                    onClick={() => document.getElementById('arsip-aoi-reupload')?.click()}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Ganti File AOI
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TabsContent>
    );
}
