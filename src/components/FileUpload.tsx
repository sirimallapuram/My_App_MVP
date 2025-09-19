// Component for file upload with drag & drop functionality
import React, { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File, content: string) => Promise<void>;
  isUploading?: boolean;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUpload,
  isUploading = false,
  maxSize = 10, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadContent, setUploadContent] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSelectedFile(file);
    onFileSelect(file);
  }, [maxSize, acceptedTypes, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && uploadContent.trim()) {
      try {
        await onUpload(selectedFile, uploadContent.trim());
        setSelectedFile(null);
        setUploadContent('');
        setError('');
      } catch (err) {
        setError('Upload failed. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadContent('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('text/')) return '📄';
    return '📎';
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Drag & Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept={acceptedTypes.join(',')}
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="text-sm text-gray-600">
            {isUploading ? 'Uploading...' : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-xs text-gray-500">
            Max size: {maxSize}MB
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {getFileIcon(selectedFile.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>

          {/* Upload Content Input */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add a message (optional)
            </label>
            <textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="Describe the file..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !uploadContent.trim()}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
