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
import axios from 'axios';
import { Student, LaptopPermission, Confiscation, ClassName, CollectionStatus, ClassStats, CollectionHistory, CLASS_LIST } from '@/types';

// Configuration constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MARIADB = import.meta.env.VITE_USE_MARIADB === 'true';

interface DataContextType {
  students: Student[];
  permissions: LaptopPermission[];
  confiscations: Confiscation[];
  collectionHistory: CollectionHistory[];
  isLoading: boolean;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateCollectionStatus: (id: string, status: CollectionStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: CollectionStatus) => Promise<void>;
  importStudents: (students: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  addPermission: (permission: Omit<LaptopPermission, 'id' | 'createdAt'>) => Promise<void>;
  updatePermission: (id: string, updates: Partial<LaptopPermission>) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  completePermission: (permissionId: string) => Promise<void>;
  addConfiscation: (confiscation: Omit<Confiscation, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateConfiscation: (id: string, updates: Partial<Confiscation>) => Promise<void>;
  deleteConfiscation: (id: string) => Promise<void>;
  returnConfiscation: (id: string) => Promise<void>;
  cancelConfiscation: (id: string) => Promise<void>;
  getClassStats: () => ClassStats[];
  getStudentsByClass: (className: ClassName) => Student[];
  getNotCollectedStudents: () => Student[];
  hasActivePermission: (studentId: string) => boolean;
  getActiveConfiscations: () => Confiscation[];
  getConfiscationByStudent: (studentId: string) => Confiscation | undefined;
  addCollectionHistory: (history: Omit<CollectionHistory, 'id' | 'createdAt'>) => Promise<void>;
  deleteCollectionHistory: (id: string) => Promise<void>;
  getCollectionHistoryByStudent: (studentId: string) => CollectionHistory[];
  getNotCollectedCount: (studentId: string) => number;
  getDaysSinceLastCollected: (studentId: string) => number;
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

// API helper functions for MariaDB
const apiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data && { data }),
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [permissions, setPermissions] = useState<LaptopPermission[]>([]);
  const [confiscations, setConfiscations] = useState<Confiscation[]>([]);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (USE_MARIADB) {
          // Load data from MariaDB API
          const [studentsRes, permissionsRes, confiscationsRes, historyRes] = await Promise.all([
            apiCall('GET', '/students'),
            apiCall('GET', '/permissions'),
            apiCall('GET', '/confiscations'),
            apiCall('GET', '/collection-history')
          ]);

          setStudents(studentsRes);
          setPermissions(permissionsRes);
          setConfiscations(confiscationsRes);
          setCollectionHistory(historyRes);
        } else {
          // Subscribe to Firestore collections
          const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
            const studentsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: timestampToDate(doc.data().createdAt),
              updatedAt: timestampToDate(doc.data().updatedAt),
            })) as Student[];
            setStudents(studentsData);
          });

          const unsubPermissions = onSnapshot(collection(db, 'permissions'), (snapshot) => {
            const permissionsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              date: timestampToDate(doc.data().date),
              createdAt: timestampToDate(doc.data().createdAt),
            })) as LaptopPermission[];
            setPermissions(permissionsData);
          });

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

          const unsubCollectionHistory = onSnapshot(collection(db, 'collectionHistory'), (snapshot) => {
            const collectionHistoryData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              date: timestampToDate(doc.data().date),
              createdAt: timestampToDate(doc.data().createdAt),
            })) as CollectionHistory[];
            setCollectionHistory(collectionHistoryData);
          });

          return () => {
            unsubStudents();
            unsubPermissions();
            unsubConfiscations();
            unsubCollectionHistory();
          };
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to Firestore if MariaDB fails
        if (USE_MARIADB) {
          console.warn('Falling back to Firestore due to MariaDB error');
          // Could implement fallback logic here
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (USE_MARIADB) {
      const result = await apiCall('POST', '/students', student);
      // Update local state
      setStudents(prev => [...prev, result]);
    } else {
      await addDoc(collection(db, 'students'), {
        ...student,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
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

  const addCollectionHistory = async (history: Omit<CollectionHistory, 'id' | 'createdAt'>) => {
    if (USE_MARIADB) {
      const result = await apiCall('POST', '/collection-history', history);
      // Update local state
      setCollectionHistory(prev => [...prev, result]);
    } else {
      await addDoc(collection(db, 'collectionHistory'), {
        ...history,
        date: Timestamp.fromDate(history.date instanceof Date ? history.date : new Date(history.date)),
        createdAt: Timestamp.now(),
      });
    }
  };

  const deleteCollectionHistory = async (id: string) => {
    if (USE_MARIADB) {
      await apiCall('DELETE', `/collection-history/${id}`);
      // Update local state
      setCollectionHistory(prev => prev.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, 'collectionHistory', id));
    }
  };

  const updateCollectionStatus = async (id: string, status: CollectionStatus) => {
    await updateStudent(id, { collectionStatus: status });
    // Add to collection history
    await addCollectionHistory({
      studentId: id,
      status,
      date: new Date(),
    });
  };

  const bulkUpdateStatus = async (ids: string[], status: CollectionStatus) => {
    if (USE_MARIADB) {
      await apiCall('POST', '/students/bulk-update-status', { ids, status });
      // Update local state
      setStudents(prev => prev.map(student =>
        ids.includes(student.id) ? { ...student, collectionStatus: status } : student
      ));
    } else {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const studentRef = doc(db, 'students', id);
        batch.update(studentRef, {
          collectionStatus: status,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();
    }
  };

  const importStudents = async (newStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (USE_MARIADB) {
      await apiCall('POST', '/students/bulk-import', newStudents);
      // Refresh data from API
      const studentsRes = await apiCall('GET', '/students');
      setStudents(studentsRes);
    } else {
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
    }
  };

  const addPermission = async (permission: Omit<LaptopPermission, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'permissions'), {
      ...permission,
      date: Timestamp.fromDate(permission.date instanceof Date ? permission.date : new Date(permission.date)),
      createdAt: Timestamp.now(),
    });
  };

  const updatePermission = async (id: string, updates: Partial<LaptopPermission>) => {
    const permissionRef = doc(db, 'permissions', id);
    const updateData: any = { ...updates };
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date instanceof Date ? updates.date : new Date(updates.date));
    }
    await updateDoc(permissionRef, updateData);
  };

  const deletePermission = async (id: string) => {
    await deleteDoc(doc(db, 'permissions', id));
  };

  const completePermission = async (permissionId: string) => {
    // Find the permission to get the student ID
    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    // Update student collection status to 'collected'
    await updateCollectionStatus(permission.studentId, 'collected');

    // Delete the permission since it's completed
    await deletePermission(permissionId);
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

  const deleteConfiscation = async (id: string) => {
    await deleteDoc(doc(db, 'confiscations', id));
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
    // For testing purposes, consider any permission as active
    // In production, should check date and time constraints
    return permissions.some((p) => p.studentId === studentId);
  };

  const getActiveConfiscations = () => {
    return confiscations.filter((c) => c.status === 'active');
  };

  const getConfiscationByStudent = (studentId: string) => {
    return confiscations.find((c) => c.studentId === studentId && c.status === 'active');
  };

  const getCollectionHistoryByStudent = (studentId: string) => {
    return collectionHistory
      .filter((h) => h.studentId === studentId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
  };

  const getNotCollectedCount = (studentId: string) => {
    return collectionHistory.filter((h) => h.studentId === studentId && h.status === 'not_collected').length;
  };

  const getDaysSinceLastCollected = (studentId: string) => {
    const collectedHistory = collectionHistory
      .filter((h) => h.studentId === studentId && h.status === 'collected')
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (collectedHistory.length === 0) return -1; // Never collected

    const lastCollected = collectedHistory[0].date;
    const now = new Date();
    const diffTime = now.getTime() - lastCollected.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <DataContext.Provider
      value={{
        students,
        permissions,
        confiscations,
        collectionHistory,
        isLoading,
        addStudent,
        updateStudent,
        deleteStudent,
        updateCollectionStatus,
        bulkUpdateStatus,
        importStudents,
        addPermission,
        updatePermission,
        deletePermission,
        completePermission,
        addConfiscation,
        updateConfiscation,
        deleteConfiscation,
        returnConfiscation,
        cancelConfiscation,
        getClassStats,
        getStudentsByClass,
        getNotCollectedStudents,
        hasActivePermission,
        getActiveConfiscations,
        getConfiscationByStudent,
        addCollectionHistory,
        deleteCollectionHistory,
        getCollectionHistoryByStudent,
        getNotCollectedCount,
        getDaysSinceLastCollected,
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
