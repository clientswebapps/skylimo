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
            const list: Vehicle[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Vehicle, 'id'>)
            }));
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

  async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const id = 'veh-' + Date.now();
    const newVehicle: Vehicle = { ...vehicle, id, isActive: true };
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
    const updatedList = list.map((v) => (v.id === id ? { ...v, ...updates } : v));
    saveLocalVehicles(updatedList);

    ActivityService.log({
      action: 'update',
      module: 'vehicles',
      description: `Updated vehicle details for #${targetVehicle?.carNumber || id}`
    });

    try {
      await updateDoc(doc(db, 'vehicles', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
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
