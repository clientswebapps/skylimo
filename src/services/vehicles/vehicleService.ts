import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Vehicle } from '../../types';
import { INITIAL_VEHICLES } from '../../constants';
import { ActivityService } from '../activity/activityService';

const STORAGE_KEY = 'skylimo_local_vehicles';

export function getLocalVehicles(): Vehicle[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
    return INITIAL_VEHICLES;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return INITIAL_VEHICLES;
  }
}

const vehicleListeners = new Set<(vehicles: Vehicle[]) => void>();

function notifyVehicleListeners() {
  const vehicles = getLocalVehicles();
  vehicleListeners.forEach((cb) => {
    try {
      cb(vehicles);
    } catch (_) {}
  });
}

function saveLocalVehicles(vehicles: Vehicle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  notifyVehicleListeners();
}

function formatVehicleFieldLabel(key: string): string {
  const map: Record<string, string> = {
    carNumber: 'Plate #',
    carType: 'Model/Make',
    category: 'Category',
    dailyRate: 'Daily Rate (BHD)',
    isActive: 'Status',
    notes: 'Operational Notes'
  };
  return map[key] || key;
}

function getVehicleChanges(targetVehicle?: Vehicle, updates: Partial<Vehicle> = {}): { summary: string; changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> } {
  if (!targetVehicle) return { summary: '', changes: [] };
  const changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
  const ignoredKeys = new Set(['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']);

  for (const [key, value] of Object.entries(updates)) {
    if (ignoredKeys.has(key) || value === undefined) continue;
    const oldVal = (targetVehicle as any)[key];
    const oldStr = typeof oldVal === 'boolean' ? (oldVal ? 'Active' : 'Inactive') : (oldVal !== undefined && oldVal !== null ? String(oldVal).trim() : '');
    const newStr = typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : (value !== undefined && value !== null ? String(value).trim() : '');
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        label: formatVehicleFieldLabel(key),
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

export const VehicleService = {
  subscribe(callback: (vehicles: Vehicle[]) => void): () => void {
    // 1. Immediately emit cached vehicles (0ms)
    callback(getLocalVehicles());
    vehicleListeners.add(callback);

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalVehicles());
      }
    };
    window.addEventListener('storage', handleStorage);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'vehicles'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const list: Vehicle[] = snapshot.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                ...data,
                purpose: data.purpose || 'trips'
              };
            });
            saveLocalVehicles(list);
          } else {
            // Seed all initial vehicles only if collection is empty
            for (const seed of INITIAL_VEHICLES) {
              try {
                await setDoc(doc(db, 'vehicles', seed.id), {
                  ...seed,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              } catch (_) {}
            }
            saveLocalVehicles(INITIAL_VEHICLES);
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      vehicleListeners.delete(callback);
      window.removeEventListener('storage', handleStorage);
      unsubscribeFirestore();
    };
  },

  getAll(): Vehicle[] {
    return getLocalVehicles();
  },

  getForTrips(): Vehicle[] {
    return getLocalVehicles().filter((v) => v.isActive && (!v.purpose || v.purpose === 'trips' || v.purpose === 'both'));
  },

  getForRentals(): Vehicle[] {
    return getLocalVehicles().filter((v) => v.isActive && (v.purpose === 'rentals' || v.purpose === 'both'));
  },

  async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const id = 'veh-' + Date.now();
    const newVehicle: Vehicle = { 
      ...vehicle, 
      id, 
      purpose: vehicle.purpose || 'trips',
      isActive: true 
    };
    const list = getLocalVehicles();
    saveLocalVehicles([...list, newVehicle]);

    ActivityService.log({
      action: 'create',
      module: 'vehicles',
      description: `Added vehicle #${newVehicle.carNumber} (${newVehicle.carType})`
    });

    try {
      await setDoc(doc(db, 'vehicles', id), {
        ...newVehicle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (_) {}

    return newVehicle;
  },

  async update(id: string, updates: Partial<Vehicle>): Promise<void> {
    const list = getLocalVehicles();
    const targetVehicle = list.find((v) => v.id === id);
    const diff = getVehicleChanges(targetVehicle, updates);

    const updatedList = list.map((v) => (v.id === id ? { ...v, ...updates } : v));
    saveLocalVehicles(updatedList);

    ActivityService.log({
      action: 'update',
      module: 'vehicles',
      description: `Updated vehicle details for #${targetVehicle?.carNumber || id}: ${diff.summary}`,
      details: {
        carNumber: targetVehicle?.carNumber,
        carType: targetVehicle?.carType,
        changes: diff.changes,
        updates
      }
    });

    try {
      const payload = sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'vehicles', id), payload);
    } catch (_) {}
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<void> {
    const list = getLocalVehicles();
    const targetVehicle = list.find((v) => v.id === id);
    await this.update(id, { isActive: !currentStatus });

    ActivityService.log({
      action: 'status_change',
      module: 'vehicles',
      description: `${currentStatus ? 'Deactivated' : 'Activated'} vehicle #${targetVehicle?.carNumber || id}`
    });
  },

  async delete(id: string): Promise<void> {
    const list = getLocalVehicles();
    const targetVehicle = list.find((v) => v.id === id);
    const filteredList = list.filter((v) => v.id !== id);
    saveLocalVehicles(filteredList);

    ActivityService.log({
      action: 'delete',
      module: 'vehicles',
      description: `Deleted vehicle #${targetVehicle?.carNumber || id}`
    });

    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (_) {}
  }
};
