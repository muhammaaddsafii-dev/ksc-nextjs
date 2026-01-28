import { TabsContent } from '@/components/ui/tabs';
import { Users, CheckCircle2, Circle } from 'lucide-react';
import { FormData } from '../../hooks/useFormManagement';

interface TimTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  viewMode: boolean;
  tenagaAhliList: any[];
}

export function TimTab({ formData, setFormData, viewMode, tenagaAhliList }: TimTabProps) {
  return (
    <TabsContent value="tim" className="space-y-3 px-4 sm:px-6 py-4">
      <h3 className="font-semibold text-sm border-b pb-2">Tim Proyek</h3>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {formData.tim.length > 0
              ? `${formData.tim.length} tenaga ahli terpilih`
              : "Pilih tenaga ahli untuk proyek ini"}
          </p>
        </div>
      </div>

      {tenagaAhliList.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg">
          Belum ada data tenaga ahli
        </div>
      ) : (
        <div className="border rounded-lg max-h-[350px] overflow-x-auto overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                {!viewMode && (
                  <th className="text-center p-3 text-sm font-medium w-12"></th>
                )}
                <th className="text-left p-3 text-sm font-medium">Nama</th>
                <th className="text-left p-3 text-sm font-medium">Jabatan</th>
                <th className="text-left p-3 text-sm font-medium">Keahlian</th>
                <th className="text-left p-3 text-sm font-medium">Sertifikat</th>
              </tr>
            </thead>

            <tbody>
              {tenagaAhliList.map((ta) => {
                const isSelected = formData.tim.includes(ta.id);

                return (
                  <tr
                    key={ta.id}
                    className={`border-t hover:bg-muted/50 ${isSelected ? "bg-blue-50/50" : ""
                      } ${!viewMode ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (viewMode) return;
                      setFormData({
                        ...formData,
                        tim: isSelected
                          ? formData.tim.filter((id) => id !== ta.id)
                          : [...formData.tim, ta.id],
                      });
                    }}
                  >
                    {!viewMode && (
                      <td className="p-3 text-center">
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                    )}

                    <td className="p-3 text-sm font-medium">{ta.nama}</td>

                    <td className="p-3 text-sm">{ta.jabatan}</td>

                    <td className="p-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {ta.keahlian &&
                          ta.keahlian.slice(0, 2).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full border"
                            >
                              {skill}
                            </span>
                          ))}
                        {ta.keahlian && ta.keahlian.length > 2 && (
                          <span className="text-xs px-2 py-0.5 rounded-full border">
                            +{ta.keahlian.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {ta.sertifikat && ta.sertifikat.length > 0
                        ? `${ta.sertifikat.length} sertifikat`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TabsContent>
  );
}
