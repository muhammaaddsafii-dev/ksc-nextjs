import { FileText, FileImage, FileSpreadsheet, File } from 'lucide-react';

interface FileIconProps {
    fileName: string;
    className?: string;
}

export function FileIcon({ fileName, className = "h-4 w-4" }: FileIconProps) {
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
            return <FileImage className={`${className} text-green-600`} />;
        case 'pdf':
            return <FileText className={`${className} text-red-600`} />;
        case 'xlsx':
        case 'xls':
        case 'csv':
            return <FileSpreadsheet className={`${className} text-emerald-600`} />;
        case 'doc':
        case 'docx':
            return <FileText className={`${className} text-blue-600`} />;
        case 'dwg':
        case 'dxf':
            return <File className={`${className} text-purple-600`} />;
        default:
            return <FileText className={`${className} text-gray-600`} />;
    }
}
