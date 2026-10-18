'use client';

import { useState } from 'react';
import { VideoPopup } from '@/components/video-popup';
import { Play } from 'lucide-react';

export default function TestVideoPopupPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  // Mock video operations
  const mockOperations = [
    {
      id: 'models/veo-3.0-fast-generate-001/operations/s8l6kgjnguvp',
      name: 'Product Showcase',
      prompt: 'A smooth camera pan across a beautifully designed notebook cover with elegant typography',
      status: 'processing' as const,
      createdAt: new Date(),
    },
    {
      id: 'models/veo-3.0-fast-generate-001/operations/w452s73xbnyj',
      name: 'Notebook Opening',
      prompt: 'A cinematic shot of a premium notebook slowly opening to reveal interior pages',
      status: 'completed' as const,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'models/veo-3.0-fast-generate-001/operations/abc123xyz',
      name: 'Product Rotation',
      prompt: 'Smooth 360-degree rotation of a luxury notebook on a minimalist white surface',
      status: 'failed' as const,
      error: 'Rate limit exceeded. Please try again later.',
      createdAt: new Date(Date.now() - 7200000),
    },
  ];

  const handleOpenVideo = (operation: any) => {
    setSelectedOperation(operation);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Video Generation Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the video popup component with different operation states
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockOperations.map((operation) => (
            <div
              key={operation.id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-medium opacity-90">
                      {operation.name}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={operation.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {operation.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {operation.prompt}
                </p>
                
                <button
                  onClick={() => handleOpenVideo(operation)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
            About This Test
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• <strong>Processing:</strong> Shows loading animation and progress indicator</li>
            <li>• <strong>Completed:</strong> Displays video player with play/download controls</li>
            <li>• <strong>Failed:</strong> Shows error message and operation details</li>
          </ul>
        </div>
      </div>

      {/* Video Popup */}
      <VideoPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        operation={selectedOperation}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'processing' | 'completed' | 'failed' }) {
  const styles = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className={`${styles[status]} text-white text-xs font-medium px-2 py-1 rounded-full`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}
