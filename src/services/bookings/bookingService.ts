import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Booking, BookingFilter } from '../../types';
import { getTodayYMD } from '../../utils/dateUtils';
import { ActivityService } from '../activity/activityService';

const COLLECTION_NAME = 'bookings';

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bkg-1',
    invoice: '640315',
    date: '2026-08-24',
    customer: 'Osman',
    mobilePhone: '+973 3881 2940',
    time: '08:00',
    from: 'Bahrain Airport',
    to: 'Four Seasons Hotel',
    flight: 'GF 215',
    carTimeOut: '07:30',
    carTimeIn: '09:15',
    carType: 'SUV',
    carNumber: '640315',
    cash: 35.000,
    card: 0,
    bankTransfer: 0,
    credit: 0,
    commission: 5.000,
    driver: 'ISA',
    status: 'Completed',
    note: 'VIP Guest — Flight arrived on time'
  },
  {
    id: 'bkg-2',
    invoice: '640316',
    date: '2026-08-24',
    customer: 'Khalid Al-Nuaimi',
    mobilePhone: '+973 3945 8821',
    time: '10:30',
    from: 'Ritz Carlton',
    to: 'Bahrain Airport',
    flight: 'RJ 672',
    carTimeOut: '10:00',
    carTimeIn: '11:45',
    carType: 'Sedan',
    carNumber: '529184',
    cash: 0,
    card: 40.000,
    bankTransfer: 0,
    credit: 0,
    commission: 0,
    driver: 'AMIR',
    status: 'Confirmed',
    note: 'Terminal 1 drop-off'
  },
  {
    id: 'bkg-3',
    invoice: '640317',
    date: '2026-08-24',
    customer: 'Sarah Jenkins',
    mobilePhone: '+44 7700 900123',
    time: '14:00',
    from: 'The Diplomat Radisson',
    to: 'Bahrain Int. Circuit',
    flight: '',
    carTimeOut: '13:30',
    carTimeIn: '16:00',
    carType: 'Van',
    carNumber: '418290',
    cash: 0,
    card: 0,
    bankTransfer: 65.000,
    credit: 0,
    commission: 10.000,
    driver: 'HUSSAIN',
    status: 'Confirmed',
    note: 'Corporate delegation 5 pax'
  },
  {
    id: 'bkg-4',
    invoice: '640318',
    date: '2026-08-24',
    customer: 'Ahmed Mansoor',
    mobilePhone: '+973 3611 4455',
    time: '18:45',
    from: 'Bahrain Airport',
    to: 'Amwaj Islands',
    flight: 'EK 837',
    carTimeOut: '18:15',
    carTimeIn: '20:00',
    carType: 'Luxury Sedan',
    carNumber: '731902',
    cash: 0,
    card: 0,
    bankTransfer: 0,
    credit: 45.000,
    commission: 0,
    driver: 'ALI',
    status: 'Pending',
    note: 'Credit account booking'
  },
  {
    id: 'bkg-5',
    invoice: '640319',
    date: '2026-08-25',
    customer: 'Dr. Tariq',
    mobilePhone: '+973 3322 1100',
    time: '09:00',
    from: 'Saar',
    to: 'Bahrain Airport',
    flight: 'BA 124',
    carTimeOut: '08:30',
    carTimeIn: '10:00',
    carType: 'SUV',
    carNumber: '640315',
    cash: 30.000,
    card: 0,
    bankTransfer: 0,
    credit: 0,
    commission: 0,
    driver: 'ISA',
    status: 'Confirmed',
    note: 'Child safety seat needed'
  }
];

export function generateSeedBookings(): Booking[] {
  const today = getTodayYMD();

  return [
    // --- TODAY'S SCHEDULE (8 Rich Sample Trips) ---
    {
      id: 'bkg-today-1',
      invoice: '640320',
      date: today,
      customer: 'VIP Ambassador Al-Sabah',
      mobilePhone: '+973 3988 7711',
      time: '08:00',
      from: 'Bahrain International Airport',
      to: 'Four Seasons Hotel Bahrain Bay',
      flight: 'GF 215',
      carTimeOut: '07:30',
      carTimeIn: '09:15',
      carType: 'VIP',
      carNumber: '640315',
      cash: 55.000,
      card: 0,
      bankTransfer: 0,
      credit: 0,
      commission: 8.000,
      driver: 'ISA',
      status: 'Confirmed',
      note: 'VIP Protocol — meet at Presidential Lounge'
    },
    {
      id: 'bkg-today-2',
      invoice: '640321',
      date: today,
      customer: 'Dr. Tariq Al-Hassan',
      mobilePhone: '+973 3322 1100',
      time: '10:15',
      from: 'Ritz-Carlton Bahrain',
      to: 'Bahrain Airport Terminal 1',
      flight: 'RJ 672',
      carTimeOut: '09:45',
      carTimeIn: '11:30',
      carType: 'SUV',
      carNumber: '640315',
      cash: 0,
      card: 40.000,
      bankTransfer: 0,
      credit: 0,
      commission: 0,
      driver: 'AMIR',
      status: 'Confirmed',
      note: 'Terminal 1 Departures drop-off'
    },
    {
      id: 'bkg-today-3',
      invoice: '640322',
      date: today,
      customer: 'Bahrain Bay Executive Delegation',
      mobilePhone: '+973 3611 4455',
      time: '12:30',
      from: 'Four Seasons Hotel',
      to: 'Bahrain Financial Harbour',
      flight: '',
      carTimeOut: '12:00',
      carTimeIn: '14:00',
      carType: 'Van',
      carNumber: '418290',
      cash: 0,
      card: 0,
      bankTransfer: 65.000,
      credit: 0,
      commission: 10.000,
      driver: 'HUSSAIN',
      status: 'Confirmed',
      note: 'Corporate delegation 6 executives'
    },
    {
      id: 'bkg-today-4',
      invoice: '640323',
      date: today,
      customer: 'Sarah Jenkins',
      mobilePhone: '+44 7700 900123',
      time: '14:45',
      from: 'The Diplomat Radisson Blu',
      to: 'Bahrain International Circuit (BIC)',
      flight: '',
      carTimeOut: '14:15',
      carTimeIn: '16:45',
      carType: 'Luxury Sedan',
      carNumber: '731902',
      cash: 0,
      card: 0,
      bankTransfer: 0,
      credit: 45.000,
      commission: 0,
      driver: 'ALI',
      status: 'Confirmed',
      note: 'Motorsport executive transfer'
    },
    {
      id: 'bkg-today-5',
      invoice: '640324',
      date: today,
      customer: 'Captain Robert Miller',
      mobilePhone: '+973 3881 2940',
      time: '17:00',
      from: 'Gulf Air Headquarters',
      to: 'Amwaj Islands Lagoon',
      flight: 'BA 124',
      carTimeOut: '16:30',
      carTimeIn: '18:30',
      carType: 'Sedan',
      carNumber: '529184',
      cash: 30.000,
      card: 0,
      bankTransfer: 0,
      credit: 0,
      commission: 5.000,
      driver: 'MOHAMMED',
      status: 'Confirmed',
      note: 'Flight crew pickup'
    },
    {
      id: 'bkg-today-6',
      invoice: '640325',
      date: today,
      customer: 'Sheikha Mariam Al-Khalifa',
      mobilePhone: '+973 3955 4433',
      time: '19:30',
      from: 'City Centre Bahrain Mall',
      to: 'Al Areen Palace & Spa',
      flight: '',
      carTimeOut: '19:00',
      carTimeIn: '21:30',
      carType: 'Luxury Sedan',
      carNumber: '731902',
      cash: 0,
      card: 50.000,
      bankTransfer: 0,
      credit: 0,
      commission: 0,
      driver: 'ISA',
      status: 'Confirmed',
      note: 'Shopping bags assistance requested'
    },
    {
      id: 'bkg-today-7',
      invoice: '640326',
      date: today,
      customer: 'Mohammed Al-Zayani',
      mobilePhone: '+973 3677 8899',
      time: '21:15',
      from: 'Bahrain Airport',
      to: 'Juffair Grand Hotel',
      flight: 'EK 837',
      carTimeOut: '20:45',
      carTimeIn: '22:30',
      carType: 'SUV',
      carNumber: '640315',
      cash: 35.000,
      card: 0,
      bankTransfer: 0,
      credit: 0,
      commission: 5.000,
      driver: 'AMIR',
      status: 'Pending',
      note: 'Flight incoming from Dubai'
    },
    {
      id: 'bkg-today-8',
      invoice: '640327',
      date: today,
      customer: 'European Tech Summit Group',
      mobilePhone: '+49 170 1234567',
      time: '23:00',
      from: 'The Merchant House Manama',
      to: 'Bahrain International Airport',
      flight: 'QR 1014',
      carTimeOut: '22:30',
      carTimeIn: '00:15',
      carType: 'Van',
      carNumber: '418290',
      cash: 0,
      card: 0,
      bankTransfer: 75.000,
      credit: 0,
      commission: 12.000,
      driver: 'HUSSAIN',
      status: 'Confirmed',
      note: 'Midnight airport express'
    },

    // --- OTHER DATES SAMPLES (2026-08-24 & 2026-08-25) ---
    ...SEED_BOOKINGS
  ];
}

const STORAGE_KEY = 'skylimo_local_bookings';

export function getLocalBookings(): Booking[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initialized = generateSeedBookings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
    return initialized;
  }
  try {
    return JSON.parse(saved);
  } catch (_) {
    return generateSeedBookings();
  }
}

interface DateListener {
  date: string;
  callback: (bookings: Booking[]) => void;
}

const dateListeners = new Set<DateListener>();
const allBookingListeners = new Set<(bookings: Booking[]) => void>();

function notifyBookingListeners() {
  const all = getLocalBookings();
  allBookingListeners.forEach((cb) => {
    try {
      cb(all);
    } catch (_) {}
  });

  dateListeners.forEach(({ date, callback }) => {
    try {
      const forDate = all.filter((b) => b.date === date);
      callback(forDate);
    } catch (_) {}
  });
}

function saveLocalBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  notifyBookingListeners();
}

function filterBookingsList(all: Booking[], filters: BookingFilter): Booking[] {
  return all.filter((b) => {
    if (filters.dateFrom && b.date < filters.dateFrom) return false;
    if (filters.dateTo && b.date > filters.dateTo) return false;
    if (filters.driver && filters.driver !== 'All' && b.driver !== filters.driver) return false;
    if (filters.vehicle && filters.vehicle !== 'All' && b.carNumber !== filters.vehicle) return false;
    if (filters.carType && filters.carType !== 'All' && b.carType !== filters.carType) return false;
    if (filters.status && filters.status !== 'All' && b.status !== filters.status) return false;
    
    if (filters.paymentMethod && filters.paymentMethod !== 'All') {
      const amt = b[filters.paymentMethod as keyof Booking];
      if (!amt || Number(amt) <= 0) return false;
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match = 
        b.customer?.toLowerCase().includes(q) ||
        b.invoice?.toLowerCase().includes(q) ||
        b.mobilePhone?.toLowerCase().includes(q) ||
        b.flight?.toLowerCase().includes(q) ||
        b.from?.toLowerCase().includes(q) ||
        b.to?.toLowerCase().includes(q) ||
        b.driver?.toLowerCase().includes(q) ||
        b.carNumber?.toLowerCase().includes(q) ||
        b.note?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function getCurrentUserIdentifier(): string {
  try {
    const saved = localStorage.getItem('skylimo_user_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.displayName || parsed.email || 'Staff';
    }
  } catch (_) {}
  return 'Staff';
}

export const BookingService = {
  subscribeByDate(selectedDate: string, callback: (bookings: Booking[]) => void): () => void {
    const local = getLocalBookings().filter((b) => b.date === selectedDate);
    callback(local);

    const listenerObj: DateListener = { date: selectedDate, callback };
    dateListeners.add(listenerObj);

    return () => {
      dateListeners.delete(listenerObj);
    };
  },

  subscribeAll(callback: (bookings: Booking[]) => void): () => void {
    // 1. Immediately emit cached data (0ms instant response)
    callback(getLocalBookings());
    allBookingListeners.add(callback);

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getLocalBookings());
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Background live real-time sync with Cloud Firestore
    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, COLLECTION_NAME),
        async (snapshot) => {
          if (!snapshot.empty) {
            const firestoreList: Booking[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Booking, 'id'>)
            }));

            // Sort by date and time
            firestoreList.sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreList));
            notifyBookingListeners();
          } else {
            // Seed initial bookings into Firestore if empty
            const initialSeed = generateSeedBookings();
            for (const bkg of initialSeed) {
              try {
                await setDoc(doc(db, COLLECTION_NAME, bkg.id), {
                  ...bkg,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              } catch (_) {}
            }
            saveLocalBookings(initialSeed);
          }
        },
        () => {}
      );
    } catch (_) {}

    return () => {
      allBookingListeners.delete(callback);
      window.removeEventListener('storage', handleStorage);
      unsubscribeFirestore();
    };
  },

  getFilteredSync(filters: BookingFilter): Booking[] {
    return filterBookingsList(getLocalBookings(), filters);
  },

  async getFiltered(filters: BookingFilter): Promise<Booking[]> {
    return filterBookingsList(getLocalBookings(), filters);
  },

  async create(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const id = 'bkg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const userIdentifier = booking.createdBy || getCurrentUserIdentifier();
    const newBooking: Booking = {
      ...booking,
      id,
      cash: Number(booking.cash) || 0,
      card: Number(booking.card) || 0,
      bankTransfer: Number(booking.bankTransfer) || 0,
      credit: Number(booking.credit) || 0,
      commission: Number(booking.commission) || 0,
      createdAt: booking.createdAt || new Date().toISOString(),
      createdBy: userIdentifier,
      updatedAt: new Date().toISOString(),
      updatedBy: userIdentifier
    };

    // 1. Immediate local persistence and reactive notification (0ms)
    const current = getLocalBookings();
    saveLocalBookings([newBooking, ...current]);

    // Activity Log
    ActivityService.log({
      action: 'create',
      module: 'bookings',
      description: `Added booking ${newBooking.invoice || id} for ${newBooking.customer || 'Customer'} (${newBooking.carType || 'Car'} | ${newBooking.from || ''} → ${newBooking.to || ''})`,
      details: { invoice: newBooking.invoice, customer: newBooking.customer, carNumber: newBooking.carNumber }
    });

    // 2. Background Firestore write
    setDoc(doc(db, COLLECTION_NAME, id), {
      ...newBooking,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch((err) => {
      console.warn('Firestore write queued locally:', err.message);
    });

    return newBooking;
  },

  async update(id: string, updates: Partial<Booking>): Promise<void> {
    // 1. Immediate local update and reactive notification (0ms)
    const userIdentifier = updates.updatedBy || getCurrentUserIdentifier();
    const current = getLocalBookings();
    let targetBooking = current.find((b) => b.id === id);
    const updated = current.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          ...updates,
          cash: updates.cash !== undefined ? Number(updates.cash) : b.cash,
          card: updates.card !== undefined ? Number(updates.card) : b.card,
          bankTransfer: updates.bankTransfer !== undefined ? Number(updates.bankTransfer) : b.bankTransfer,
          credit: updates.credit !== undefined ? Number(updates.credit) : b.credit,
          commission: updates.commission !== undefined ? Number(updates.commission) : b.commission,
          updatedAt: new Date().toISOString(),
          updatedBy: userIdentifier
        };
      }
      return b;
    });
    saveLocalBookings(updated);

    // Activity Log
    ActivityService.log({
      action: 'update',
      module: 'bookings',
      description: `Updated booking ${targetBooking?.invoice || id} (${targetBooking?.customer || 'Customer'})`,
      details: { invoice: targetBooking?.invoice, updates }
    });

    // 2. Background Firestore update
    updateDoc(doc(db, COLLECTION_NAME, id), {
      ...updates,
      updatedBy: userIdentifier,
      updatedAt: serverTimestamp()
    }).catch((err) => {
      console.warn('Firestore update queued locally:', err.message);
    });
  },

  async delete(id: string): Promise<void> {
    // 1. Immediate local deletion and reactive notification (0ms)
    const current = getLocalBookings();
    const targetBooking = current.find((b) => b.id === id);
    saveLocalBookings(current.filter((b) => b.id !== id));

    // Activity Log
    ActivityService.log({
      action: 'delete',
      module: 'bookings',
      description: `Deleted booking ${targetBooking?.invoice || id} (${targetBooking?.customer || 'Customer'})`,
      details: { invoice: targetBooking?.invoice }
    });

    // 2. Background Firestore delete
    deleteDoc(doc(db, COLLECTION_NAME, id)).catch((err) => {
      console.warn('Firestore delete queued locally:', err.message);
    });
  },

  resetSampleData(): Booking[] {
    const fresh = generateSeedBookings();
    saveLocalBookings(fresh);
    return fresh;
  }
};
