import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface CreateReportParams {
  reporterId: string
  targetType: 'user' | 'message' | 'post' | 'community'
  targetId: string
  reportedUserId?: string
  reportedUserName?: string
  reason: string
  details?: string
  contentPreview?: string
}

export const reportService = {
  async submitReport({
    reporterId,
    targetType,
    targetId,
    reportedUserId,
    reportedUserName,
    reason,
    details,
    contentPreview,
  }: CreateReportParams): Promise<string> {
    if (
      (reporterId && targetId && reporterId === targetId) ||
      (reporterId && reportedUserId && reporterId === reportedUserId)
    ) {
      throw new Error('Self chat or your own messages cannot be reported.')
    }

    const formattedReason = [
      reason,
      details?.trim() ? `Details: ${details.trim()}` : null,
      contentPreview?.trim() ? `Content: "${contentPreview.trim()}"` : null,
    ]
      .filter(Boolean)
      .join(' — ')

    const docRef = await addDoc(collection(db, 'reports'), {
      reporterId,
      targetType,
      targetId: targetId || 'unknown',
      reportedUserId: reportedUserId || (targetType === 'user' ? targetId : ''),
      reportedUserName: reportedUserName || '',
      reason: formattedReason,
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    return docRef.id
  },
}
