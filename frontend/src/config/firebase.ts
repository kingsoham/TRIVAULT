import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const getStoredFirebaseConfig = (): FirebaseConfigParams => {
  return {
    apiKey:
      localStorage.getItem('trivault_firebase_apiKey') ||
      (import.meta.env.VITE_FIREBASE_API_KEY as string) ||
      '',
    authDomain:
      localStorage.getItem('trivault_firebase_authDomain') ||
      (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ||
      '',
    projectId:
      localStorage.getItem('trivault_firebase_projectId') ||
      (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ||
      '',
    storageBucket:
      localStorage.getItem('trivault_firebase_storageBucket') ||
      (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ||
      '',
    messagingSenderId:
      localStorage.getItem('trivault_firebase_messagingSenderId') ||
      (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ||
      '',
    appId:
      localStorage.getItem('trivault_firebase_appId') ||
      (import.meta.env.VITE_FIREBASE_APP_ID as string) ||
      '',
  };
};

export const saveFirebaseConfig = (config: Partial<FirebaseConfigParams>) => {
  if (config.apiKey) localStorage.setItem('trivault_firebase_apiKey', config.apiKey.trim());
  if (config.authDomain) localStorage.setItem('trivault_firebase_authDomain', config.authDomain.trim());
  if (config.projectId) localStorage.setItem('trivault_firebase_projectId', config.projectId.trim());
  if (config.storageBucket) localStorage.setItem('trivault_firebase_storageBucket', config.storageBucket.trim());
  if (config.messagingSenderId) localStorage.setItem('trivault_firebase_messagingSenderId', config.messagingSenderId.trim());
  if (config.appId) localStorage.setItem('trivault_firebase_appId', config.appId.trim());
};

export const isFirebaseConfigured = (): boolean => {
  const config = getStoredFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export const getFirebaseInstance = (): { app: FirebaseApp | null; auth: Auth | null } => {
  if (authInstance) return { app: appInstance, auth: authInstance };

  const config = getStoredFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    return { app: null, auth: null };
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    authInstance = getAuth(appInstance);
    return { app: appInstance, auth: authInstance };
  } catch (err) {
    console.warn('[Firebase] Initialization warning:', err);
    return { app: null, auth: null };
  }
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
