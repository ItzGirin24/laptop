export type UserRole = 'admin' | 'petugas';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ClassName = 'XA' | 'XB' | 'XIA' | 'XIB' | 'XIC' | 'XIIA' | 'XIIB' | 'XIIC';

export type CollectionStatus = 'collected' | 'not_collected';

export interface Student {
  id: string;
  name: string;
  studentNumber: number;
  className: ClassName;
  lockerNumber: string;
  collectionStatus: CollectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaptopPermission {
  id: string;
  studentId: string;
  studentName: string;
  className: ClassName;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: Date;
}

export interface Confiscation {
  id: string;
  studentId: string;
  studentName: string;
  className: ClassName;
  lockerNumber: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  status: 'active' | 'returned' | 'cancelled';
  returnedAt?: Date;
  createdAt: Date;
}

export interface ClassStats {
  className: ClassName;
  total: number;
  collected: number;
  notCollected: number;
  percentage: number;
}

export interface CollectionHistory {
  id: string;
  studentId: string;
  status: CollectionStatus;
  date: Date;
  createdAt: Date;
}

export const CLASS_LIST: ClassName[] = ['XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC'];
