import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export interface CreateReportParams {
  reporterId: string
  targetType: 'user' | 'message' | 'post' | 'community'
  targetId: string
  reason: string
  details?: string
  contentPreview?: string
}

export const reportService = {
  async submitReport({
    reporterId,
    targetType,
    targetId,
    reason,
    details,
    contentPreview,
  }: CreateReportParams): Promise<string> {
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
      reason: formattedReason,
      status: 'pending',
      createdAt: serverTimestamp(),
    })

    return docRef.id
  },
}
