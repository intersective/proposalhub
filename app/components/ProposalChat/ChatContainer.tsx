import { useState, useRef, useEffect } from 'react';
import { Message, ChatState, ChatActions } from './types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useDropzone } from 'react-dropzone';

interface ChatContainerProps {
  onSectionUpdate: (sectionId: string, content: string) => Promise<void>;
  onSectionImprove: (sectionId: string) => Promise<string>;
  onDocumentAnalysis: (content: string, signal: AbortSignal) => Promise<void>;
}

export default function ChatContainer({ 
  onSectionUpdate, 
  onSectionImprove,
  onDocumentAnalysis 
}: ChatContainerProps) {
  const [state, setState] = useState<ChatState>({
    messages: [{
      role: 'system',
      content: 'Welcome! I can help you create and improve your proposal. You can:\n\n- Drop a document to analyze it\n- Ask me to improve specific sections\n- Request suggestions for any part of the proposal'
    }],
    isProcessing: false,
    currentSection: null
  });
  const [isDragging, setIsDragging] = useState(false);

  const abortController = useRef<AbortController>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const actions: ChatActions = {
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
    clearMessages: () => {
      setState(prev => ({ ...prev, messages: [] }));
    }
  };

  const handleSubmit = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    actions.addMessage({
      role: 'user',
      content,
      files
    });

    actions.setProcessing(true);

    try {
      if (files?.length) {
        abortController.current = new AbortController();
        await onDocumentAnalysis(content, abortController.current.signal);
      } else if (state.currentSection) {
        const response = await onSectionImprove(state.currentSection);
        actions.addMessage({
          role: 'assistant',
          content: 'Here\'s a suggested improvement for the section:',
          suggestion: {
            sectionId: state.currentSection,
            content: response
          }
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Analysis cancelled') {
        actions.addMessage({
          role: 'system',
          content: 'An error occurred while processing your request.'
        });
      }
    } finally {
      actions.setProcessing(false);
    }
  };

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
      <div className="flex-1 overflow-y-auto p-4">
        {state.messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLoading={state.isProcessing && index === state.messages.length - 1}
            onCancel={handleCancel}
            onReplace={handleReplace}
            onAppend={handleAppend}
            onRefine={handleRefine}
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
        disabled={state.isProcessing}
        currentSection={state.currentSection}
      />
    </div>
  );
} 