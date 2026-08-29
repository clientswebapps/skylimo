import type { BookingStatus, CarType, SystemConfig } from '../types';

export const APP_NAME = 'SkyLimo';
export const APP_SUBTITLE = 'Booking Trips Management';

export const STATUS_OPTIONS: BookingStatus[] = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
  'No Show'
];

export const DEFAULT_CAR_TYPES: CarType[] = [
  'Sedan',
  'SUV',
  'Van',
  'Luxury Sedan',
  'VIP'
];

export const DEFAULT_CONFIG: SystemConfig = {
  carTypes: DEFAULT_CAR_TYPES,
  statusOptions: STATUS_OPTIONS,
  autoGenerateInvoice: true,
  invoicePrefix: 'INV',
  currencySymbol: 'BHD'
};

export const TABLE_COLUMNS = [
  { id: 'invoice', label: 'Invoice', minWidth: '120px' },
  { id: 'date', label: 'Date', minWidth: '105px' },
  { id: 'customer', label: 'Customer', minWidth: '160px' },
  { id: 'mobilePhone', label: 'Mobile Phone', minWidth: '130px' },
  { id: 'time', label: 'Time', minWidth: '85px' },
  { id: 'from', label: 'From', minWidth: '150px' },
  { id: 'to', label: 'To', minWidth: '150px' },
  { id: 'flight', label: 'Flight', minWidth: '95px' },
  { id: 'carTimeOut', label: 'Car Time Out', minWidth: '105px' },
  { id: 'carTimeIn', label: 'Car Time In', minWidth: '105px' },
  { id: 'carType', label: 'Car Type', minWidth: '110px' },
  { id: 'carNumber', label: 'Car Number', minWidth: '110px' },
  { id: 'cash', label: 'Cash', minWidth: '90px', align: 'right' },
  { id: 'card', label: 'Card', minWidth: '90px', align: 'right' },
  { id: 'bankTransfer', label: 'Bank Transfer', minWidth: '110px', align: 'right' },
  { id: 'credit', label: 'Credit', minWidth: '90px', align: 'right' },
  { id: 'commission', label: 'Commission', minWidth: '105px', align: 'right' },
  { id: 'driver', label: 'Driver', minWidth: '120px' },
  { id: 'status', label: 'Status', minWidth: '125px' },
  { id: 'note', label: 'Note', minWidth: '160px' }
];

export const INITIAL_DRIVERS = [
  { id: 'drv-1', name: 'ISA', phone: '+973 3900 1122', isActive: true },
  { id: 'drv-2', name: 'AMIR', phone: '+973 3900 3344', isActive: true },
  { id: 'drv-3', name: 'HUSSAIN', phone: '+973 3900 5566', isActive: true },
  { id: 'drv-4', name: 'ALI', phone: '+973 3900 7788', isActive: true },
  { id: 'drv-5', name: 'MOHAMMED', phone: '+973 3900 9900', isActive: true }
];

export const INITIAL_VEHICLES = [
  { id: 'veh-1', carNumber: '640315', carType: 'SUV', carModel: '2024', purpose: 'trips' as const, isActive: true, notes: 'VIP Chauffeur Service' },
  { id: 'veh-2', carNumber: '529184', carType: 'Sedan', carModel: '2024', purpose: 'trips' as const, isActive: true, notes: 'Airport Transfers' },
  { id: 'veh-3', carNumber: '418290', carType: 'Van', carModel: '2023', purpose: 'both' as const, isActive: true, notes: 'Group Trips & Long Term Rental' },
  { id: 'veh-4', carNumber: '731902', carType: 'Luxury Sedan', carModel: '2025', purpose: 'trips' as const, isActive: true, notes: 'Executive Fleet' },
  { id: 'veh-5', carNumber: '624409', carType: 'Sedan', carModel: '2024', purpose: 'rentals' as const, dailyRate: 15, isActive: true, notes: 'Toyota Yaris - Customer Rental' },
  { id: 'veh-6', carNumber: '581203', carType: 'Sedan', carModel: '2023', purpose: 'rentals' as const, dailyRate: 12, isActive: true, notes: 'Nissan Sunny - Customer Rental' }
];
