import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function useDocumentUpload() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRef = useRef(null);

  const upload = useCallback((file, projectId, onSuccess) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    const accessToken = useAuthStore.getState().accessToken;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/documents/`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        onSuccess?.(response);
        setProgress(100);
      } else {
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = xhr.responseText || errorMessage;
        }
        setError(errorMessage);
      }
    });

    xhr.addEventListener('error', () => {
      setIsUploading(false);
      setError('Network error occurred');
    });

    xhr.addEventListener('abort', () => {
      setIsUploading(false);
      setError('Upload aborted');
    });

    xhr.send(formData);
  }, []);

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading(false);
    }
  }, []);

  return { upload, cancel, progress, error, isUploading };
}