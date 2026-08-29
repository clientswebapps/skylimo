export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';

export type UserRole = 'admin' | 'staff';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Luxury' | string;

export interface Booking {
  id: string;
  invoice: string;
  date: string;            // Format: YYYY-MM-DD
  customer: string;
  mobilePhone: string;
  time: string;            // 24h format HH:mm e.g. "14:30"
  from: string;
  to: string;
  flight?: string;
  carTimeOut?: string;     // 24h format HH:mm
  carTimeIn?: string;      // 24h format HH:mm
  carType: CarType;
  carNumber: string;
  vehicleId?: string;
  cash: number;
  card: number;
  bankTransfer: number;
  credit: number;
  commission: number;
  driver: string;          // Snapshot of driver name for historical integrity
  driverId?: string;
  status: BookingStatus;
  note?: string;
  
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Vehicle {
  id: string;
  carNumber: string;
  carType: CarType;
  isActive: boolean;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: any;
  lastLoginAt?: any;
}

export interface BookingFilter {
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  driver?: string;
  vehicle?: string;
  carType?: string;
  status?: BookingStatus | 'All';
  paymentMethod?: 'cash' | 'card' | 'bankTransfer' | 'credit' | 'commission' | 'All';
}

export interface SystemConfig {
  carTypes: string[];
  statusOptions: BookingStatus[];
  autoGenerateInvoice: boolean;
  invoicePrefix: string;
  currencySymbol: string;
}
