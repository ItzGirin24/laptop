import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCachedApiBaseUrl } from '@/lib/ngrok-config';
import axios from 'axios';
import { Student, LaptopPermission, Confiscation, CollectionHistory } from '@/types';

export interface MigrationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  message: string;
  stats: {
    students: number;
    permissions: number;
    confiscations: number;
    collectionHistory: number;
  };
  errors: string[];
}

const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

export async function migrateFirestoreToNgrok(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    stats: {
      students: 0,
      permissions: 0,
      confiscations: 0,
      collectionHistory: 0,
    },
    errors: [],
  };

  try {
    // Get ngrok API URL
    const apiBaseUrl = await getCachedApiBaseUrl();
    console.log('Migrating to API:', apiBaseUrl);

    // Fetch all data from Firestore
    onProgress?.({
      total: 4,
      completed: 0,
      current: 'Fetching students from Firestore...',
      errors: [],
    });

    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const students: Student[] = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToDate(doc.data().createdAt),
      updatedAt: timestampToDate(doc.data().updatedAt),
    })) as Student[];

    onProgress?.({
      total: 4,
      completed: 1,
      current: 'Fetching permissions from Firestore...',
      errors: [],
    });

    const permissionsSnapshot = await getDocs(collection(db, 'permissions'));
    const permissions: LaptopPermission[] = permissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: timestampToDate(doc.data().date),
      createdAt: timestampToDate(doc.data().createdAt),
    })) as LaptopPermission[];

    onProgress?.({
      total: 4,
      completed: 2,
      current: 'Fetching confiscations from Firestore...',
      errors: [],
    });

    const confiscationsSnapshot = await getDocs(collection(db, 'confiscations'));
    const confiscations: Confiscation[] = confiscationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: timestampToDate(doc.data().startDate),
      endDate: timestampToDate(doc.data().endDate),
      createdAt: timestampToDate(doc.data().createdAt),
      returnedAt: doc.data().returnedAt ? timestampToDate(doc.data().returnedAt) : undefined,
    })) as Confiscation[];

    onProgress?.({
      total: 4,
      completed: 3,
      current: 'Fetching collection history from Firestore...',
      errors: [],
    });

    const historySnapshot = await getDocs(collection(db, 'collectionHistory'));
    const collectionHistory: CollectionHistory[] = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: timestampToDate(doc.data().date),
      createdAt: timestampToDate(doc.data().createdAt),
    })) as CollectionHistory[];

    // Import to ngrok API
    const importPromises = [];

    // Import students
    if (students.length > 0) {
      console.log(`Importing ${students.length} students...`);
      importPromises.push(
        axios.post(`${apiBaseUrl}/students/bulk-import`, students.map(s => ({
          name: s.name,
          studentNumber: s.studentNumber,
          className: s.className,
          lockerNumber: s.lockerNumber,
          collectionStatus: s.collectionStatus,
        }))).catch(error => {
          result.errors.push(`Failed to import students: ${error.message}`);
          console.error('Students import error:', error);
        })
      );
    }

    // Import permissions
    if (permissions.length > 0) {
      console.log(`Importing ${permissions.length} permissions...`);
      importPromises.push(
        ...permissions.map(permission =>
          axios.post(`${apiBaseUrl}/permissions`, {
            studentId: permission.studentId,
            studentName: permission.studentName,
            className: permission.className,
            date: permission.date.toISOString(),
            startTime: permission.startTime,
            endTime: permission.endTime,
            reason: permission.reason,
          }).catch(error => {
            result.errors.push(`Failed to import permission for ${permission.studentName}: ${error.message}`);
            console.error('Permission import error:', error);
          })
        )
      );
    }

    // Import confiscations
    if (confiscations.length > 0) {
      console.log(`Importing ${confiscations.length} confiscations...`);
      importPromises.push(
        ...confiscations.map(confiscation =>
          axios.post(`${apiBaseUrl}/confiscations`, {
            studentId: confiscation.studentId,
            studentName: confiscation.studentName,
            className: confiscation.className,
            lockerNumber: confiscation.lockerNumber,
            reason: confiscation.reason,
            startDate: confiscation.startDate.toISOString(),
            endDate: confiscation.endDate.toISOString(),
            duration: confiscation.duration,
          }).catch(error => {
            result.errors.push(`Failed to import confiscation for ${confiscation.studentName}: ${error.message}`);
            console.error('Confiscation import error:', error);
          })
        )
      );
    }

    // Import collection history
    if (collectionHistory.length > 0) {
      console.log(`Importing ${collectionHistory.length} collection history...`);
      importPromises.push(
        ...collectionHistory.map(history =>
          axios.post(`${apiBaseUrl}/collection-history`, {
            studentId: history.studentId,
            status: history.status,
            date: history.date.toISOString(),
          }).catch(error => {
            result.errors.push(`Failed to import collection history: ${error.message}`);
            console.error('Collection history import error:', error);
          })
        )
      );
    }

    // Wait for all imports to complete
    await Promise.allSettled(importPromises);

    onProgress?.({
      total: 4,
      completed: 4,
      current: 'Migration completed!',
      errors: result.errors,
    });

    // Update stats
    result.stats.students = students.length;
    result.stats.permissions = permissions.length;
    result.stats.confiscations = confiscations.length;
    result.stats.collectionHistory = collectionHistory.length;

    result.success = result.errors.length === 0;
    result.message = result.success
      ? `Successfully migrated ${students.length + permissions.length + confiscations.length + collectionHistory.length} records to ngrok API`
      : `Migration completed with ${result.errors.length} errors. ${students.length + permissions.length + confiscations.length + collectionHistory.length} records processed.`;

    console.log('Migration result:', result);
    return result;

  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration failed: ${error.message}`);
    result.message = 'Migration failed completely';
    return result;
  }
}

export async function verifyMigration(): Promise<{
  firestore: { students: number; permissions: number; confiscations: number; history: number };
  api: { students: number; permissions: number; confiscations: number; history: number };
}> {
  try {
    const apiBaseUrl = await getCachedApiBaseUrl();

    // Count Firestore data
    const [studentsFS, permissionsFS, confiscationsFS, historyFS] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'permissions')),
      getDocs(collection(db, 'confiscations')),
      getDocs(collection(db, 'collectionHistory')),
    ]);

    // Count API data
    const [studentsAPI, permissionsAPI, confiscationsAPI, historyAPI] = await Promise.all([
      axios.get(`${apiBaseUrl}/students`).catch(() => ({ data: [] })),
      axios.get(`${apiBaseUrl}/permissions`).catch(() => ({ data: [] })),
      axios.get(`${apiBaseUrl}/confiscations`).catch(() => ({ data: [] })),
      axios.get(`${apiBaseUrl}/collection-history`).catch(() => ({ data: [] })),
    ]);

    return {
      firestore: {
        students: studentsFS.size,
        permissions: permissionsFS.size,
        confiscations: confiscationsFS.size,
        history: historyFS.size,
      },
      api: {
        students: studentsAPI.data?.length || 0,
        permissions: permissionsAPI.data?.length || 0,
        confiscations: confiscationsAPI.data?.length || 0,
        history: historyAPI.data?.length || 0,
      },
    };
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}
