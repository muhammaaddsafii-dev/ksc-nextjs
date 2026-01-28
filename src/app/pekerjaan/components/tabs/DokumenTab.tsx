import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FormData } from '../../hooks/useFormManagement';
import { toast } from 'sonner';

interface DokumenTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
}

export function DokumenTab({ formData, setFormData, viewMode }: DokumenTabProps) {
  const hasLelangDocs = formData.sourceType === 'lelang' && formData.dokumenLelang && (
    (formData.dokumenLelang.dokumenTender?.length || 0) > 0 ||
    (formData.dokumenLelang.dokumenAdministrasi?.length || 0) > 0 ||
    (formData.dokumenLelang.dokumenTeknis?.length || 0) > 0 ||
    (formData.dokumenLelang.dokumenPenawaran?.length || 0) > 0
  );
  const hasNonLelangDocs = formData.sourceType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0;
  const hasSPKDocs = formData.dokumenSPK && formData.dokumenSPK.length > 0;
  const hasInvoiceDocs = formData.dokumenInvoice && formData.dokumenInvoice.length > 0;
  const hasDocs = hasLelangDocs || hasNonLelangDocs || hasSPKDocs || hasInvoiceDocs;

  const renderDocTable = (
    title: string,
    docs: string[],
    color: { bg: string; icon: string; header: string },
    onUpload?: (files: FileList) => void,
    onRemove?: (idx: number) => void
  ) => (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-3">
        <div className={`p-1.5 sm:p-2 ${color.bg} rounded-lg`}>
          <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${color.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm sm:text-base text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 truncate">
            {docs.length > 0 ? `${docs.length} dokumen` : 'Belum ada dokumen'}
          </p>
        </div>
        {docs.length > 0 && (
          <Badge variant="secondary" className="ml-auto flex-shrink-0">
            {docs.length}
          </Badge>
        )}
      </div>
      {docs.length === 0 && !viewMode && onUpload ? (
        <div className="p-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-500 mb-4">Belum ada {title}</p>
          <Input
            id={`${title.replace(/\s/g, '-')}-upload-initial`}
            type="file"
            multiple
            onChange={(e) => e.target.files && onUpload(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`${title.replace(/\s/g, '-')}-upload-initial`)?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload {title}
          </Button>
        </div>
      ) : docs.length > 0 ? (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className={color.header}>
                <tr>
                  <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                  <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                  <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {docs.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <FileText className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${color.icon} flex-shrink-0`} />
                        <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          onClick={() => toast.success(`Mengunduh: ${doc}`)}
                        >
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        {!viewMode && onRemove && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => onRemove(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!viewMode && onUpload && (
            <div className="mt-3">
              <Input
                id={`${title.replace(/\s/g, '-')}-upload`}
                type="file"
                multiple
                onChange={(e) => e.target.files && onUpload(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed hover:border-solid"
                onClick={() => document.getElementById(`${title.replace(/\s/g, '-')}-upload`)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {title}
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );

  return (
    <TabsContent value="dokumen" className="space-y-6 px-4 sm:px-6 py-4">
      {!hasDocs ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Dokumen</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {formData.sourceType === 'manual'
                  ? 'Pekerjaan ini dibuat manual tanpa dokumen referensi'
                  : 'Belum ada dokumen yang tersedia untuk proyek ini'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dokumen Lelang */}
          {formData.sourceType === 'lelang' && formData.dokumenLelang && (
            <>
              {formData.dokumenLelang.dokumenTender && formData.dokumenLelang.dokumenTender.length > 0 &&
                renderDocTable('Dokumen Tender', formData.dokumenLelang.dokumenTender, {
                  bg: 'bg-[#D4E4F0]',
                  icon: 'text-[#2F5F8C]',
                  header: 'bg-[#E8F0F7]'
                })}

              {formData.dokumenLelang.dokumenAdministrasi && formData.dokumenLelang.dokumenAdministrasi.length > 0 &&
                renderDocTable('Dokumen Administrasi', formData.dokumenLelang.dokumenAdministrasi, {
                  bg: 'bg-[#D8E9D5]',
                  icon: 'text-[#416F39]',
                  header: 'bg-[#E8F2E6]'
                })}

              {formData.dokumenLelang.dokumenTeknis && formData.dokumenLelang.dokumenTeknis.length > 0 &&
                renderDocTable('Dokumen Teknis', formData.dokumenLelang.dokumenTeknis, {
                  bg: 'bg-[#FFE8D1]',
                  icon: 'text-[#A67039]',
                  header: 'bg-[#FFF3E8]'
                })}

              {formData.dokumenLelang.dokumenPenawaran && formData.dokumenLelang.dokumenPenawaran.length > 0 &&
                renderDocTable('Dokumen Penawaran', formData.dokumenLelang.dokumenPenawaran, {
                  bg: 'bg-[#E8D9F0]',
                  icon: 'text-[#6F5485]',
                  header: 'bg-[#F3EBF7]'
                })}
            </>
          )}

          {/* Dokumen Non-Lelang */}
          {formData.sourceType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0 &&
            renderDocTable('Dokumen Proyek', formData.dokumenNonLelang, {
              bg: 'bg-[#D4E4F0]',
              icon: 'text-[#2F5F8C]',
              header: 'bg-[#E8F0F7]'
            })}

          {/* Dokumen SPK */}
          {renderDocTable(
            'Dokumen SPK',
            formData.dokumenSPK || [],
            {
              bg: 'bg-[#FFF4E6]',
              icon: 'text-[#C88B4A]',
              header: 'bg-[#FFF9F0]'
            },
            (files) => {
              const fileNames = Array.from(files).map(file => `uploads/spk/${Date.now()}_${file.name}`);
              setFormData({
                ...formData,
                dokumenSPK: [...(formData.dokumenSPK || []), ...fileNames]
              });
              toast.success(`${files.length} file SPK ditambahkan`);
            },
            (idx) => {
              setFormData({
                ...formData,
                dokumenSPK: formData.dokumenSPK?.filter((_, i) => i !== idx) || []
              });
              toast.success('Dokumen SPK dihapus');
            }
          )}

          {/* Dokumen Invoice */}
          {renderDocTable(
            'Dokumen Invoice',
            formData.dokumenInvoice || [],
            {
              bg: 'bg-[#E8F5E9]',
              icon: 'text-[#4CAF50]',
              header: 'bg-[#F1F8F4]'
            },
            (files) => {
              const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
              setFormData({
                ...formData,
                dokumenInvoice: [...(formData.dokumenInvoice || []), ...fileNames]
              });
              toast.success(`${files.length} file Invoice ditambahkan`);
            },
            (idx) => {
              setFormData({
                ...formData,
                dokumenInvoice: formData.dokumenInvoice?.filter((_, i) => i !== idx) || []
              });
              toast.success('Dokumen Invoice dihapus');
            }
          )}
        </div>
      )}
    </TabsContent>
  );
}
