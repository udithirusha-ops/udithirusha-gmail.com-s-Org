import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  AssignmentExam,
  CountdownItem,
  Course,
  MarkEntry,
  Notebook,
  PastPaperUnit,
  PomodoroSession,
  PomodoroSettings,
  StudyMessage,
  StudyNote,
  StudyTask,
  WorkspaceData,
} from '../types/study';
import { db, handleFirestoreError, OperationType } from './config';

export async function saveTaskFirestore(
  uid: string,
  task: StudyTask
): Promise<void> {
  const path = `users/${uid}/tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'tasks', task.id), task);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTaskFirestore(
  uid: string,
  taskId: string
): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveMarkFirestore(
  uid: string,
  mark: MarkEntry
): Promise<void> {
  const path = `users/${uid}/marks/${mark.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'marks', mark.id), mark);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMarkFirestore(
  uid: string,
  markId: string
): Promise<void> {
  const path = `users/${uid}/marks/${markId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'marks', markId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function savePastPaperUnitFirestore(
  uid: string,
  unit: PastPaperUnit
): Promise<void> {
  const path = `users/${uid}/pastPaperUnits/${unit.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'pastPaperUnits', unit.id), unit);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePastPaperUnitFirestore(
  uid: string,
  unitId: string
): Promise<void> {
  const path = `users/${uid}/pastPaperUnits/${unitId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'pastPaperUnits', unitId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCourseFirestore(
  uid: string,
  course: Course
): Promise<void> {
  const path = `users/${uid}/courses/${course.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'courses', course.id), course);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCourseFirestore(
  uid: string,
  courseId: string
): Promise<void> {
  const path = `users/${uid}/courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'courses', courseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveAssignmentFirestore(
  uid: string,
  asg: AssignmentExam
): Promise<void> {
  const path = `users/${uid}/assignments/${asg.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'assignments', asg.id), asg);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAssignmentFirestore(
  uid: string,
  asgId: string
): Promise<void> {
  const path = `users/${uid}/assignments/${asgId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'assignments', asgId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveNotebookFirestore(
  uid: string,
  nb: Notebook
): Promise<void> {
  const path = `users/${uid}/notebooks/${nb.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'notebooks', nb.id), nb);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteNotebookFirestore(
  uid: string,
  nbId: string
): Promise<void> {
  const path = `users/${uid}/notebooks/${nbId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notebooks', nbId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveNoteFirestore(
  uid: string,
  note: StudyNote
): Promise<void> {
  const path = `users/${uid}/notes/${note.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'notes', note.id), note);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteNoteFirestore(
  uid: string,
  noteId: string
): Promise<void> {
  const path = `users/${uid}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCountdownFirestore(
  uid: string,
  item: CountdownItem
): Promise<void> {
  const path = `users/${uid}/countdowns/${item.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'countdowns', item.id), item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCountdownFirestore(
  uid: string,
  itemId: string
): Promise<void> {
  const path = `users/${uid}/countdowns/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'countdowns', itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function savePomodoroSessionFirestore(
  uid: string,
  session: PomodoroSession
): Promise<void> {
  const path = `users/${uid}/pomodoroSessions/${session.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'pomodoroSessions', session.id), session);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveSettingsFirestore(
  uid: string,
  settings: PomodoroSettings,
  notionSync: WorkspaceData['notionSync']
): Promise<void> {
  const path = `users/${uid}/settings/main`;
  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'main'), {
      id: 'main',
      pomodoroSettings: settings,
      notionSync,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Upload local workspace to Firestore in batches when a newly logged-in user has local data
 */
export async function uploadLocalWorkspaceToFirestore(
  uid: string,
  workspace: WorkspaceData
): Promise<void> {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const path = `users/${uid}/tasks`;
  try {
    const existingSnap = await getDocs(tasksRef);
    if (!existingSnap.empty) {
      // Remote already has data, do not overwrite blindly
      return;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }

  // Push local items in batches
  const batch = writeBatch(db);
  workspace.tasks.forEach((t) => {
    batch.set(doc(db, 'users', uid, 'tasks', t.id), t);
  });
  workspace.marks.forEach((m) => {
    batch.set(doc(db, 'users', uid, 'marks', m.id), m);
  });
  workspace.pastPaperUnits.forEach((p) => {
    batch.set(doc(db, 'users', uid, 'pastPaperUnits', p.id), p);
  });
  workspace.courses.forEach((c) => {
    batch.set(doc(db, 'users', uid, 'courses', c.id), c);
  });
  workspace.assignments.forEach((a) => {
    batch.set(doc(db, 'users', uid, 'assignments', a.id), a);
  });
  workspace.notebooks.forEach((nb) => {
    batch.set(doc(db, 'users', uid, 'notebooks', nb.id), nb);
  });
  workspace.notes.forEach((n) => {
    batch.set(doc(db, 'users', uid, 'notes', n.id), n);
  });
  workspace.countdowns.forEach((cd) => {
    batch.set(doc(db, 'users', uid, 'countdowns', cd.id), cd);
  });
  workspace.pomodoroSessions.forEach((s) => {
    batch.set(doc(db, 'users', uid, 'pomodoroSessions', s.id), s);
  });
  batch.set(doc(db, 'users', uid, 'settings', 'main'), {
    id: 'main',
    pomodoroSettings: workspace.pomodoroSettings,
    notionSync: workspace.notionSync,
    updatedAt: new Date().toISOString(),
  });

  const batchPath = `users/${uid}/*`;
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, batchPath);
  }
}

/**
 * Subscribe to real-time public study messages from Cloud Firestore.
 * Automatically triggers onSnapshot callbacks when new messages are added, modified, or removed.
 */
export function subscribeToRealtimeMessages(
  onUpdate: (messages: StudyMessage[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const messagesQuery = query(
    collection(db, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: StudyMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.text && data.authorName && data.createdAt) {
          messages.push({
            id: docSnap.id,
            text: String(data.text),
            authorId: String(data.authorId || 'guest'),
            authorName: String(data.authorName || 'Student'),
            authorPhotoURL: data.authorPhotoURL ? String(data.authorPhotoURL) : undefined,
            subject: ['physics', 'chemistry', 'combined_maths', 'general'].includes(data.subject)
              ? (data.subject as StudyMessage['subject'])
              : 'general',
            createdAt: String(data.createdAt),
          });
        }
      });
      onUpdate(messages);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'messages');
      onError?.(err);
    }
  );
}

/**
 * Send a new real-time message to Cloud Firestore.
 */
export async function sendRealtimeMessage(message: StudyMessage): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    // Sanitize payload ensuring strict conformity with blueprint schema limits
    const payload: Record<string, unknown> = {
      id: message.id.slice(0, 128),
      text: message.text.trim().slice(0, 2000),
      authorId: message.authorId.slice(0, 128),
      authorName: message.authorName.trim().slice(0, 256),
      subject: message.subject,
      createdAt: message.createdAt.slice(0, 64),
    };

    if (message.authorPhotoURL) {
      payload.authorPhotoURL = message.authorPhotoURL.slice(0, 1024);
    }

    await setDoc(doc(db, 'messages', message.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Delete a real-time message from Cloud Firestore (author only).
 */
export async function deleteRealtimeMessage(messageId: string): Promise<void> {
  const path = `messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}
