import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, ArrowUpDown, UserPlus, X } from 'lucide-react';
import { Section as SectionType } from '@/app/types/section';
import { Contact } from '@/app/types/contact';
import Section from './';
import { useState } from 'react';

interface SectionCollectionProps {
  sections: SectionType[];
  onSectionUpdate: (id: string, content: string | Record<string, string>, title?: string) => void;
  onSectionImprove: (id: string) => Promise<{ content: string; directApply: boolean }>;
  onSectionDelete?: (id: string) => void;
  onSectionAdd?: () => void;
  onSectionReorder?: (sections: SectionType[]) => void;
  currentSection: string | null;
  improvingSections: Record<string, boolean>;
  draftingSections: Record<string, boolean>;
  sectionContacts?: Record<string, Contact[]>;
  onAddContact?: (sectionId: string) => void;
  onRemoveContact?: (sectionId: string, contactId: string) => void;
}

function SortableSection({ 
  section, 
  isReorderMode,
  sectionContacts,
  onAddContact,
  onRemoveContact,
  ...props 
}: { 
  section: SectionType; 
  isReorderMode: boolean;
  sectionContacts?: Record<string, Contact[]>;
  onAddContact?: (sectionId: string) => void;
  onRemoveContact?: (sectionId: string, contactId: string) => void;
} & Omit<SectionCollectionProps, 'sections' | 'onSectionAdd' | 'sectionContacts' | 'onAddContact' | 'onRemoveContact'>) {
  const isSpecialSection = section.id === 'organizationInfo' || section.id === 'clientInfo';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  // Don't apply drag-and-drop properties for special sections
  const style = !isSpecialSection && transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  const handleContentUpdate = (content: string | Record<string, string>, title?: string) => {
    props.onSectionUpdate(section.id, content, title);
  };

  const contacts = sectionContacts?.[section.id] || [];

  return (
    <div ref={!isSpecialSection ? setNodeRef : undefined} style={style}>
      <div 
        className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border ${
          props.draftingSections[section.id]
            ? 'border-yellow-300 dark:border-yellow-600 animate-pulse'
            : isDragging && !isSpecialSection
            ? 'border-blue-300 dark:border-blue-600 shadow-lg'
            : 'border-gray-200 dark:border-gray-700'
        } transition-all duration-200 ${isDragging && !isSpecialSection ? 'cursor-grabbing' : ''}`} 
        data-section-id={section.id}
      >
        <Section
          section={section}
          onUpdate={handleContentUpdate}
          onImprove={() => props.onSectionImprove(section.id)}
          onDelete={props.onSectionDelete ? () => props.onSectionDelete!(section.id) : undefined}
          isCollapsed={isReorderMode}
          onEditStateChange={() => {}}
          isImproving={props.improvingSections[section.id]}
          isDragging={isDragging}
          isImprovable={true}
          dragHandleProps={!isSpecialSection && isReorderMode ? {
            ...attributes,
            ...listeners,
            draggable: true,
            children: <GripVertical className="w-5 h-5 text-gray-400" />
          } : undefined}
        />

        {/* Section Contacts */}
        {!isReorderMode && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Section Contacts</h4>
              {onAddContact && (
                <button
                  onClick={() => onAddContact(section.id)}
                  className="inline-flex items-center px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Contact
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm"
                >
                  <span className="mr-1">{contact.firstName} {contact.lastName}</span>
                  {onRemoveContact && (
                    <button
                      onClick={() => onRemoveContact(section.id, contact.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {contacts.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">No contacts assigned</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SectionCollection({
  sections,
  onSectionUpdate,
  onSectionImprove,
  onSectionDelete,
  onSectionAdd,
  onSectionReorder,
  currentSection,
  improvingSections,
  draftingSections,
  sectionContacts,
  onAddContact,
  onRemoveContact,
}: SectionCollectionProps) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((section) => section.id === active.id);
      const newIndex = sections.findIndex((section) => section.id === over.id);

      const updatedSections = [...sections];
      const [movedSection] = updatedSections.splice(oldIndex, 1);
      updatedSections.splice(newIndex, 0, movedSection);

      onSectionReorder?.(updatedSections);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setIsReorderMode(!isReorderMode)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>{isReorderMode ? 'Done Reordering' : 'Reorder'}</span>
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isReorderMode={isReorderMode}
              onSectionUpdate={onSectionUpdate}
              onSectionImprove={onSectionImprove}
              onSectionDelete={onSectionDelete}
              currentSection={currentSection}
              improvingSections={improvingSections}
              draftingSections={draftingSections}
              sectionContacts={sectionContacts}
              onAddContact={onAddContact}
              onRemoveContact={onRemoveContact}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={onSectionAdd}
        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Add Section</span>
      </button>
    </div>
  );
} 