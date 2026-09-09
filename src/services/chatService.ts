import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Conversation, ConversationParticipant, Message } from '../types/models'

export const chatService = {
  /**
   * Creates a new 1-on-1 Direct Message conversation
   */
  async createDM(currentUserUid: string, targetUid: string) {
    // Note: In a real app, you'd check if a DM between these two already exists first.
    
    const convRef = doc(collection(db, 'conversations'))
    
    const convData: Conversation = {
      id: convRef.id,
      type: 'dm',
      createdBy: null,
      name: null,
      avatarUrl: null,
      lastMessage: null,
      participantIds: [currentUserUid, targetUid],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    
    await setDoc(convRef, convData)
    
    // Add participant subcollections
    const p1Ref = doc(db, `conversations/${convRef.id}/participants`, currentUserUid)
    const p2Ref = doc(db, `conversations/${convRef.id}/participants`, targetUid)
    
    const p1Data: ConversationParticipant = {
      uid: currentUserUid,
      role: 'member',
      joinedAt: serverTimestamp() as Timestamp,
      mutedUntil: null,
      archived: false,
      lastReadMessageId: null,
      lastReadTimestamp: serverTimestamp() as Timestamp
    }
    
    const p2Data: ConversationParticipant = { ...p1Data, uid: targetUid }

    await Promise.all([
      setDoc(p1Ref, p1Data),
      setDoc(p2Ref, p2Data)
    ])
    
    return convRef.id
  },

  /**
   * Sends a message to a conversation
   */
  async sendMessage(convId: string, senderId: string, ciphertext: string, type: Message['messageType'] = 'text') {
    const msgRef = doc(collection(db, `conversations/${convId}/messages`))
    
    const msgData: Message = {
      id: msgRef.id,
      senderId,
      ciphertext,
      messageType: type,
      replyTo: null,
      editedAt: null,
      deletedForEveryone: false,
      disappearingTimer: null,
      createdAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(msgRef, msgData)
    
    // Note: A Cloud Function should ideally update the `conversations` document's `lastMessage`
    // to avoid the client needing permission to write to the main conversation document.
    
    return msgRef.id
  }
}
