import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import type { StudyNote } from '../types/models'

export const notesService = {
  async getNotes() {
    const snap = await getDocs(query(collection(db, 'notes'), orderBy('createdAt', 'desc')))
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StudyNote, 'id'>) }))
  },

  async uploadNote(
    file: File,
    meta: { title: string; subject: string; description: string; uploadedBy: string; uploaderName: string }
  ) {
    const storageRef = ref(storage, `notes/${meta.uploadedBy}/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const fileUrl = await getDownloadURL(storageRef)

    const ref2 = await addDoc(collection(db, 'notes'), {
      ...meta,
      fileUrl,
      fileName: file.name,
      createdAt: serverTimestamp(),
    })
    return ref2.id
  },
}
