import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Driver } from '../../types';
import { INITIAL_DRIVERS } from '../../constants';
import { ActivityService } from '../activity/activityService';

const STORAGE_KEY = 'skylimo_local_drivers';

export function getLocalDrivers(): Driver[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DRIVERS));
    return INITIAL_DRIVERS;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return INITIAL_DRIVERS;
  }
}

const driverListeners = new Set<(drivers: Driver[]) => void>();

function notifyDriverListeners() {
  const drivers = getLocalDrivers();
  driverListeners.forEach((cb) => {
    try {
      cb(drivers);
    } catch (_) {}
  });
}

function saveLocalDrivers(drivers: Driver[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
  notifyDriverListeners();
}

function formatDriverFieldLabel(key: string): string {
  const map: Record<string, string> = {
    name: 'Driver Name',
    phone: 'Phone Number',
    isActive: 'Status',
    notes: 'Operational Notes'
  };
  return map[key] || key;
}

function getDriverChanges(targetDriver?: Driver, updates: Partial<Driver> = {}): { summary: string; changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> } {
  if (!targetDriver) return { summary: '', changes: [] };
  const changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
  const ignoredKeys = new Set(['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']);

  for (const [key, value] of Object.entries(updates)) {
    if (ignoredKeys.has(key) || value === undefined) continue;
    const oldVal = (targetDriver as any)[key];
    const oldStr = typeof oldVal === 'boolean' ? (oldVal ? 'Active' : 'Inactive') : (oldVal !== undefined && oldVal !== null ? String(oldVal).trim() : '');
    const newStr = typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : (value !== undefined && value !== null ? String(value).trim() : '');
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        label: formatDriverFieldLabel(key),
        oldVal: oldStr || '(empty)',
        newVal: newStr || '(empty)'
      });
    }
  }

  const changeSummaries = changes.map((c) => `${c.label}: "${c.oldVal}" → "${c.newVal}"`);
  const summary = changeSummaries.length > 0 ? changeSummaries.join(', ') : 'Updated details';

  return { summary, changes };
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

export const DriverService = {
  subscribe(callback: (drivers: Driver[]) => void): () => void {
    // 1. Immediately emit cached drivers (0ms)
    callback(getLocalDrivers());
    driverListeners.add(callback);

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalDrivers());
      }
    };
    window.addEventListener('storage', handleStorage);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'drivers'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const list: Driver[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Driver, 'id'>)
            }));
            saveLocalDrivers(list);
          } else {
            // Seed all initial drivers only if collection is empty
            for (const seed of INITIAL_DRIVERS) {
              try {
                await setDoc(doc(db, 'drivers', seed.id), {
                  ...seed,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              } catch (_) {}
            }
            saveLocalDrivers(INITIAL_DRIVERS);
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      driverListeners.delete(callback);
      window.removeEventListener('storage', handleStorage);
      unsubscribeFirestore();
    };
  },

  getAll(): Driver[] {
    return getLocalDrivers();
  },

  async create(driver: Omit<Driver, 'id'>): Promise<Driver> {
    const id = 'drv-' + Date.now();
    const newDriver: Driver = { ...driver, id, isActive: true };
    const list = getLocalDrivers();
    saveLocalDrivers([...list, newDriver]);

    ActivityService.log({
      action: 'create',
      module: 'drivers',
      description: `Added new driver ${newDriver.name} (${newDriver.phone || 'No phone'})`
    });

    try {
      await setDoc(doc(db, 'drivers', id), {
        ...newDriver,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (_) {}

    return newDriver;
  },

  async update(id: string, updates: Partial<Driver>): Promise<void> {
    const list = getLocalDrivers();
    const targetDriver = list.find((d) => d.id === id);
    const diff = getDriverChanges(targetDriver, updates);

    const updatedList = list.map((d) => (d.id === id ? { ...d, ...updates } : d));
    saveLocalDrivers(updatedList);

    ActivityService.log({
      action: 'update',
      module: 'drivers',
      description: `Updated driver details for ${targetDriver?.name || id}: ${diff.summary}`,
      details: {
        driverName: targetDriver?.name,
        changes: diff.changes,
        updates
      }
    });

    try {
      const payload = sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'drivers', id), payload);
    } catch (_) {}
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<void> {
    const list = getLocalDrivers();
    const targetDriver = list.find((d) => d.id === id);
    await this.update(id, { isActive: !currentStatus });

    ActivityService.log({
      action: 'status_change',
      module: 'drivers',
      description: `${currentStatus ? 'Deactivated' : 'Activated'} driver ${targetDriver?.name || id}`
    });
  },

  async delete(id: string): Promise<void> {
    const list = getLocalDrivers();
    const targetDriver = list.find((d) => d.id === id);
    const filteredList = list.filter((d) => d.id !== id);
    saveLocalDrivers(filteredList);

    ActivityService.log({
      action: 'delete',
      module: 'drivers',
      description: `Deleted driver ${targetDriver?.name || id}`
    });

    try {
      await deleteDoc(doc(db, 'drivers', id));
    } catch (_) {}
  }
};
