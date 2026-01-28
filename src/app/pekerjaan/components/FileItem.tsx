import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon } from './FileIcon';

interface FileItemProps {
  file: string;
  onDownload?: (file: string) => void;
  onRemove?: (file: string) => void;
  viewMode?: boolean;
}

export function FileItem({ file, onDownload, onRemove, viewMode = false }: FileItemProps) {
  const fileName = file.split('/').pop() || '';

  return (
    <div className="group flex items-center justify-between gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileIcon fileName={fileName} className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 truncate">
          {fileName}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {onDownload && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDownload(file)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5 text-[#2F5F8C]" />
          </Button>
        )}
        {!viewMode && onRemove && (
          <button
            type="button"
            className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(file)}
            title="Hapus"
          >
            <X className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
          </button>
        )}
      </div>
    </div>
  );
}
