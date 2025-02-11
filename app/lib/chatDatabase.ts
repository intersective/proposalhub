import { adminDb } from './firebaseAdmin';
import { Message } from '../components/ProposalChat/types';

const MESSAGES_PER_PAGE = 20;

export async function saveChatMessage(proposalId: string, message: Message) {
  try {
    // Convert the message to a Firestore-friendly format
    const messageData = {
      ...message,
      timestamp: new Date(),
      // Convert any complex objects to plain objects
      suggestion: message.suggestion ? {
        content: message.suggestion.content,
        sectionId: message.suggestion.sectionId
      } : null,
      progress: message.progress ? {
        stage: message.progress.stage,
        current: message.progress.current,
        total: message.progress.total,
        message: message.progress.message
      } : null,
      files: message.files ? message.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      })) : null
    };

    await adminDb
      .collection('proposals')
      .doc(proposalId)
      .collection('messages')
      .add(messageData);

    return true;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return false;
  }
}

export async function getChatMessages(proposalId: string, lastMessageTimestamp?: Date) {
  try {
    let query = adminDb
      .collection('proposals')
      .doc(proposalId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(MESSAGES_PER_PAGE);

    if (lastMessageTimestamp) {
      query = query.where('timestamp', '<', lastMessageTimestamp);
    }

    const snapshot = await query.get();
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || new Date();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp,
        suggestion: data.suggestion ? {
          content: data.suggestion.content,
          sectionId: data.suggestion.sectionId
        } : undefined,
        progress: data.progress ? {
          stage: data.progress.stage,
          current: data.progress.current,
          total: data.progress.total,
          message: data.progress.message
        } : undefined,
        model: data.model,
        files: data.files || undefined
      } as Message;
    });

    // Sort messages in ascending order for display
    messages.sort((a, b) => (a.timestamp || new Date()).getTime() - (b.timestamp || new Date()).getTime());

    return {
      messages,
      hasMore: !snapshot.empty && snapshot.docs.length === MESSAGES_PER_PAGE
    };
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return { messages: [], hasMore: false };
  }
} 