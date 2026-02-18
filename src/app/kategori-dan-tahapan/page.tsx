'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, ListChecks, Building } from 'lucide-react';
import { mockJenisPekerjaan, mockTahapanTemplate } from '@/mocks/data';
import { JenisPekerjaan, TahapanTemplate } from '@/types';
import { JenisPekerjaanTab } from './components/JenisPekerjaanTab';
import { PerusahaanTab } from './components/PerusahaanTab';
import { TahapanTemplateTab } from './components/TahapanTemplateTab';

export default function KategoriDanTahapanPage() {
  // State for shared data
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<JenisPekerjaan[]>(mockJenisPekerjaan);
  const [tahapanTemplateList, setTahapanTemplateList] = useState<TahapanTemplate[]>(mockTahapanTemplate);
  const [activeTab, setActiveTab] = useState("jenis");

  const getTahapanCountByJenis = (jenisId: string) => {
    return tahapanTemplateList.filter(t => t.jenisPekerjaanId === jenisId).length;
  };

  return (
    <MainLayout title="Kategori & Tahapan Pekerjaan">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full">
            <TabsList className="h-auto w-full flex flex-wrap justify-start gap-2 bg-muted/50 p-1.5 rounded-lg">
              <TabsTrigger
                value="perusahaan"
                className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Building className="h-4 w-4 mr-2" />
                Input Perusahaan
              </TabsTrigger>
              <TabsTrigger
                value="jenis"
                className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Jenis Pekerjaan
              </TabsTrigger>
              <TabsTrigger
                value="tahapan"
                className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Template Tahapan
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="jenis" className="space-y-4 mt-0">
            <JenisPekerjaanTab
              jenisPekerjaanList={jenisPekerjaanList}
              setJenisPekerjaanList={setJenisPekerjaanList}
              setTahapanTemplateList={setTahapanTemplateList}
              getTahapanCountByJenis={getTahapanCountByJenis}
            />
          </TabsContent>

          <TabsContent value="perusahaan" className="space-y-4 mt-0">
            <PerusahaanTab />
          </TabsContent>

          <TabsContent value="tahapan" className="space-y-4 mt-0">
            <TahapanTemplateTab
              tahapanTemplateList={tahapanTemplateList}
              setTahapanTemplateList={setTahapanTemplateList}
              jenisPekerjaanList={jenisPekerjaanList}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
