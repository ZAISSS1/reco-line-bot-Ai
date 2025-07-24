import { useState, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  gridCols?: number;
}

export default function ImageUpload({ 
  images, 
  onChange, 
  maxImages = 5, 
  gridCols = 5 
}: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);
    
    if (fileArray.length > remainingSlots) {
      toast({
        title: "提醒",
        description: `只能再上傳 ${remainingSlots} 張圖片，已自動選取前 ${remainingSlots} 張`,
      });
    }

    setUploading(true);
    const newImages: string[] = [];
    
    try {
      for (const file of filesToProcess) {
        if (file.type.startsWith('image/')) {
          const formData = new FormData();
          formData.append('image', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            newImages.push(data.url);
          }
        }
      }
      
      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({
          title: "成功",
          description: `成功上傳 ${newImages.length} 張圖片`,
        });
      }
    } catch (error) {
      toast({
        title: "錯誤",
        description: "部分圖片上傳失敗",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const canUpload = images.length < maxImages;
  const emptySlots = maxImages - images.length;

  return (
    <div className="space-y-3">
      {/* 拖曳上傳區域 */}
      {canUpload && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-blue-400 bg-blue-500/20 scale-[1.02]'
              : 'border-dark-tertiary hover:border-blue-500/50 hover:bg-blue-500/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <div className={`mx-auto mb-2 transition-transform ${isDragging ? 'scale-110' : ''}`}>
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-300 mb-1">
              {isDragging ? '放開以上傳圖片' : uploading ? '上傳中...' : '拖曳多張圖片到此處'}
            </p>
            <p className="text-xs text-gray-400 mb-1">
              或點擊選擇圖片檔案
            </p>
            <p className="text-xs text-gray-500">
              支援多張圖片同時上傳，最多 {maxImages} 張 ({images.length}/{maxImages})
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
      />

      {/* 圖片預覽網格 */}
      <div className={`grid gap-2 ${gridCols === 2 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-5'}`}>
        {/* 已上傳的圖片 */}
        {images.map((imageUrl, index) => (
          <div key={index} className="aspect-square bg-dark-secondary border border-dark-tertiary rounded-lg overflow-hidden relative group">
            <img 
              src={imageUrl} 
              alt={`上傳圖片 ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveImage(index)}
                className="text-red-400 hover:text-red-300 p-2"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        ))}


      </div>

      {/* 上傳統計 */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>已上傳 {images.length}/{maxImages} 張圖片</span>
          {images.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange([])}
              className="text-xs border-dark-tertiary text-gray-400 hover:text-white"
            >
              清除全部
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
