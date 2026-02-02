import { TabsContent } from '@/components/ui/tabs';
import { Users, CheckCircle2, Circle } from 'lucide-react';
import { ArsipPekerjaan, TahapanKerja, AnggaranItem } from '@/types';

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
                        {formData.tim && formData.tim.length > 0
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
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {tenagaAhliList.map((ta) => {
                            const isSelected = formData.tim?.includes(ta.id);
                            return (
                                <div
                                    key={ta.id}
                                    className={`border rounded-lg p-3 space-y-3 ${isSelected ? "bg-blue-50/50 border-blue-200" : "bg-white"
                                        } ${!viewMode ? "cursor-pointer active:bg-gray-50" : ""}`}
                                    onClick={() => {
                                        if (viewMode) return;
                                        setFormData({
                                            ...formData,
                                            tim: isSelected
                                                ? formData.tim?.filter((id) => id !== ta.id) || []
                                                : [...(formData.tim || []), ta.id],
                                        });
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            {!viewMode && (
                                                <div className="mt-0.5">
                                                    {isSelected ? (
                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{ta.nama}</p>
                                                <p className="text-xs text-muted-foreground">{ta.jabatan}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500">Keahlian:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {ta.keahlian &&
                                                ta.keahlian.slice(0, 3).map((skill: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-0.5 rounded-full border bg-white"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            {ta.keahlian && ta.keahlian.length > 3 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full border bg-white">
                                                    +{ta.keahlian.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {ta.sertifikat && ta.sertifikat.length > 0 && (
                                        <div className="pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                                            <span>Sertifikat:</span>
                                            <span className="font-medium text-gray-700">{ta.sertifikat.length} sertifikat</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {!viewMode && <th className="w-12 p-3"></th>}
                                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Nama Lengkap</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Jabatan</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Keahlian</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Sertifikat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tenagaAhliList.map((ta) => {
                                    const isSelected = formData.tim?.includes(ta.id);
                                    return (
                                        <tr
                                            key={ta.id}
                                            className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/30" : ""
                                                } ${!viewMode ? "cursor-pointer" : ""}`}
                                            onClick={() => {
                                                if (viewMode) return;
                                                setFormData({
                                                    ...formData,
                                                    tim: isSelected
                                                        ? formData.tim?.filter((id) => id !== ta.id) || []
                                                        : [...(formData.tim || []), ta.id],
                                                });
                                            }}
                                        >
                                            {!viewMode && (
                                                <td className="p-3 text-center">
                                                    {isSelected ? (
                                                        <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground mx-auto" />
                                                    )}
                                                </td>
                                            )}
                                            <td className="p-3">
                                                <div className="font-medium text-sm text-gray-900">{ta.nama}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-sm text-gray-500">{ta.jabatan}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {ta.keahlian &&
                                                        ta.keahlian.slice(0, 2).map((skill: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs px-2 py-0.5 rounded-full border bg-white text-gray-600"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    {ta.keahlian && ta.keahlian.length > 2 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-white text-gray-600">
                                                            +{ta.keahlian.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-500">
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
                </>
            )}
        </TabsContent>
    );
}
