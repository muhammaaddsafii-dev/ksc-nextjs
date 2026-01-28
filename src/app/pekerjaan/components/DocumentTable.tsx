import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon } from './FileIcon';

interface DocumentTableProps {
  documents: string[];
  title: string;
  description?: string;
  bgColor?: string;
  onDownload: (doc: string) => void;
}

export function DocumentTable({
  documents,
  title,
  description,
  bgColor = 'bg-[#E8F0F7]',
  onDownload,
}: DocumentTableProps) {
  if (documents.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm sm:text-base text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className={bgColor}>
            <tr>
              <th className="p-3 text-left font-semibold text-sm w-12">#</th>
              <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
              <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((doc, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                <td className="p-2 sm:p-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FileIcon fileName={doc} className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                  </div>
                </td>
                <td className="p-2 sm:p-3 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    onClick={() => onDownload(doc)}
                  >
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
