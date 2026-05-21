'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, Film, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'application/zip': ['.zip'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (mime.startsWith('video/')) return <Film className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface UploadedFile {
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
}

interface FileUploaderProps {
  demandId: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  isDeliverable?: boolean;
}

export default function FileUploader({ demandId, onUploadComplete, isDeliverable = false }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const supabase = getSupabaseBrowserClient();

  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    onDropRejected: (rejections) => {
      rejections.forEach(({ errors }) => {
        errors.forEach((e) => toast.error(e.message));
      });
    },
  });

  function removePending(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (pendingFiles.length === 0) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Não autenticado'); setUploading(false); return; }

    const uploaded: UploadedFile[] = [];

    for (const file of pendingFiles) {
      const ext = file.name.split('.').pop();
      const storagePath = `${demandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('demand-files')
        .upload(storagePath, file);

      if (storageError) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { error: dbError } = await supabase.from('files').insert({
        demand_id: demandId,
        uploaded_by: user.id,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        is_deliverable: isDeliverable,
      });

      if (dbError) {
        toast.error(`Erro ao registrar ${file.name}`);
        continue;
      }

      uploaded.push({
        name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      });
    }

    if (uploaded.length > 0) {
      toast.success(`${uploaded.length} arquivo(s) enviado(s)!`);
      onUploadComplete?.(uploaded);
      setPendingFiles([]);
    }

    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-accent bg-blue-accent/10 scale-[1.01]'
            : 'border-dark-border hover:border-blue-accent/50 hover:bg-dark-secondary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-600 mt-1">Máx. 50MB por arquivo</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-dark-card rounded-lg border border-dark-border">
              <div className="text-gray-400">{getFileIcon(file.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => removePending(i)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="w-4 h-4" /> Enviar {pendingFiles.length} arquivo(s)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
