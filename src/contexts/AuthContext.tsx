import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

// Local users for demo purposes
const LOCAL_USERS = {
  'admin@abbskp.sch.id': {
    password: 'admin123',
    name: 'Administrator',
    role: 'admin' as UserRole,
  },
  'petugas@abbskp.sch.id': {
    password: 'petugas123',
    name: 'Petugas',
    role: 'petugas' as UserRole,
  },
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load local user from localStorage on initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('localUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('localUser');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.email?.split('@')[0] || 'User',
              role: firebaseUser.email === 'admin@abbskp.sch.id' ? 'admin' : (userData.role as UserRole || 'petugas'),
            });
          } else {
            // If no user document exists, set default role
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.email?.split('@')[0] || 'User',
              role: firebaseUser.email === 'admin@abbskp.sch.id' ? 'admin' : 'petugas',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.email?.split('@')[0] || 'User',
            role: 'petugas',
          });
        }
      } else {
        // Only clear user if it's not a local user
        if (user && !user.id.startsWith('local-')) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Try local authentication first
    const localUser = LOCAL_USERS[email];
    if (localUser && localUser.password === password) {
      const userData = {
        id: `local-${email}`,
        email,
        name: localUser.name,
        role: localUser.role,
      };
      setUser(userData);
      localStorage.setItem('localUser', JSON.stringify(userData));
      return { success: true };
    }

    // If local auth fails, try Firebase
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('FIREBASE LOGIN FAILED:', error.code, error.message);
      let errorMessage = 'Login gagal. Silakan coba lagi.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak ditemukan.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password salah.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah.';
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase if authenticated
      await signOut(auth);
    } catch (error) {
      console.error('Firebase logout error:', error);
    } finally {
      // Always clear the user state (for both demo and Firebase users)
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
