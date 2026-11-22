import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { uploadLocalWorkspaceToFirestore } from '../firebase/firestoreSync';
import {
  AssignmentExam,
  CountdownItem,
  Course,
  MarkEntry,
  Notebook,
  PastPaperUnit,
  PomodoroSession,
  PomodoroSettings,
  StudyNote,
  StudyTask,
  WorkspaceData,
} from '../types/study';

export type SyncState = 'offline' | 'connecting' | 'live' | 'error';

export function useFirestoreSync(
  user: User | null,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceData>>,
  currentWorkspace: WorkspaceData
) {
  const [syncState, setSyncState] = useState<SyncState>(user ? 'connecting' : 'offline');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const initialUploadDone = useRef(false);

  useEffect(() => {
    if (!user) {
      setSyncState('offline');
      return;
    }

    setSyncState('connecting');
    const uid = user.uid;

    // First time login check: upload local workspace if Firestore is completely empty
    if (!initialUploadDone.current) {
      initialUploadDone.current = true;
      const hasLocalData =
        currentWorkspace.tasks.length > 0 ||
        currentWorkspace.marks.length > 0 ||
        currentWorkspace.pastPaperUnits.length > 0 ||
        currentWorkspace.courses.length > 0 ||
        currentWorkspace.notes.length > 0;

      if (hasLocalData) {
        uploadLocalWorkspaceToFirestore(uid, currentWorkspace).catch(() => {
          // Handled inside helper
        });
      }
    }

    const unsubs: (() => void)[] = [];

    // Helper to register onSnapshot with required error handler
    const registerCollectionListener = <T>(
      subcollName: string,
      updateField: (items: T[]) => void
    ) => {
      const path = `users/${uid}/${subcollName}`;
      const unsub = onSnapshot(
        collection(db, 'users', uid, subcollName),
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as T);
          });
          updateField(items);
          setSyncState('live');
          setLastSyncTime(new Date().toLocaleTimeString());
        },
        (error) => {
          setSyncState('error');
          handleFirestoreError(error, OperationType.LIST, path);
        }
      );
      unsubs.push(unsub);
    };

    // 1. Tasks
    registerCollectionListener<StudyTask>('tasks', (tasks) => {
      setWorkspace((prev) => ({ ...prev, tasks }));
    });

    // 2. Marks
    registerCollectionListener<MarkEntry>('marks', (marks) => {
      setWorkspace((prev) => ({ ...prev, marks }));
    });

    // 3. Past Paper Units
    registerCollectionListener<PastPaperUnit>('pastPaperUnits', (pastPaperUnits) => {
      setWorkspace((prev) => ({ ...prev, pastPaperUnits }));
    });

    // 4. Courses
    registerCollectionListener<Course>('courses', (courses) => {
      setWorkspace((prev) => ({ ...prev, courses }));
    });

    // 5. Assignments
    registerCollectionListener<AssignmentExam>('assignments', (assignments) => {
      setWorkspace((prev) => ({ ...prev, assignments }));
    });

    // 6. Notebooks
    registerCollectionListener<Notebook>('notebooks', (notebooks) => {
      setWorkspace((prev) => ({ ...prev, notebooks }));
    });

    // 7. Notes
    registerCollectionListener<StudyNote>('notes', (notes) => {
      setWorkspace((prev) => ({ ...prev, notes }));
    });

    // 8. Countdowns
    registerCollectionListener<CountdownItem>('countdowns', (countdowns) => {
      setWorkspace((prev) => ({ ...prev, countdowns }));
    });

    // 9. Pomodoro Sessions
    registerCollectionListener<PomodoroSession>('pomodoroSessions', (pomodoroSessions) => {
      setWorkspace((prev) => ({ ...prev, pomodoroSessions }));
    });

    // 10. Settings Doc
    const settingsPath = `users/${uid}/settings/main`;
    const unsubSettings = onSnapshot(
      doc(db, 'users', uid, 'settings', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as {
            pomodoroSettings?: PomodoroSettings;
            notionSync?: WorkspaceData['notionSync'];
          };
          setWorkspace((prev) => ({
            ...prev,
            pomodoroSettings: data.pomodoroSettings ?? prev.pomodoroSettings,
            notionSync: data.notionSync ?? prev.notionSync,
          }));
        }
        setSyncState('live');
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (error) => {
        setSyncState('error');
        handleFirestoreError(error, OperationType.GET, settingsPath);
      }
    );
    unsubs.push(unsubSettings);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  return { syncState, lastSyncTime };
}
