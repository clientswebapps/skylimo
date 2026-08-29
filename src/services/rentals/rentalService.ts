import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { CarRental } from '../../types';
import { ActivityService } from '../activity/activityService';

const STORAGE_KEY = 'skylimo_local_rentals';

const INITIAL_RENTALS: CarRental[] = [
  {
    id: 'rental-606',
    rowNumber: 606,
    agreementNumber: 'INV-009127',
    customerName: 'SWABIR TWALIB AHMED',
    contactNumber: '973 3375 4094',
    idNumber: '971047359',
    nationality: 'KENYA',
    carType: 'Toyota Yaris',
    carNumber: '624409',
    carModel: '2024',
    rentalDays: 1,
    rentDate: '2026-08-03',
    rentTime: '14:40',
    returnDate: '2026-08-04',
    returnTime: '13:37',
    rentPrice: 12.000,
    advancePayment: 12.000,
    remainingAmount: 0,
    depositAmount: 50.000,
    paymentStatus: 'PAID',
    note: '50BD DEPOSIT RETURN TO CUSTOMER',
    createdAt: '2026-08-03T14:40:00.000Z'
  },
  {
    id: 'rental-607',
    rowNumber: 607,
    agreementNumber: 'INV-009193',
    customerName: 'MOHAMMED NAASSER',
    contactNumber: '568555022',
    idNumber: '861112369',
    nationality: 'SAUDI',
    carType: 'Nissan Sunny',
    carNumber: '114505',
    carModel: '2023',
    rentalDays: 2,
    rentDate: '2026-08-09',
    rentTime: '16:50',
    returnDate: '2026-08-11',
    returnTime: '16:49',
    rentPrice: 18.000,
    advancePayment: 18.000,
    remainingAmount: 0,
    depositAmount: 0,
    paymentStatus: 'PAID',
    note: 'NO DEPOSIT',
    createdAt: '2026-08-09T16:50:00.000Z'
  },
  {
    id: 'rental-608',
    rowNumber: 608,
    agreementNumber: 'INV-009262',
    customerName: 'YOUSUF AHMAD MAHMOUD ABU MUSALLAM',
    contactNumber: '971509559888',
    idNumber: '',
    nationality: 'JORDAN',
    carType: 'Toyota Yaris',
    carNumber: '625696',
    carModel: '2024',
    rentalDays: 3,
    rentDate: '2026-08-16',
    rentTime: '17:44',
    returnDate: '2026-08-19',
    returnTime: '15:31',
    rentPrice: 50.000,
    advancePayment: 50.000,
    remainingAmount: 0,
    depositAmount: 50.000,
    paymentStatus: 'PAID',
    note: '50BD DEPOSIT RETURN TO AMIR',
    createdAt: '2026-08-16T17:44:00.000Z'
  },
  {
    id: 'rental-609',
    rowNumber: 609,
    agreementNumber: 'INV-009315',
    customerName: 'KHALID AL-KHALIFA',
    contactNumber: '973 3999 1234',
    idNumber: '880512341',
    nationality: 'BAHRAIN',
    carType: 'Toyota Camry',
    carNumber: '441209',
    carModel: '2025',
    rentalDays: 2,
    rentDate: '2026-08-29',
    rentTime: '10:00',
    returnDate: '2026-08-31',
    returnTime: '10:00',
    rentPrice: 35.000,
    advancePayment: 35.000,
    remainingAmount: 0,
    depositAmount: 50.000,
    paymentStatus: 'PAID',
    note: 'VIP AIRPORT RENTAL',
    createdAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 'rental-610',
    rowNumber: 610,
    agreementNumber: 'INV-009320',
    customerName: 'ALEXANDER WRIGHT',
    contactNumber: '44 7700 900123',
    idNumber: 'P884219',
    nationality: 'BRITISH',
    carType: 'Nissan Patrol',
    carNumber: '551203',
    carModel: '2024',
    rentalDays: 5,
    rentDate: '2026-08-29',
    rentTime: '14:30',
    returnDate: '2026-09-03',
    returnTime: '14:30',
    rentPrice: 120.000,
    advancePayment: 60.000,
    remainingAmount: 60.000,
    depositAmount: 100.000,
    paymentStatus: 'PARTIAL',
    note: 'CORP ACCOUNT DEPOSIT HELD',
    createdAt: '2026-08-29T14:30:00.000Z'
  }
];

export function getLocalRentals(): CarRental[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RENTALS));
    return INITIAL_RENTALS;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return INITIAL_RENTALS;
  }
}

const rentalListeners = new Set<(rentals: CarRental[]) => void>();

function notifyRentalListeners() {
  const rentals = getLocalRentals();
  rentalListeners.forEach((cb) => {
    try {
      cb(rentals);
    } catch (_) {}
  });
}

function saveLocalRentals(rentals: CarRental[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
  notifyRentalListeners();
}

function formatRentalFieldLabel(key: string): string {
  const map: Record<string, string> = {
    agreementNumber: 'Agreement #',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    carType: 'Car Type',
    carNumber: 'Car #',
    rentalDays: 'Rental Days',
    startDate: 'Start Date',
    endDate: 'End Date',
    dailyRate: 'Daily Rate (BHD)',
    totalAmount: 'Total Amount (BHD)',
    advancePayment: 'Advance Payment (BHD)',
    depositAmount: 'Deposit (BHD)',
    paymentStatus: 'Payment Status',
    notes: 'Notes'
  };
  return map[key] || key;
}

function getRentalChanges(targetRental?: CarRental, updates: Partial<CarRental> = {}): { summary: string; changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> } {
  if (!targetRental) return { summary: '', changes: [] };
  const changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
  const ignoredKeys = new Set(['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']);

  for (const [key, value] of Object.entries(updates)) {
    if (ignoredKeys.has(key) || value === undefined) continue;
    const oldVal = (targetRental as any)[key];
    const oldStr = oldVal !== undefined && oldVal !== null ? String(oldVal).trim() : '';
    const newStr = value !== undefined && value !== null ? String(value).trim() : '';
    if (oldStr !== newStr) {
      changes.push({
        field: key,
        label: formatRentalFieldLabel(key),
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

export const RentalService = {
  subscribe(callback: (rentals: CarRental[]) => void): () => void {
    callback(getLocalRentals());
    rentalListeners.add(callback);

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalRentals());
      }
    };
    window.addEventListener('storage', handleStorage);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'rentals'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CarRental[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<CarRental, 'id'>)
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            notifyRentalListeners();
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      rentalListeners.delete(callback);
      window.removeEventListener('storage', handleStorage);
      unsubscribeFirestore();
    };
  },

  async getAll(): Promise<CarRental[]> {
    try {
      const snap = await getDocs(collection(db, 'rentals'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarRental, 'id'>) }));
      }
    } catch (_) {}
    return getLocalRentals();
  },

  async getById(id: string): Promise<CarRental | null> {
    try {
      const docRef = doc(db, 'rentals', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<CarRental, 'id'>) };
      }
    } catch (_) {}
    const local = getLocalRentals();
    return local.find((r) => r.id === id) || null;
  },

  async create(data: Omit<CarRental, 'id'>): Promise<CarRental> {
    const list = getLocalRentals();
    const id = 'rental-' + Date.now();
    const maxRowNumber = list.reduce((max, r) => Math.max(max, r.rowNumber || 0), 600);
    const rowNumber = data.rowNumber || (maxRowNumber + 1);

    const newRental: CarRental = {
      ...data,
      id,
      rowNumber,
      createdAt: new Date().toISOString()
    };

    saveLocalRentals([newRental, ...list]);

    // Activity Log
    ActivityService.log({
      action: 'create',
      module: 'rentals',
      description: `Created Car Rental Agreement ${newRental.agreementNumber || id} for ${newRental.customerName || 'Customer'} (${newRental.carType} #${newRental.carNumber} - ${newRental.rentalDays} Days)`,
      details: { agreementNumber: newRental.agreementNumber, customer: newRental.customerName, carNumber: newRental.carNumber }
    });

    try {
      await setDoc(doc(db, 'rentals', id), {
        ...newRental,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore rental creation queued:', e);
    }

    return newRental;
  },

  async update(id: string, updates: Partial<CarRental>): Promise<void> {
    const list = getLocalRentals();
    const targetRental = list.find((r) => r.id === id);
    const diff = getRentalChanges(targetRental, updates);

    const updatedList = list.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
    saveLocalRentals(updatedList);

    // Activity Log
    ActivityService.log({
      action: 'update',
      module: 'rentals',
      description: `Updated Car Rental Agreement ${targetRental?.agreementNumber || id} (${targetRental?.customerName || 'Customer'}): ${diff.summary}`,
      details: { 
        agreementNumber: targetRental?.agreementNumber, 
        customer: targetRental?.customerName,
        changes: diff.changes,
        updates 
      }
    });

    try {
      const payload = sanitizeForFirestore({
        ...updates,
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'rentals', id), payload);
    } catch (e) {
      console.warn('Firestore rental update queued:', e);
    }
  },

  async delete(id: string): Promise<void> {
    const list = getLocalRentals();
    const targetRental = list.find((r) => r.id === id);
    const filteredList = list.filter((r) => r.id !== id);
    saveLocalRentals(filteredList);

    // Activity Log
    ActivityService.log({
      action: 'delete',
      module: 'rentals',
      description: `Deleted Car Rental Agreement ${targetRental?.agreementNumber || id} (${targetRental?.customerName || 'Customer'})`,
      details: { agreementNumber: targetRental?.agreementNumber }
    });

    try {
      await deleteDoc(doc(db, 'rentals', id));
    } catch (e) {
      console.warn('Firestore rental delete queued:', e);
    }
  },

  getNextAgreementNumber(): string {
    const list = getLocalRentals();
    let maxNum = 9300;
    list.forEach((r) => {
      const match = r.agreementNumber?.match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });
    return `INV-${String(maxNum + 1).padStart(6, '0')}`;
  }
};
