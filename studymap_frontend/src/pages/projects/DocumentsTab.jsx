import { useState, useCallback, useRef } from 'react';
import { FiFile, FiFolder, FiFileText, FiTrash2, FiBook } from 'react-icons/fi';
import api from '../../api/axios';

export default function DocumentsTab({ projectId, documents, onRefresh }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/projects/${projectId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      onRefresh?.();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, onRefresh]);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/projects/${projectId}/documents/${docId}/`);
      onRefresh?.();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FiBook />;
      case 'docx': return <FiFile />;
      case 'txt': return <FiFileText />;
      case 'pptx': return <FiFile />;
      default: return <FiFileText />;
    }
  };

  return (
    <div className="space-y-6">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isUploading ? (
          <div className="space-y-3">
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-muted">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div>
            <FiFolder className="text-4xl mb-2" />
            <p className="text-text font-medium">Drop files here or click to upload</p>
            <p className="text-sm text-muted mt-1">Supports PDF, DOCX, TXT, PPTX</p>
          </div>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">Your Documents</h3>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <span className="text-3xl w-auto">{getFileIcon(doc.file_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text truncate">{doc.title}</div>
                <div className="text-sm text-muted flex gap-4 mt-1">
                  <span>{doc.word_count} words</span>
                  {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  doc.is_processed
                    ? 'bg-success/20 text-success'
                    : 'bg-warning/20 text-warning'
                }`}
              >
                {doc.is_processed ? 'Ready' : 'Processing'}
              </span>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 text-muted hover:text-red-400 transition-colors"
                title="Delete"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <FiFileText className="text-4xl mb-2" />
          <p>No documents yet. Upload some to get started.</p>
        </div>
      )}
    </div>
  );
}