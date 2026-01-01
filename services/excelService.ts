import * as XLSX from 'xlsx';
import { ICustomer, CustomerType } from '../types';

// In a real setup, this would run inside a Web Worker.
// We are exporting it as a standard async service for this demo.

export const parseCustomerFile = async (file: File, type: CustomerType): Promise<ICustomer[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

        const mappedCustomers: ICustomer[] = jsonData.map((row) => {
          // Auto-mapping logic
          // Heuristic: Check common header names
          const name = row['Party Name'] || row['Name'] || row['Customer'] || '';
          const gstin = row['GSTIN'] || row['GST No'] || row['Tax ID'] || '';
          const mobile = row['Mobile'] || row['Phone'] || row['Contact'] || '';
          const address = row['Address'] || row['City'] || '';

          if (!name) return null;

          return {
            name: String(name).trim(),
            type: type,
            gstin: String(gstin).trim(),
            mobile: String(mobile).trim(),
            address: String(address).trim(),
            stateCode: '27', // Default to local state for demo
            searchIndex: [String(name).toLowerCase(), String(gstin).toLowerCase()]
          };
        }).filter((c): c is ICustomer => c !== null);

        resolve(mappedCustomers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};