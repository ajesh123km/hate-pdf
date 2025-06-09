
import React, { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeInMB?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = ".pdf",
  multiple = true,
  maxFiles = 10,
  maxSizeInMB = 100
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: File[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check if we've hit the max file limit
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`You can only upload up to ${maxFiles} files at once`);
        break;
      }
      
      // Check file type based on accept prop
      if (accept !== "*" && !accept.includes("*")) {
        // For PDF files specifically
        if (accept.includes(".pdf") && !file.type.includes('pdf')) {
          errors.push(`${file.name} is not a PDF file`);
          continue;
        }
        // For image files
        else if (accept.includes("image/") && !file.type.startsWith('image/')) {
          errors.push(`${file.name} is not an image file`);
          continue;
        }
      }
      
      // Check file size
      if (file.size > maxSizeInBytes) {
        errors.push(`${file.name} exceeds the max file size of ${maxSizeInMB}MB`);
        continue;
      }
      
      newFiles.push(file);
    }
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Error uploading files",
        description: errors.join(". ")
      });
    }
    
    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  }, [files, maxFiles, accept, maxSizeInBytes, maxSizeInMB, toast, onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, onFilesSelected]);

  return (
    <div className="w-full space-y-4">
      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Drag & Drop your files here</h3>
          <p className="text-gray-500 mt-2 mb-6">or click to browse your computer</p>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept={accept}
            multiple={multiple}
          />
          
          <Button
            className="bg-pdf-blue hover:bg-pdf-lightBlue inline-flex items-center"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            Max file size: {maxSizeInMB}MB | Accepted file types: {accept.includes("image") ? "Images" : "PDF"}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Selected Files ({files.length})</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto p-2">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <File className="h-6 w-6 text-pdf-blue flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUploader;
