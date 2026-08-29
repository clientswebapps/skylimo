import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ActivityLog, ActivityActionType, ActivityModule, AppUser } from '../../types';

const STORAGE_KEY = 'skylimo_local_activity_logs';
const MAX_LOGS_LIMIT = 500;

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    userId: 'usr-admin-1',
    userEmail: 'admin@skylimobh.com',
    userName: 'SkyLimo Admin',
    userRole: 'admin',
    action: 'create',
    module: 'bookings',
    description: 'Created Booking Agreement INV-008742 for customer SWABIR TWALIB AHMED (Toyota Yaris #624409)',
    timestamp: '2026-08-29T04:20:00.000Z'
  },
  {
    id: 'log-002',
    userId: 'usr-staff-1',
    userEmail: 'staff1@skylimobh.com',
    userName: 'Dispatcher Staff 1',
    userRole: 'staff',
    action: 'create',
    module: 'rentals',
    description: 'Generated Car Rental Agreement INV-009127 (Toyota Yaris #624409 - 1 Day)',
    timestamp: '2026-08-29T03:50:00.000Z'
  },
  {
    id: 'log-003',
    userId: 'usr-admin-1',
    userEmail: 'admin@skylimobh.com',
    userName: 'SkyLimo Admin',
    userRole: 'admin',
    action: 'update',
    module: 'drivers',
    description: 'Updated operational notes for driver MOHAMMED',
    timestamp: '2026-08-29T03:15:00.000Z'
  },
  {
    id: 'log-004',
    userId: 'usr-staff-1',
    userEmail: 'staff1@skylimobh.com',
    userName: 'Dispatcher Staff 1',
    userRole: 'staff',
    action: 'update',
    module: 'bookings',
    description: 'Updated payment status to PAID for booking INV-008711',
    timestamp: '2026-08-29T02:40:00.000Z'
  },
  {
    id: 'log-005',
    userId: 'usr-admin-1',
    userEmail: 'admin@skylimobh.com',
    userName: 'SkyLimo Admin',
    userRole: 'admin',
    action: 'create',
    module: 'users',
    description: 'Added new dispatcher staff account: staff1@skylimobh.com',
    timestamp: '2026-08-29T01:05:00.000Z'
  },
  {
    id: 'log-006',
    userId: 'usr-staff-1',
    userEmail: 'staff1@skylimobh.com',
    userName: 'Dispatcher Staff 1',
    userRole: 'staff',
    action: 'login',
    module: 'auth',
    description: 'Staff user logged in successfully to Operations portal',
    timestamp: '2026-08-29T00:55:00.000Z'
  }
];

export function getLocalActivityLogs(): ActivityLog[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return INITIAL_LOGS;
  }
}

const logListeners = new Set<(logs: ActivityLog[]) => void>();

function notifyLogListeners() {
  const logs = getLocalActivityLogs();
  logListeners.forEach((cb) => {
    try {
      cb(logs);
    } catch (_) {}
  });
}

function saveLocalActivityLogs(logs: ActivityLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS_LIMIT)));
  notifyLogListeners();
}

function getCurrentUserFromStorage(): { id: string; email: string; name: string; role: 'admin' | 'staff' } {
  try {
    const saved = localStorage.getItem('skylimo_user_session') || localStorage.getItem('skylimo_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      const email = (parsed.email || '').trim().toLowerCase();
      const role = email === 'admin@skylimobh.com' ? 'admin' : (parsed.role === 'admin' ? 'staff' : (parsed.role || 'staff'));
      return {
        id: parsed.uid || parsed.id || 'usr-staff-1',
        email: email || 'staff1@skylimobh.com',
        name: parsed.displayName || parsed.name || (email ? email.split('@')[0] : 'Staff'),
        role: role as 'admin' | 'staff'
      };
    }
  } catch (_) {}

  return {
    id: 'usr-staff-1',
    email: 'staff1@skylimobh.com',
    name: 'Dispatcher Staff',
    role: 'staff'
  };
}

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned;
}

// Background auto-pruning for logs beyond the 500 limit
async function pruneOldLogsFromFirestore(list: ActivityLog[]) {
  if (list.length <= MAX_LOGS_LIMIT) return;
  const excessLogs = list.slice(MAX_LOGS_LIMIT);
  try {
    for (const oldLog of excessLogs) {
      if (oldLog && oldLog.id) {
        await deleteDoc(doc(db, 'activity_logs', oldLog.id));
      }
    }
  } catch (err) {
    console.warn('Auto-pruning old activity logs note:', err);
  }
}

export const ActivityService = {
  subscribe(callback: (logs: ActivityLog[]) => void): () => void {
    // 1. Immediate local cache emission (0ms)
    callback(getLocalActivityLogs());
    logListeners.add(callback);

    // Cross-tab / cross-window sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalActivityLogs());
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'activity_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ActivityLog[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ActivityLog, 'id'>)
            }));
            // Reliable descending sort by timestamp
            list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            
            const top500 = list.slice(0, MAX_LOGS_LIMIT);
            saveLocalActivityLogs(top500);

            // Auto-delete succeeding excess logs from Firestore
            if (list.length > MAX_LOGS_LIMIT) {
              pruneOldLogsFromFirestore(list);
            }
          }
        },
        (err) => {
          console.warn('Activity logs Firestore subscription note:', err);
        }
      );
    } catch (e) {
      console.warn('Activity logs subscription error:', e);
    }

    return () => {
      logListeners.delete(callback);
      window.removeEventListener('storage', handleStorageChange);
      unsubscribeFirestore();
    };
  },

  getAll(): ActivityLog[] {
    return getLocalActivityLogs();
  },

  getByUserId(userId: string): ActivityLog[] {
    const clean = (userId || '').trim().toLowerCase();
    const prefix = clean.includes('@') ? clean.split('@')[0] : clean;
    return getLocalActivityLogs().filter((l) => {
      const lUid = (l.userId || '').trim().toLowerCase();
      const lEmail = (l.userEmail || '').trim().toLowerCase();
      const lName = (l.userName || '').trim().toLowerCase();
      const lPrefix = lEmail.includes('@') ? lEmail.split('@')[0] : lEmail;

      return (
        (lUid && lUid === clean) ||
        (lEmail && lEmail === clean) ||
        (lName && (lName === clean || lName.includes(clean) || clean.includes(lName))) ||
        (prefix && (lPrefix === prefix || lUid.includes(prefix)))
      );
    });
  },

  async log(params: {
    action: ActivityActionType;
    module: ActivityModule;
    description: string;
    user?: AppUser | null;
    details?: Record<string, any>;
  }): Promise<ActivityLog> {
    const userInfo = params.user
      ? {
          id: params.user.uid,
          email: params.user.email,
          name: params.user.displayName || params.user.email.split('@')[0],
          role: params.user.role
        }
      : getCurrentUserFromStorage();

    const id = 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newLog: ActivityLog = {
      id,
      userId: userInfo.id || 'usr-staff-1',
      userEmail: userInfo.email || 'staff1@skylimobh.com',
      userName: userInfo.name || 'Staff',
      userRole: userInfo.role || 'staff',
      action: params.action,
      module: params.module,
      description: params.description || '',
      details: sanitizeForFirestore(params.details || {}),
      timestamp: new Date().toISOString()
    };

    const currentList = getLocalActivityLogs();
    const combined = [newLog, ...currentList.filter((l) => l.id !== id)];
    const top500 = combined.slice(0, MAX_LOGS_LIMIT);
    saveLocalActivityLogs(top500);

    try {
      const payload = sanitizeForFirestore({
        ...newLog,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'activity_logs', id), payload);

      // Auto-prune any overflow logs
      if (combined.length > MAX_LOGS_LIMIT) {
        pruneOldLogsFromFirestore(combined);
      }
    } catch (e) {
      console.warn('Activity log Firestore write note:', e);
    }

    return newLog;
  },

  async clearAllLogs(adminUser?: AppUser | null): Promise<void> {
    // 1. Clear local cache
    saveLocalActivityLogs([]);

    // 2. Batch delete all documents in Firestore collection 'activity_logs'
    try {
      const snap = await getDocs(collection(db, 'activity_logs'));
      const batchSize = 400;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn('Error clearing activity logs in Firestore:', e);
    }

    // 3. Add clean audit marker that logs were cleared
    const adminEmail = adminUser?.email || 'admin@skylimobh.com';
    const adminName = adminUser?.displayName || 'Administrator';
    
    await this.log({
      action: 'delete',
      module: 'users',
      description: `All activity logs were cleared and reset by ${adminName} (${adminEmail})`,
      user: adminUser
    });
  },

  async clearLocalLogs(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    notifyLogListeners();
  }
};
