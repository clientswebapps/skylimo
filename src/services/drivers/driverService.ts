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

export const DriverService = {
  subscribe(callback: (drivers: Driver[]) => void): () => void {
    // 1. Immediately emit cached drivers (0ms)
    callback(getLocalDrivers());
    driverListeners.add(callback);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'drivers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Driver[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Driver, 'id'>)
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            notifyDriverListeners();
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      driverListeners.delete(callback);
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
    const updatedList = list.map((d) => (d.id === id ? { ...d, ...updates } : d));
    saveLocalDrivers(updatedList);

    ActivityService.log({
      action: 'update',
      module: 'drivers',
      description: `Updated driver details for ${targetDriver?.name || id}`
    });

    try {
      await updateDoc(doc(db, 'drivers', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
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
