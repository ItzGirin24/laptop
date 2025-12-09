import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student, LaptopPermission, Confiscation, ClassName, CollectionStatus, ClassStats, CLASS_LIST } from '@/types';

interface DataContextType {
  students: Student[];
  permissions: LaptopPermission[];
  confiscations: Confiscation[];
  isLoading: boolean;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateCollectionStatus: (id: string, status: CollectionStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: CollectionStatus) => Promise<void>;
  importStudents: (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  addPermission: (permission: Omit<LaptopPermission, 'id' | 'createdAt'>) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  addConfiscation: (confiscation: Omit<Confiscation, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateConfiscation: (id: string, updates: Partial<Confiscation>) => Promise<void>;
  returnConfiscation: (id: string) => Promise<void>;
  cancelConfiscation: (id: string) => Promise<void>;
  getClassStats: () => ClassStats[];
  getStudentsByClass: (className: ClassName) => Student[];
  getNotCollectedStudents: () => Student[];
  hasActivePermission: (studentId: string) => boolean;
  getActiveConfiscations: () => Confiscation[];
  getConfiscationByStudent: (studentId: string) => Confiscation | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [permissions, setPermissions] = useState<LaptopPermission[]>([]);
  const [confiscations, setConfiscations] = useState<Confiscation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to students collection
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: timestampToDate(doc.data().createdAt),
        updatedAt: timestampToDate(doc.data().updatedAt),
      })) as Student[];
      setStudents(studentsData);
    });

    // Subscribe to permissions collection
    const unsubPermissions = onSnapshot(collection(db, 'permissions'), (snapshot) => {
      const permissionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: timestampToDate(doc.data().date),
        createdAt: timestampToDate(doc.data().createdAt),
      })) as LaptopPermission[];
      setPermissions(permissionsData);
    });

    // Subscribe to confiscations collection
    const unsubConfiscations = onSnapshot(collection(db, 'confiscations'), (snapshot) => {
      const confiscationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: timestampToDate(doc.data().startDate),
        endDate: timestampToDate(doc.data().endDate),
        createdAt: timestampToDate(doc.data().createdAt),
        returnedAt: doc.data().returnedAt ? timestampToDate(doc.data().returnedAt) : undefined,
      })) as Confiscation[];
      setConfiscations(confiscationsData);
    });

    setIsLoading(false);

    return () => {
      unsubStudents();
      unsubPermissions();
      unsubConfiscations();
    };
  }, []);

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addDoc(collection(db, 'students'), {
      ...student,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, 'students', id));
  };

  const updateCollectionStatus = async (id: string, status: CollectionStatus) => {
    await updateStudent(id, { collectionStatus: status });
  };

  const bulkUpdateStatus = async (ids: string[], status: CollectionStatus) => {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      const studentRef = doc(db, 'students', id);
      batch.update(studentRef, { 
        collectionStatus: status, 
        updatedAt: Timestamp.now() 
      });
    });
    await batch.commit();
  };

  const importStudents = async (newStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const batch = writeBatch(db);
    newStudents.forEach((student) => {
      const docRef = doc(collection(db, 'students'));
      batch.set(docRef, {
        ...student,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  };

  const addPermission = async (permission: Omit<LaptopPermission, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'permissions'), {
      ...permission,
      date: Timestamp.fromDate(permission.date instanceof Date ? permission.date : new Date(permission.date)),
      createdAt: Timestamp.now(),
    });
  };

  const deletePermission = async (id: string) => {
    await deleteDoc(doc(db, 'permissions', id));
  };

  const addConfiscation = async (confiscation: Omit<Confiscation, 'id' | 'createdAt' | 'status'>) => {
    await addDoc(collection(db, 'confiscations'), {
      ...confiscation,
      startDate: Timestamp.fromDate(confiscation.startDate instanceof Date ? confiscation.startDate : new Date(confiscation.startDate)),
      endDate: Timestamp.fromDate(confiscation.endDate instanceof Date ? confiscation.endDate : new Date(confiscation.endDate)),
      status: 'active',
      createdAt: Timestamp.now(),
    });
  };

  const updateConfiscation = async (id: string, updates: Partial<Confiscation>) => {
    const confiscationRef = doc(db, 'confiscations', id);
    await updateDoc(confiscationRef, updates);
  };

  const returnConfiscation = async (id: string) => {
    await updateConfiscation(id, { 
      status: 'returned', 
      returnedAt: Timestamp.now() as any 
    });
  };

  const cancelConfiscation = async (id: string) => {
    await updateConfiscation(id, { 
      status: 'cancelled' 
    });
  };

  const getClassStats = (): ClassStats[] => {
    return CLASS_LIST.map((className) => {
      const classStudents = students.filter((s) => s.className === className);
      const collected = classStudents.filter((s) => s.collectionStatus === 'collected').length;
      const total = classStudents.length;
      return {
        className,
        total,
        collected,
        notCollected: total - collected,
        percentage: total > 0 ? Math.round((collected / total) * 100) : 0,
      };
    });
  };

  const getStudentsByClass = (className: ClassName) => {
    return students.filter((s) => s.className === className);
  };

  const getNotCollectedStudents = () => {
    return students.filter((s) => s.collectionStatus === 'not_collected');
  };

  const hasActivePermission = (studentId: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    return permissions.some((p) => {
      const permDate = p.date instanceof Date 
        ? p.date.toISOString().split('T')[0]
        : new Date(p.date).toISOString().split('T')[0];
      return (
        p.studentId === studentId &&
        permDate === today &&
        p.startTime <= currentTime &&
        p.endTime >= currentTime
      );
    });
  };

  const getActiveConfiscations = () => {
    return confiscations.filter((c) => c.status === 'active');
  };

  const getConfiscationByStudent = (studentId: string) => {
    return confiscations.find((c) => c.studentId === studentId && c.status === 'active');
  };

  return (
    <DataContext.Provider
      value={{
        students,
        permissions,
        confiscations,
        isLoading,
        addStudent,
        updateStudent,
        deleteStudent,
        updateCollectionStatus,
        bulkUpdateStatus,
        importStudents,
        addPermission,
        deletePermission,
        addConfiscation,
        updateConfiscation,
        returnConfiscation,
        cancelConfiscation,
        getClassStats,
        getStudentsByClass,
        getNotCollectedStudents,
        hasActivePermission,
        getActiveConfiscations,
        getConfiscationByStudent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
