export type ThemeOS = 'android' | 'windows';
export type CustomerType = 'wholesale' | 'retail';

export interface ICustomer {
  id?: number;
  name: string;
  type: CustomerType;
  gstin?: string;
  stateCode?: string;
  mobile: string;
  address?: string;
  searchIndex?: string[]; // Compound index for search
}

export interface IProduct {
  id?: number;
  name: string;
  batch: string;
  expiry: string;
  mrp: number;
  rate: number;
  stock: number;
  manufacturer: string;
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