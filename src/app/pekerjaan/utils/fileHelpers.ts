/**
 * Get file icon class name based on file extension
 */
export function getFileIconClass(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'text-green-600';
    case 'pdf':
      return 'text-red-600';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'text-emerald-600';
    case 'doc':
    case 'docx':
      return 'text-blue-600';
    case 'dwg':
    case 'dxf':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}
