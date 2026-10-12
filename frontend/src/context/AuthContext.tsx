import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { getFirebaseInstance, googleProvider } from '../config/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'user' | 'admin';
  authProvider?: 'local' | 'firebase';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'owner' | 'user' | 'admin') => Promise<void>;
  loginWithGoogle: (role?: 'owner' | 'user') => Promise<void>;
  loginWithFirebaseEmail: (email: string, password: string, role?: 'owner' | 'user') => Promise<void>;
  registerWithFirebaseEmail: (name: string, email: string, password: string, role: 'owner' | 'user') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trivault_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('trivault_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('trivault_user', JSON.stringify(res.data.user));
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('trivault_token', newToken);
    localStorage.setItem('trivault_user', JSON.stringify(newUser));
  };

  const register = async (name: string, email: string, password: string, role?: 'owner' | 'user' | 'admin') => {
    const res = await api.post('/auth/register', { name, email, password, role: role || 'owner' });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('trivault_token', newToken);
    localStorage.setItem('trivault_user', JSON.stringify(newUser));
  };

  const loginWithGoogle = async (role: 'owner' | 'user' = 'owner') => {
    const { auth } = getFirebaseInstance();
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please set your Firebase config first.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const res = await api.post('/auth/firebase-sync', {
      idToken,
      email: result.user.email,
      name: result.user.displayName || result.user.email?.split('@')[0],
      firebaseUid: result.user.uid,
      role,
    });

    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('trivault_token', newToken);
    localStorage.setItem('trivault_user', JSON.stringify(newUser));
  };

  const loginWithFirebaseEmail = async (email: string, password: string, role: 'owner' | 'user' = 'owner') => {
    const { auth } = getFirebaseInstance();
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please set your Firebase config first.');
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();

    const res = await api.post('/auth/firebase-sync', {
      idToken,
      email: result.user.email,
      name: result.user.displayName || email.split('@')[0],
      firebaseUid: result.user.uid,
      role,
    });

    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('trivault_token', newToken);
    localStorage.setItem('trivault_user', JSON.stringify(newUser));
  };

  const registerWithFirebaseEmail = async (name: string, email: string, password: string, role: 'owner' | 'user') => {
    const { auth } = getFirebaseInstance();
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please set your Firebase config first.');
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    const idToken = await result.user.getIdToken();

    const res = await api.post('/auth/firebase-sync', {
      idToken,
      email: result.user.email,
      name,
      firebaseUid: result.user.uid,
      role,
    });

    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('trivault_token', newToken);
    localStorage.setItem('trivault_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('trivault_token');
    localStorage.removeItem('trivault_user');

    const { auth } = getFirebaseInstance();
    if (auth) {
      signOut(auth).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithFirebaseEmail,
        registerWithFirebaseEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
