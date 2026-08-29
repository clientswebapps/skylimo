export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';

export type UserRole = 'admin' | 'staff';

export type CarType = 'Sedan' | 'SUV' | 'Van' | 'Luxury' | string;

export type RentalPaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

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

export interface CarRental {
  id: string;
  rowNumber?: number;         // e.g. 606, 607, 608
  agreementNumber: string;    // e.g. "INV-009127"
  
  // Customer Details
  customerName: string;       // e.g. "SWABIR TWALIB AHMED"
  contactNumber: string;      // e.g. "973 3375 4094"
  idNumber: string;           // e.g. "971047359"
  nationality: string;        // e.g. "KENYA", "SAUDI", "JORDAN"
  
  // Car Details
  carType: string;            // e.g. "Toyota Yaris", "Nissan Sunny"
  carNumber: string;          // e.g. "624409"
  carModel?: string;          // e.g. "2024"
  
  // Rent Details
  rentalDays: number;         // e.g. 1, 2, 3
  rentDate: string;           // YYYY-MM-DD
  rentTime: string;           // HH:mm format e.g. "14:40"
  returnDate: string;         // YYYY-MM-DD
  returnTime: string;         // HH:mm format e.g. "13:37"
  
  // Payment Details
  rentPrice: number;          // Rent Price in BHD (e.g. 12.000)
  advancePayment: number;     // Advance payment in BHD
  remainingAmount: number;    // Remaining balance in BHD
  depositAmount: number;      // Deposit amount in BHD (e.g. 50.000)
  paymentStatus: RentalPaymentStatus; // "PAID" | "UNPAID" | "PARTIAL"
  
  // Notes
  note?: string;              // e.g. "50BD DEPOSIT RETURN TO CUSTOMER"
  
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

export interface RentalFilter {
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  carType?: string;
  paymentStatus?: RentalPaymentStatus | 'All';
  nationality?: string;
}

export interface SystemConfig {
  carTypes: string[];
  statusOptions: BookingStatus[];
  autoGenerateInvoice: boolean;
  invoicePrefix: string;
  currencySymbol: string;
}
