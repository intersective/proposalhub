import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message, ChatState, ChatActions, MODEL_OPTIONS } from './types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
//import LoadingIndicator from '../LoadingIndicator';
import { useDropzone } from 'react-dropzone';

interface ChatContainerProps {
  onSectionUpdate: (sectionId: string, content: string) => Promise<void>;
  onSectionImprove: (sectionId: string) => Promise<string>;
  onDocumentAnalysis: (content: string, signal: AbortSignal) => Promise<void>;
  currentSection?: string | null;
  onSetCurrentSection?: (sectionId: string | null) => void;
  isImproving?: boolean;
  sections?: { 
    id: string; 
    title: string; 
    content?: string | Record<string, string>;
    type: 'text' | 'fields';
  }[];
  onDraftingSectionsUpdate?: (updates: Record<string, boolean>) => void;
  proposalId: string;
}

export default function ChatContainer({ 
  onSectionUpdate, 
  //  onSectionImprove,
  onDocumentAnalysis,
  currentSection: externalCurrentSection,
  onSetCurrentSection,
  isImproving = false,
  sections = [],
  onDraftingSectionsUpdate,
  proposalId
}: ChatContainerProps) {
  const [state, setState] = useState<ChatState>({
    messages: [{
      role: 'system',
      content: `# Welcome to ProposalHub! 👋

I can help you create and improve your proposal. Here's what I can do:

- **Analyze Documents**: Drop a PDF or markdown file to extract content
- **Improve Sections**: I can enhance specific sections with better content and formatting
- **Provide Suggestions**: Ask me for suggestions on any part of your proposal

Just start typing or drop a document to begin!`
    }],
    isProcessing: false,
    currentSection: null,
    currentModel: MODEL_OPTIONS[0].value,
    draftingSections: {},
    improvableSections: [],
    chatContext: {
      relevantInfo: [],
      lastMessageIndex: 0
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const abortController = useRef<AbortController>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle auto-expand on input focus
  const handleInputFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const actions = useMemo<ChatActions>(() => ({
    addMessage: (message: Message) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }));
    },
    setProcessing: (isProcessing: boolean) => {
      setState(prev => ({ ...prev, isProcessing }));
    },
    setCurrentSection: (sectionId: string | null) => {
      setState(prev => ({ ...prev, currentSection: sectionId }));
    },
    setCurrentModel: (model: string) => {
      setState(prev => ({ ...prev, currentModel: model }));
    },
    clearMessages: () => {
      setState(prev => ({ ...prev, messages: [] }));
    }
  }), []);

  // Use external section state if provided
  const currentSection = externalCurrentSection !== undefined ? externalCurrentSection : state.currentSection;
  const setCurrentSection = onSetCurrentSection || actions.setCurrentSection;

  // Show loading indicator when externally improving or internally processing
  const isProcessing = isImproving || state.isProcessing;

  // When improvement starts, add a message
  useEffect(() => {
    if (isImproving && currentSection) {
      const targetSection = sections.find(s => s.id === currentSection);
      // Only show analyzing message if we're improving, not drafting
      if (targetSection?.content) {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage?.role !== 'system' || !lastMessage.content.includes('Analyzing')) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              role: 'system',
              content: `Analyzing section and generating improvements...`,
            }]
          }));
        }
      }
    }
  }, [isImproving, currentSection, sections, state.messages]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md']
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        actions.addMessage({
          role: 'user',
          content: `Analyzing ${file.name}...`,
          files: [file],
          progress: {
            stage: 'processing',
            current: 0,
            total: 100,
            message: 'Starting analysis...'
          }
        });
        
        actions.setProcessing(true);
        try {
          abortController.current = new AbortController();
          await onDocumentAnalysis(content, abortController.current.signal);
        } catch (error) {
          if (error instanceof Error && error.message !== 'Analysis cancelled') {
            actions.addMessage({
              role: 'system',
              content: 'An error occurred while analyzing the document.'
            });
          }
        } finally {
          actions.setProcessing(false);
        }
      };
      
      reader.readAsText(file);
    },
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);



  // Load chat history from database on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/messages`);
        if (response.ok) {
          const { messages: savedMessages } = await response.json();
          if (savedMessages.length > 0) {
            setState(prev => ({
              ...prev,
              messages: savedMessages
            }));
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [proposalId]);

  // When a section is selected for improvement, automatically trigger the improve process
  const handleSubmit = useCallback(async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0) && !currentSection) return;

    // Add user message
    if (content.trim()) {
      const message: Message = {
        role: 'user',
        content,
        files,
        timestamp: new Date()
      };
      actions.addMessage(message);

      // Save message to database
      try {
        await fetch(`/api/proposals/${proposalId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
      } catch (error) {
        console.error('Error saving chat message:', error);
      }
    }

    actions.setProcessing(true);

    try {
      if (files?.length) {
        abortController.current = new AbortController();
        await onDocumentAnalysis(content, abortController.current.signal);
      } else if (currentSection) {
        // Get the section being worked on
        const targetSection = sections.find(s => s.id === currentSection);
        if (!targetSection) return;

        // Get context from filled sections
        const filledSections = sections.filter(s => s.content && s.content !== '' && s.id !== currentSection);
        const sectionContext = filledSections.map(s => 
          `${s.title}:\n${typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2)}`
        ).join('\n\n');

        const chatContext = state.chatContext.relevantInfo.join('\n');

        // Update drafting state
        if (!targetSection.content && onDraftingSectionsUpdate) {
          onDraftingSectionsUpdate({ [currentSection]: true });
        }

        // Create context-aware message for improvement
        const contextualMessage = `
Context from conversation:
${chatContext}

Current proposal sections:
${sectionContext}

User message:
${content}

Please ${targetSection.content ? 'improve' : 'draft'} the ${targetSection.title} section.
`;

        // Process the section
        const response = await fetch('/api/process-contact-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: contextualMessage,
            type: targetSection.content ? 'improve' : 'draft',
            section: currentSection
          })
        });

        if (!response.ok) {
          throw new Error('Failed to process section');
        }

        const data = await response.json();

        if (data.content) {
          if (!targetSection.content) {
            // If drafting a new section, update it directly
            await onSectionUpdate(currentSection, data.content);
            // Clear drafting state
            if (onDraftingSectionsUpdate) {
              onDraftingSectionsUpdate({ [currentSection]: false });
            }
            actions.addMessage({
              role: 'system',
              content: `✓ Drafted ${targetSection.title.toLowerCase()}`,
              timestamp: new Date()
            });
          } else {
            // For improvements, return the content directly
            return data.content;
          }
        }

        setCurrentSection(null);
      } else {
        // Regular chat message processing
        const filledSections = sections.filter(s => s.content && s.content !== '');
        const sectionContext = filledSections.map(s => 
          `${s.title}:\n${typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2)}`
        ).join('\n\n');

        const chatContext = state.chatContext.relevantInfo.join('\n');

        // Create context-aware message
        const contextualMessage = `
Context from conversation:
${chatContext}

Current proposal sections:
${sectionContext}

User message:
${content}
`;

        const response = await fetch('/api/process-contact-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: contextualMessage,
            type: 'chat'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to process chat message');
        }

        const data = await response.json();
        
        // Update context with relevant information
        const newContext = {
          relevantInfo: [
            ...state.chatContext.relevantInfo,
            content.trim()
          ].slice(-5),
          lastMessageIndex: state.messages.length
        };

        setState(prev => ({
          ...prev,
          chatContext: newContext
        }));

        // Add assistant's response
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        };
        actions.addMessage(assistantMessage);

        // Save message to database
        try {
          await fetch(`/api/proposals/${proposalId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(assistantMessage)
          });
        } catch (error) {
          console.error('Error saving chat message:', error);
        }

        // Check for potentially improvable sections
        const improvableSectionIds = filledSections
          .filter(s => newContext.relevantInfo.some(info => 
            info.toLowerCase().includes(s.title.toLowerCase()) ||
            (s.content && s.content.toString().toLowerCase().includes(info.toLowerCase()))
          ))
          .map(s => s.id);

        if (improvableSectionIds.length > 0) {
          setState(prev => ({
            ...prev,
            improvableSections: improvableSectionIds
          }));
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Analysis cancelled') {
        const errorMessage: Message = {
          role: 'system',
          content: 'An error occurred while processing your request.',
          timestamp: new Date()
        };
        actions.addMessage(errorMessage);

        // Save error message to database
        try {
          await fetch(`/api/proposals/${proposalId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorMessage)
          });
        } catch (error) {
          console.error('Error saving chat message:', error);
        }

        // Clear drafting state if there was an error
        if (currentSection && onDraftingSectionsUpdate) {
          onDraftingSectionsUpdate({ [currentSection]: false });
        }
      }
    } finally {
      actions.setProcessing(false);
    }
  }, [currentSection, sections, onDraftingSectionsUpdate, onSectionUpdate, proposalId, actions, onDocumentAnalysis, setCurrentSection, state]);

  useEffect(() => {
    if (currentSection) {
      handleSubmit('', []);
    }
  }, [currentSection, handleSubmit]);

  const handleCancel = () => {
    abortController.current?.abort();
    actions.setProcessing(false);
  };

  const handleReplace = async (sectionId: string, content: string) => {
    await onSectionUpdate(sectionId, content);
    actions.addMessage({
      role: 'system',
      content: 'Section content has been replaced.'
    });
  };

  const handleAppend = async (sectionId: string, content: string) => {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    const currentContent = section?.textContent || '';
    await onSectionUpdate(sectionId, `${currentContent}\n\n${content}`);
    actions.addMessage({
      role: 'system',
      content: 'Content has been appended to the section.'
    });
  };

  const handleRefine = async (sectionId: string) => {
    actions.setCurrentSection(sectionId);
    actions.addMessage({
      role: 'system',
      content: 'How would you like me to refine this suggestion? Please provide specific instructions.'
    });
  };

  return (
    <div {...getRootProps()} className="flex flex-col h-full relative">
      <input {...getInputProps()} />
      <div className={`flex-1 overflow-y-auto p-6 ${!isExpanded ? 'hidden sm:block' : ''}`}>
        {state.messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLoading={isProcessing && index === state.messages.length - 1}
            onCancel={handleCancel}
            onReplace={handleReplace}
            onAppend={handleAppend}
            onRefine={handleRefine}
            currentModel={state.currentModel}
            onModelChange={actions.setCurrentModel}
            isDraft={message.suggestion?.isDraft}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
          <div className="text-blue-500 text-lg font-medium">
            Drop your file here
          </div>
        </div>
      )}
      
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isProcessing}
        currentSection={currentSection}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        onFocus={handleInputFocus}
      />
    </div>
  );
} 