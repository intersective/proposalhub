import ImageUploadEditModal from './ImageUploadEditModal';

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
  return (
    <ImageUploadEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      currentImage={currentLogo}
      title="Edit Organization Logo"
      searchEnabled={true}
      searchQuery={organizationName}
      aspectRatio={1}
      fallbackInitial={organizationName.charAt(0)}
      fallbackBgColor={secondaryColor}
      fallbackTextColor={primaryColor}
    />
  );
} 