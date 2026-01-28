import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploadButtonProps {
  id: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function FileUploadButton({
  id,
  onFileSelect,
  label = 'Upload File',
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false,
}: FileUploadButtonProps) {
  return (
    <>
      <Input
        id={id}
        type="file"
        multiple
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => document.getElementById(id)?.click()}
        disabled={disabled}
      >
        <Upload className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </>
  );
}
