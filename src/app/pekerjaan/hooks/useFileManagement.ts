import { toast } from 'sonner';

export function useFileManagement() {
  // Handle file upload untuk tahapan
  const handleTahapanFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    currentFiles: string[] = [],
    onFilesUpdate: (files: string[]) => void
  ) => {
    const files = e.target.files;
    if (!files) return;

    // Simulasi upload - dalam production, upload ke server/storage
    const fileNames = Array.from(files).map(file => {
      return `uploads/tahapan/${Date.now()}_${file.name}`;
    });

    onFilesUpdate([...currentFiles, ...fileNames]);
    toast.success(`${files.length} file ditambahkan`);
  };

  // Handle file upload untuk anggaran
  const handleAnggaranFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    currentFiles: string[] = [],
    onFilesUpdate: (files: string[]) => void
  ) => {
    const files = e.target.files;
    if (!files) return;

    // Simulasi upload - dalam production, upload ke server/storage
    const fileNames = Array.from(files).map(file => {
      return `uploads/anggaran/${Date.now()}_${file.name}`;
    });

    onFilesUpdate([...currentFiles, ...fileNames]);
    toast.success(`${files.length} file ditambahkan`);
  };

  // Handle download file
  const handleDownloadFile = (filePath: string) => {
    if (filePath.startsWith('http')) {
      window.open(filePath, '_blank');
      return;
    }
    const fileName = filePath.split('/').pop()?.split('?')[0] || 'document';
    toast.info(`File ${fileName} belum tersedia untuk diunduh.`);
  };

  // Remove file
  const handleRemoveFile = (
    fileName: string,
    currentFiles: string[],
    onFilesUpdate: (files: string[]) => void
  ) => {
    const updatedFiles = currentFiles.filter(f => f !== fileName);
    onFilesUpdate(updatedFiles);
  };

  return {
    handleTahapanFileUpload,
    handleAnggaranFileUpload,
    handleDownloadFile,
    handleRemoveFile,
  };
}
