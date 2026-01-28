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
    // Extract filename dari path
    const fileName = filePath.split('/').pop() || 'document';

    // Dalam production, ini akan download file dari server
    // Untuk sekarang, kita simulasikan dengan membuat link download

    // Simulasi: Buat dummy blob untuk demo
    const dummyContent = `Ini adalah file: ${fileName}\n\nFile ini merupakan dokumen bukti yang diupload.\n\nDalam production, file ini akan diambil dari server storage.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Buat link download temporary
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Mengunduh: ${fileName}`);
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
