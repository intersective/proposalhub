import { useState, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { Dialog } from '@headlessui/react';

interface ImageUploadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  currentImage?: string;
  title: string;
  searchEnabled?: boolean;
  searchQuery?: string;
  aspectRatio?: number;
  fallbackInitial?: string;
  fallbackBgColor?: string;
  fallbackTextColor?: string;
}

export default function ImageUploadEditModal({
  isOpen,
  onClose,
  onSave,
  currentImage,
  title,
  searchEnabled = false,
  searchQuery = '',
  aspectRatio = 1,
  fallbackInitial = '',
  fallbackBgColor = '#F3F4F6',
  fallbackTextColor = '#4B5563'
}: ImageUploadEditModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentImage || '');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setSelectedImage(url);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleImageSearch = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/image-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const { url } = await response.json();
        setSelectedImage(url);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    } catch (error) {
      console.error('Error searching for image:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      const response = await fetch('/api/crop-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          crop: croppedAreaPixels
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        onSave(url);
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Image Preview / Cropper */}
            <div className="relative h-80 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {selectedImage ? (
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: fallbackBgColor,
                    color: fallbackTextColor
                  }}
                >
                  <span className="text-6xl font-medium">
                    {fallbackInitial}
                  </span>
                </div>
              )}
            </div>

            {selectedImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Upload Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                />
              </div>

              {searchEnabled && searchQuery && (
                <div>
                  <button
                    type="button"
                    onClick={handleImageSearch}
                    disabled={isSearching || !searchQuery}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 w-full justify-center"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search for {searchQuery}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedImage}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 