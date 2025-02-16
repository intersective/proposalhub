import { useState, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import Cropper, { Point, Area } from 'react-easy-crop';

interface LogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logo: string) => void;
  currentLogo?: string;
  organizationName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function LogoEditorModal({
  isOpen,
  onClose,
  onSave,
  currentLogo,
  organizationName,
  primaryColor = '#4B5563',
  secondaryColor = '#F3F4F6'
}: LogoEditorModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentLogo || '');
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
      console.error('Error uploading logo:', error);
    }
  };

  const handleLogoSearch = async () => {
    if (!organizationName) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/logo-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: organizationName }),
      });

      if (response.ok) {
        const { url } = await response.json();
        setSelectedImage(url);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
    } catch (error) {
      console.error('Error searching for logo:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                Edit Organization Logo
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {/* Logo Preview / Cropper */}
                <div className="relative h-80 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        backgroundColor: secondaryColor,
                        color: primaryColor
                      }}
                    >
                      <span className="text-6xl font-medium">
                        {organizationName.charAt(0)}
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
                      Upload Logo
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

                  <div>
                    <button
                      type="button"
                      onClick={handleLogoSearch}
                      disabled={isSearching || !organizationName}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 w-full justify-center"
                    >
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Search for {organizationName} Logo
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!selectedImage}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex justify-center w-full px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 