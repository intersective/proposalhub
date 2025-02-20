import { TeamMember } from './types';
import ContactEditModal from '@/app/components/contact/ContactEditModal';

interface TeamMemberEditModalProps {
  member?: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<TeamMember>) => Promise<void>;
  onEnrich: (memberId?: string) => Promise<{ ok: boolean; error?: string, needsAuth?: boolean }>;
  isEnriching: boolean;
}

export default function TeamMemberEditModal(props: TeamMemberEditModalProps) {
  return (
    <ContactEditModal
      {...props}
      contact={props.member}
      showTeamMemberFields={true}
    />
  );
} 