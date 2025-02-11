import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

const MESSAGES_PER_PAGE = 20;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const lastTimestamp = searchParams.get('lastTimestamp');

    let query = adminDb
      .collection('proposals')
      .doc(id)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(MESSAGES_PER_PAGE);

    if (lastTimestamp) {
      query = query.where('timestamp', '<', new Date(lastTimestamp));
    }

    const snapshot = await query.get();
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate(),
        suggestion: data.suggestion,
        progress: data.progress,
        model: data.model,
        files: data.files
      };
    });

    // Sort messages in ascending order for display
    messages.sort((a, b) => (a.timestamp || new Date()).getTime() - (b.timestamp || new Date()).getTime());

    return NextResponse.json({
      messages,
      hasMore: !snapshot.empty && snapshot.docs.length === MESSAGES_PER_PAGE
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const message = await req.json();

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
      files: message.files ? message.files.map((file: File) => ({
        name: file.name,
        type: file.type,
        size: file.size
      })) : null
    };

    const docRef = await adminDb
      .collection('proposals')
      .doc(id)
      .collection('messages')
      .add(messageData);

    return NextResponse.json({
      id: docRef.id,
      ...messageData,
      timestamp: messageData.timestamp.toISOString()
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
} 