
export type ThemeOS = 'android' | 'windows';
export type CustomerType = 'wholesale' | 'retail';
export type ScheduleType = 'H1' | 'H' | 'X' | 'General';

export interface ICustomer {
  id?: number;
  name: string;
  type: CustomerType;
  gstin?: string;
  stateCode?: string;
  mobile: string;
  address?: string;
  searchIndex?: string[];
}

export interface IProduct {
  id?: number;
  name: string;
  batch: string;
  expiry: string; // Format: YYYY-MM-DD for sorting
  mrp: number;
  rate: number; // This is usually PTR
  ptr: number;
  pts: number;
  stock: number;
  manufacturer: string;
  hsn: string;
  gstPercent: number;
  schedule: ScheduleType;
}

export interface ICartItem {
  product: IProduct;
  billedQty: number;
  freeQty: number; // For schemes like 10+1
  netRate: number; // Calculated effective rate
}

export interface IDoctorDetails {
  doctorName: string;
  patientName: string;
  rxNumber: string;
}

export interface IInvoice {
  id?: number;
  customerId?: number;
  customerName: string;
  items: ICartItem[];
  totalAmount: number;
  date: string;
  doctorDetails?: IDoctorDetails; // Required if H1 items exist
}

export interface IThemeState {
  os: ThemeOS;
  darkMode: boolean;
  setOS: (os: ThemeOS) => void;
  toggleDarkMode: () => void;
  detectOS: () => void;
}

export interface IImportMapping {
  name: string;
  gstin: string;
  mobile: string;
  type?: string;
}
