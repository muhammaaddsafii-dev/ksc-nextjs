"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pekerjaan, TahapanKerja, JenisPekerjaan } from '@/types';
import { dokumenTahapanService } from '@/services/pekerjaan.service';
import { jenisPekerjaanService, mapJenisPekerjaan } from '@/services/jenisPekerjaan.service';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { usePerusahaanStore } from '@/stores/perusahaanStore';
import { useFormManagement, useTahapanManagement, useFileManagement, initialFormData } from '@/app/pekerjaan/hooks';
import { transformToFormData } from '@/app/pekerjaan/utils/transformers';
import { InfoTab, DokumenTab, TimTab, TahapanTab } from '@/app/pekerjaan/components/tabs';

interface PekerjaanViewModalProps {
  item: Pekerjaan | null;
  open: boolean;
  onClose: () => void;
}

export function PekerjaanViewModal({ item, open, onClose }: PekerjaanViewModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  type TahapanDocEntry = { name: string; file?: File; signedUrl?: string };
  const [tahapanDocsMap, setTahapanDocsMap] = useState<Record<string, TahapanDocEntry[]>>({});

  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: perusahaanList, fetchItems: fetchPerusahaan } = usePerusahaanStore();
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<JenisPekerjaan[]>([]);

  useEffect(() => {
    if (tenagaAhliList.length === 0) fetchTenagaAhli();
    if (perusahaanList.length === 0) fetchPerusahaan();
    jenisPekerjaanService.getAll().then((raw) => setJenisPekerjaanList(raw.map(mapJenisPekerjaan)));
  }, []);
  const { formData, setFormData, newTahapan, setNewTahapan, resetForm } = useFormManagement({ initialData: initialFormData });

  const tahapanManagement = useTahapanManagement({
    tahapan: formData.tahapan,
    onUpdate: () => {},
  });

  const fileManagement = useFileManagement();

  const loadTahapanDocs = async (tahapanList: TahapanKerja[]) => {
    const newMap: Record<string, TahapanDocEntry[]> = {};
    await Promise.all(
      tahapanList.map(async (t) => {
        if (!t.id || !t.id.includes('-')) return;
        try {
          const docs = await dokumenTahapanService.getByTahapan(t.id);
          if (docs.length > 0) {
            newMap[t.id] = docs.map((d) => ({
              name: d.nama,
              signedUrl: d.signed_file_url || undefined,
            }));
          }
        } catch {
          // ignore per-tahapan errors
        }
      })
    );
    setTahapanDocsMap(newMap);
    setFormData((prev) => ({
      ...prev,
      tahapan: prev.tahapan.map((t) => ({
        ...t,
        files: newMap[t.id] ? newMap[t.id].map((e) => e.signedUrl || e.name) : (t.files || []),
      })),
    }));
  };

  useEffect(() => {
    if (item && open) {
      setFormData(transformToFormData(item));
      setActiveTab('info');
      setTahapanDocsMap({});
      loadTahapanDocs(item.tahapan);
    } else if (!open) {
      resetForm();
      setTahapanDocsMap({});
    }
  }, [item?.id, open]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onClose()}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">Detail Pekerjaan</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs */}
          <div className="hidden lg:block px-4 sm:px-6 border-b">
            <TabsList className="w-full grid grid-cols-4 gap-1 bg-transparent h-auto p-0">
              {[
                { value: 'info', label: 'Informasi' },
                { value: 'dokumen', label: 'Dokumen' },
                { value: 'tim', label: 'Tim' },
                { value: 'tahapan', label: 'Tahapan' },
              ].map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Mobile dropdown */}
          <div className="lg:hidden px-4 sm:px-6 py-3 border-b bg-muted/30">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Navigasi</Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-11 bg-background">
                <SelectValue>
                  {activeTab === 'info' ? 'Informasi'
                    : activeTab === 'dokumen' ? 'Dokumen'
                    : activeTab === 'tim' ? 'Tim'
                    : 'Tahapan'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informasi</SelectItem>
                <SelectItem value="dokumen">Dokumen</SelectItem>
                <SelectItem value="tim">Tim</SelectItem>
                <SelectItem value="tahapan">Tahapan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <InfoTab
            formData={formData}
            setFormData={setFormData}
            viewMode={true}
            selectedItem={item}
            tenderList={[]}
            nonTenderList={[]}
            perusahaanList={perusahaanList}
            jenisPekerjaanList={jenisPekerjaanList}
            onLoadFromSource={() => {}}
          />

          <DokumenTab
            formData={formData}
            viewMode={true}
            pekerjaanId={item.id}
          />

          <TimTab
            formData={formData}
            setFormData={setFormData}
            viewMode={true}
            tenagaAhliList={tenagaAhliList}
          />

          <TahapanTab
            formData={formData}
            setFormData={setFormData}
            viewMode={true}
            newTahapan={newTahapan}
            setNewTahapan={setNewTahapan}
            tahapanManagement={tahapanManagement}
            fileManagement={fileManagement}
            handleAddTahapan={() => {}}
            handleTahapanFileUpload={() => {}}
            handleExistingTahapanFileUpload={() => {}}
            removeTahapanFile={() => {}}
            removeExistingTahapanFile={() => {}}
            onInvoiceFileUpload={() => {}}
            onAdendumFileUpload={() => {}}
            jenisPekerjaanList={[]}
            tahapanTemplateList={[]}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
