import { collection, doc, setDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ActivityLog, ActivityActionType, ActivityModule, AppUser } from '../../types';

const STORAGE_KEY = 'skylimo_local_activity_logs';

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  notifyLogListeners();
}

function getCurrentUserFromStorage(): { id: string; email: string; name: string; role: 'admin' | 'staff' } {
  try {
    const saved = localStorage.getItem('skylimo_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        id: parsed.uid || 'usr-1',
        email: parsed.email || 'admin@skylimobh.com',
        name: parsed.displayName || parsed.email?.split('@')[0] || 'Admin',
        role: parsed.role || 'admin'
      };
    }
  } catch (_) {}

  return {
    id: 'usr-admin-1',
    email: 'admin@skylimobh.com',
    name: 'SkyLimo Admin',
    role: 'admin'
  };
}

export const ActivityService = {
  subscribe(callback: (logs: ActivityLog[]) => void): () => void {
    // 1. Immediate local cache emission (0ms)
    callback(getLocalActivityLogs());
    logListeners.add(callback);

    let unsubscribeFirestore = () => {};
    try {
      const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(300));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ActivityLog[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ActivityLog, 'id'>)
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            notifyLogListeners();
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      logListeners.delete(callback);
      unsubscribeFirestore();
    };
  },

  getAll(): ActivityLog[] {
    return getLocalActivityLogs();
  },

  getByUserId(userId: string): ActivityLog[] {
    return getLocalActivityLogs().filter((l) => l.userId === userId || l.userEmail === userId);
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
      userId: userInfo.id,
      userEmail: userInfo.email,
      userName: userInfo.name,
      userRole: userInfo.role,
      action: params.action,
      module: params.module,
      description: params.description,
      details: params.details,
      timestamp: new Date().toISOString()
    };

    const currentList = getLocalActivityLogs();
    // Keep most recent 500 logs
    const updatedList = [newLog, ...currentList].slice(0, 500);
    saveLocalActivityLogs(updatedList);

    try {
      await setDoc(doc(db, 'activity_logs', id), {
        ...newLog,
        createdAt: serverTimestamp()
      });
    } catch (_) {}

    return newLog;
  },

  async clearLocalLogs(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    notifyLogListeners();
  }
};
