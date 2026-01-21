'use client';

import { useState } from 'react';
import { X, Play, Loader2, Download, ExternalLink } from 'lucide-react';

interface VideoOperation {
  id: string;
  name: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  createdAt: Date;
}

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  operation?: VideoOperation;
}

export function VideoPopup({ isOpen, onClose, operation }: VideoPopupProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen || !operation) return null;

  const handleDownload = () => {
    if (operation.videoUrl) {
      const link = document.createElement('a');
      link.href = operation.videoUrl;
      link.download = `${operation.name}.mp4`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {operation.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {operation.prompt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <StatusBadge status={operation.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(operation.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Video Player or Status */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
            {operation.status === 'completed' && operation.videoUrl ? (
              <div className="relative w-full h-full">
                {!isPlaying ? (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-gray-900 dark:text-white ml-1" />
                    </div>
                  </div>
                ) : (
                  <video
                    src={operation.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onEnded={() => setIsPlaying(false)}
                  />
                )}
              </div>
            ) : operation.status === 'processing' || operation.status === 'pending' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Generating video...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This may take a few minutes
                </p>
                <div className="mt-6 w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ) : operation.status === 'failed' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Generation failed
                </p>
                {operation.error && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                    {operation.error}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Actions */}
          {operation.status === 'completed' && operation.videoUrl && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Video
              </button>
              <button
                onClick={() => window.open(operation.videoUrl, '_blank')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Operation ID */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Operation ID
            </p>
            <code className="text-sm text-gray-900 dark:text-white font-mono">
              {operation.id}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VideoOperation['status'] }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {labels[status]}
    </span>
  );
}
