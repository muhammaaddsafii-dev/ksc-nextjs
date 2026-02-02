import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle2, Circle, Edit, Trash2, X, Upload, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { ArsipPekerjaan, TahapanKerja, AnggaranItem } from '@/types';
// import { FormData } from '../../hooks/useFormManagement'; // adapted locally
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';
import { FileIcon } from '../FileIcon';

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
    dokumenSPK?: string[];
    dokumenInvoice?: string[];
    aoiFile?: string;
};

interface AnggaranTabProps {
    formData: FormData;
    // setFormData: (data: FormData) => void;
    // viewMode: boolean;
    handleDownloadDokumen: (fileName: string) => void;
}

export function AnggaranTab({
    formData,
    handleDownloadDokumen
}: AnggaranTabProps) {
    return (
        <TabsContent value="anggaran" className="space-y-4 px-4 sm:px-6 py-4">
            {/* Tampilan anggaran dalam format tabel dikelompokkan per tahapan */}
            <div className="space-y-6">
                {!formData.tahapan || formData.tahapan.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500 italic">Belum ada data tahapan</p>
                    </div>
                ) : (
                    formData.tahapan.map((tahapan) => {
                        const anggaranTahapan = formData.anggaran?.filter(a => a.tahapanId === tahapan.id) || [];
                        const totalTahapan = anggaranTahapan.reduce((sum, a) => sum + a.jumlah, 0);
                        const realisasiTahapan = anggaranTahapan.reduce((sum, a) => sum + a.realisasi, 0);

                        return (
                            <div key={tahapan.id} className="space-y-3">
                                {/* Header Tahapan */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{tahapan.nama}</h3>
                                                <StatusBadge status={tahapan.status} />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {anggaranTahapan.length} item anggaran
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            <span className="font-semibold">Total:</span> {formatCurrency(totalTahapan)}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            <span className="font-semibold">Realisasi:</span> {formatCurrency(realisasiTahapan)}
                                        </div>
                                    </div>
                                </div>

                                {/* Responsive Card/Table View */}
                                {anggaranTahapan.length === 0 ? (
                                    <div className="p-8 text-center border rounded-lg bg-gray-50">
                                        <p className="text-sm text-gray-500 italic">Belum ada anggaran untuk tahapan ini</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-3">
                                            {anggaranTahapan.map((a) => {
                                                return (
                                                    <div key={a.id} className="border rounded-lg p-3 bg-white space-y-3 shadow-sm">
                                                        {/* Header: Kategori */}
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0 mr-2">
                                                                <h4 className="font-semibold text-gray-900 truncate">{a.kategori}</h4>
                                                            </div>
                                                        </div>

                                                        {/* Deskripsi */}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Deskripsi</p>
                                                            <p className="text-sm text-gray-700">{a.deskripsi}</p>
                                                        </div>

                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-2 gap-3 py-2 border-t border-b bg-gray-50/50 rounded-md px-2">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Anggaran</p>
                                                                <p className="font-medium text-sm">{formatCurrency(a.jumlah)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Realisasi</p>
                                                                <p className="font-medium text-sm text-emerald-600">{formatCurrency(a.realisasi)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Files */}
                                                        {a.files && a.files.length > 0 && (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    Dokumen ({a.files.length})
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {a.files.map((file, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs border border-gray-100">
                                                                            <FileIcon fileName={file} className="h-3.5 w-3.5 flex-shrink-0" />
                                                                            <span className="truncate flex-1 text-gray-600">{file.split('/').pop()}</span>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-blue-600 hover:text-blue-700"
                                                                                onClick={() => handleDownloadDokumen(file)}
                                                                            >
                                                                                <Download className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block rounded-lg border overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-3 text-left font-semibold text-xs sm:text-sm w-12 text-gray-600">#</th>
                                                        <th className="p-3 text-left font-semibold text-xs sm:text-sm text-gray-600">Kategori</th>
                                                        <th className="p-3 text-left font-semibold text-xs sm:text-sm text-gray-600">Deskripsi</th>
                                                        <th className="p-3 text-right font-semibold text-xs sm:text-sm w-32 text-gray-600">Anggaran</th>
                                                        <th className="p-3 text-right font-semibold text-xs sm:text-sm w-32 text-gray-600">Realisasi</th>
                                                        <th className="p-3 text-center font-semibold text-xs sm:text-sm w-40 text-gray-600">Dokumen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {anggaranTahapan.map((a, idx) => {
                                                        return (
                                                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                                                <td className="p-3">
                                                                    <span className="text-sm font-medium text-gray-900">{a.kategori}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-sm text-gray-600">{a.deskripsi}</span>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <span className="text-sm font-medium text-gray-900">{formatCurrency(a.jumlah)}</span>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <span className="text-sm font-medium text-emerald-600">{formatCurrency(a.realisasi)}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                                        {a.files && a.files.length > 0 ? (
                                                                            a.files.map((file, fIdx) => (
                                                                                <Button
                                                                                    key={fIdx}
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-7 px-2 text-xs flex items-center gap-1.5"
                                                                                    onClick={() => handleDownloadDokumen(file)}
                                                                                    title={file.split('/').pop()}
                                                                                >
                                                                                    <FileIcon fileName={file} className="h-3.5 w-3.5" />
                                                                                    <span className="max-w-[80px] truncate hidden xl:inline">
                                                                                        {file.split('/').pop()}
                                                                                    </span>
                                                                                </Button>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400">-</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </TabsContent>
    );
}
