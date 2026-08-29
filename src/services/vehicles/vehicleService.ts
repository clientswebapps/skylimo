import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Vehicle } from '../../types';
import { INITIAL_VEHICLES } from '../../constants';

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

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'vehicles'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Vehicle[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Vehicle, 'id'>)
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            notifyVehicleListeners();
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      vehicleListeners.delete(callback);
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
    const list = getLocalVehicles().map((v) => (v.id === id ? { ...v, ...updates } : v));
    saveLocalVehicles(list);

    try {
      await updateDoc(doc(db, 'vehicles', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (_) {}
  },

  async toggleActive(id: string, currentStatus: boolean): Promise<void> {
    await this.update(id, { isActive: !currentStatus });
  },

  async delete(id: string): Promise<void> {
    const list = getLocalVehicles().filter((v) => v.id !== id);
    saveLocalVehicles(list);

    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (_) {}
  }
};
