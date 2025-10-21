'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  fileName?: string;
}

export function FileUpload({ 
  onTextExtracted, 
  accept = '.pdf,.docx,.txt,.md,.csv',
  maxSize = 10,
  className = '',
  disabled = false
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadStatus({
        status: 'error',
        message: `File size exceeds ${maxSize}MB limit`
      });
      return;
    }

    // Validate file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadStatus({
        status: 'error',
        message: 'Unsupported file type. Please upload PDF, DOCX, TXT, MD, or CSV files.'
      });
      return;
    }

    setUploadStatus({ status: 'uploading', message: 'Extracting text...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/extract-text', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadStatus({
          status: 'success',
          message: `Text extracted from ${file.name}`,
          fileName: file.name
        });
        onTextExtracted(result.text, result.fileName);
      } else {
        setUploadStatus({
          status: 'error',
          message: result.error || 'Failed to extract text from file'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: 'Network error. Please try again.'
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const resetUpload = () => {
    setUploadStatus({ status: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'uploading':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return isDragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 hover:border-blue-400 hover:bg-blue-50
          ${getStatusColor()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {getStatusIcon()}
          
          {uploadStatus.status === 'idle' && (
            <>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                PDF, DOCX, TXT, MD, CSV (max {maxSize}MB)
              </div>
            </>
          )}
          
          {uploadStatus.status === 'uploading' && (
            <div className="text-sm text-blue-600">
              {uploadStatus.message}
            </div>
          )}
          
          {uploadStatus.status === 'success' && (
            <div className="text-sm text-green-600">
              {uploadStatus.message}
            </div>
          )}
          
          {uploadStatus.status === 'error' && (
            <div className="text-sm text-red-600">
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {uploadStatus.status !== 'idle' && (
        <div className="flex justify-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || uploadStatus.status === 'uploading'}
          >
            <FileText className="w-4 h-4 mr-1" />
            Upload Another
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetUpload}
            disabled={disabled || uploadStatus.status === 'uploading'}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
