import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  updatePassword,
  signOut as fbSignOut 
} from 'firebase/auth';
import { db, auth, firebaseConfig } from '../firebase/config';
import type { AppUser, UserRole } from '../../types';

const STORAGE_KEY = 'skylimo_local_users';
const CREDS_STORAGE_KEY = 'skylimo_user_credentials';

const INITIAL_USERS: AppUser[] = [
  {
    uid: 'usr-admin-1',
    email: 'admin@skylimobh.com',
    displayName: 'Administrator',
    role: 'admin',
    isActive: true
  },
  {
    uid: 'usr-staff-1',
    email: 'staff1@skylimobh.com',
    displayName: 'Staff 1',
    role: 'staff',
    isActive: true
  }
];

export function getLocalUsers(): AppUser[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return INITIAL_USERS;
  }
}

export function getUserCredentials(): Record<string, string> {
  const saved = localStorage.getItem(CREDS_STORAGE_KEY);
  if (!saved) {
    const initialCreds: Record<string, string> = {
      'admin@skylimobh.com': '1234567890',
      'staff1@skylimobh.com': '12345678'
    };
    localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(initialCreds));
    return initialCreds;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return {};
  }
}

export function saveUserCredential(email: string, pass: string) {
  const creds = getUserCredentials();
  creds[email.toLowerCase()] = pass;
  localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
}

const userListeners = new Set<(users: AppUser[]) => void>();

function notifyUserListeners() {
  const users = getLocalUsers();
  userListeners.forEach((cb) => {
    try {
      cb(users);
    } catch (_) {}
  });
}

function saveLocalUsers(users: AppUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  notifyUserListeners();
}

export const UserService = {
  subscribe(callback: (users: AppUser[]) => void): () => void {
    callback(getLocalUsers());
    userListeners.add(callback);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: AppUser[] = snapshot.docs.map((d) => ({
              uid: d.id,
              ...(d.data() as Omit<AppUser, 'uid'>)
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            notifyUserListeners();
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      userListeners.delete(callback);
      unsubscribeFirestore();
    };
  },

  async getAll(): Promise<AppUser[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) }));
      }
    } catch (_) {}
    return getLocalUsers();
  },

  /**
   * Creates a real user in Firebase Authentication & Firestore without signing out current admin
   */
  async createWithAuth(params: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }): Promise<AppUser> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.displayName.trim() || cleanEmail.split('@')[0];
    let assignedUid = 'usr-' + Date.now();

    // 1. Create in Firebase Auth via isolated secondary app (prevents admin logout)
    try {
      const tempAppName = `AddUserApp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      try {
        const cred = await createUserWithEmailAndPassword(tempAuth, cleanEmail, params.password);
        if (cred.user) {
          assignedUid = cred.user.uid;
          await updateProfile(cred.user, { displayName: cleanName });
        }
        await fbSignOut(tempAuth);
      } finally {
        await deleteApp(tempApp);
      }
    } catch (authErr: any) {
      console.warn('Firebase Auth user creation note:', authErr.message || authErr);
      // If user already exists in Firebase Auth or network fails, proceed with assigned/existing UID
    }

    // 2. Save credentials for immediate login verification
    saveUserCredential(cleanEmail, params.password);

    // 3. Create user object
    const newUser: AppUser = {
      uid: assignedUid,
      email: cleanEmail,
      displayName: cleanName,
      role: params.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // 4. Save to local storage & notify listeners
    const list = getLocalUsers();
    const filtered = list.filter((u) => u.email.toLowerCase() !== cleanEmail);
    saveLocalUsers([...filtered, newUser]);

    // 5. Save to Firestore
    try {
      await setDoc(doc(db, 'users', assignedUid), {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLoginAt: null
      });
    } catch (e) {
      console.warn('Firestore write queued:', e);
    }

    return newUser;
  },

  /**
   * Admin editing user details: name, role, status, and password
   */
  async updateUser(
    uid: string, 
    updates: { 
      displayName?: string; 
      role?: UserRole; 
      isActive?: boolean;
      password?: string;
    }
  ): Promise<void> {
    const list = getLocalUsers();
    const targetUser = list.find((u) => u.uid === uid);
    if (!targetUser) return;

    const updatedUser: AppUser = {
      ...targetUser,
      displayName: updates.displayName !== undefined ? updates.displayName.trim() : targetUser.displayName,
      role: updates.role !== undefined ? updates.role : targetUser.role,
      isActive: updates.isActive !== undefined ? updates.isActive : targetUser.isActive
    };

    const updatedList = list.map((u) => (u.uid === uid ? updatedUser : u));
    saveLocalUsers(updatedList);

    // Update password in credentials store if provided
    if (updates.password && updates.password.trim()) {
      saveUserCredential(targetUser.email, updates.password.trim());

      // If current logged-in user is updating their own password in Firebase Auth
      if (auth.currentUser && auth.currentUser.uid === uid) {
        try {
          await updatePassword(auth.currentUser, updates.password.trim());
        } catch (e) {
          console.warn('Firebase Auth password update note:', e);
        }
      }
    }

    // If current logged-in user is updating their own display name in Firebase Auth
    if (auth.currentUser && auth.currentUser.uid === uid && updates.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: updates.displayName.trim() });
      } catch (_) {}
    }

    // Update Firestore user document
    try {
      const docUpdates: any = {
        updatedAt: serverTimestamp()
      };
      if (updates.displayName !== undefined) docUpdates.displayName = updates.displayName.trim();
      if (updates.role !== undefined) docUpdates.role = updates.role;
      if (updates.isActive !== undefined) docUpdates.isActive = updates.isActive;

      await updateDoc(doc(db, 'users', uid), docUpdates);
    } catch (_) {}
  },

  async updateRole(uid: string, role: UserRole): Promise<void> {
    await this.updateUser(uid, { role });
  },

  async toggleActive(uid: string, currentStatus: boolean): Promise<void> {
    await this.updateUser(uid, { isActive: !currentStatus });
  },

  async delete(uid: string): Promise<void> {
    const list = getLocalUsers();
    const target = list.find((u) => u.uid === uid);
    const filtered = list.filter((u) => u.uid !== uid && (target ? u.email.toLowerCase() !== target.email.toLowerCase() : true));
    saveLocalUsers(filtered);

    if (target?.email) {
      const creds = getUserCredentials();
      delete creds[target.email.toLowerCase()];
      localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
    }

    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (_) {}
  }
};
