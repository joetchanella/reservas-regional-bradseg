import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let firestoreInstance;
try {
  if (typeof window !== 'undefined') {
    firestoreInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } else {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: null,
      email: null,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot using an allowed collection document ('units/belem')
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'units', 'belem'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or checking connection:', error.message);
    }
    return false;
  }
}
