import { useState, useCallback, useRef } from 'react';
import { FiFile, FiFolder, FiFileText, FiTrash2, FiBook, FiUpload, FiCheck, FiClock } from 'react-icons/fi';
import api from '../../api/axios';
import '../../styles/documents.css';

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
    <div className="docs-root tab-root overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 md:gap-2.5 md:mb-6">
            <span className="block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              Documents
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`drop-zone border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${isDragging ? 'dragging' : ''} fade-up`}
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
                <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="progress-fill h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-gray-500 text-sm">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div>
                <FiUpload className="text-4xl mx-auto mb-2 text-gray-600" />
                <p className="text-gray-200 font-medium">Drop files here or click to upload</p>
                <p className="text-gray-500 text-sm mt-1">Supports PDF, DOCX, TXT, PPTX</p>
              </div>
            )}
          </div>

          {documents.length > 0 ? (
            <div className="space-y-3 fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-2 flex items-center gap-2">
                <FiFileText size={12} /> Your Documents
              </p>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="doc-card p-4 rounded-2xl flex items-center gap-4"
                >
                  <div className="doc-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-100 truncate">{doc.title}</div>
                    <div className="text-xs text-gray-500 flex gap-3 mt-1">
                      <span className="font-mono-study">{doc.word_count} words</span>
                      {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 text-xs rounded-lg font-medium ${doc.is_processed ? 'status-ready' : 'status-processing'}`}>
                    {doc.is_processed ? <><FiCheck size={10} className="inline mr-1" /> Ready</> : <><FiClock size={10} className="inline mr-1" /> Processing</>}
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 fade-up">
              <FiFileText className="text-5xl mx-auto mb-2 text-gray-700" />
              <p className="text-gray-500">No documents yet. Upload some to get started.</p>
            </div>
          )}
        </div>
      </div>
  );
}