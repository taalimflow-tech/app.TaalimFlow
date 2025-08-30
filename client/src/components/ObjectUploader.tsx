import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number; // 5MB default for blog attachments
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component for blog attachments that renders as a button and handles
 * file upload with a 5MB size limit.
 * 
 * Features:
 * - Renders as a customizable button
 * - Direct file upload to object storage
 * - 5MB file size limit for blog attachments
 * - Progress feedback during upload
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 5MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 5242880, // 5MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize) {
      alert(`حجم الملف كبير جداً. الحد الأقصى هو ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get upload parameters
      const { url } = await onGetUploadParameters();

      // Upload file using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          onComplete?.({ successful: [{ uploadURL: url }] });
        } else {
          console.error('Upload failed:', xhr.statusText);
          alert('فشل في رفع الملف');
        }
        setUploading(false);
        setUploadProgress(0);
      });

      // Handle upload error
      xhr.addEventListener('error', () => {
        console.error('Upload error');
        alert('فشل في رفع الملف');
        setUploading(false);
        setUploadProgress(0);
      });

      // Start upload
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('فشل في رفع الملف');
      setUploading(false);
      setUploadProgress(0);
    }

    // Clear the input
    event.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <Button
        onClick={() => document.getElementById('file-upload')?.click()}
        className={buttonClassName}
        disabled={uploading}
        type="button"
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>جاري الرفع... {uploadProgress}%</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}