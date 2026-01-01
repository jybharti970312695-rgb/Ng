import * as XLSX from 'xlsx';
import { ICustomer, CustomerType } from '../types';

// Helper to normalize header strings for fuzzy matching
// e.g., "Phone Number" -> "mobile", "Party Name" -> "name"
const normalizeHeader = (header: string): string => {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['partyname', 'customername', 'name', 'party'].includes(h)) return 'name';
  if (['gstin', 'gstno', 'taxid', 'gst'].includes(h)) return 'gstin';
  if (['mobile', 'phone', 'contact', 'cell', 'phoneno'].includes(h)) return 'mobile';
  if (['address', 'city', 'location', 'place'].includes(h)) return 'address';
  if (['state', 'statecode'].includes(h)) return 'stateCode';
  return h;
};

export const parseCustomerFile = async (file: File, type: CustomerType): Promise<ICustomer[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays first to identify headers
        const jsonSheet = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonSheet.length < 2) {
          resolve([]);
          return;
        }

        const headers = (jsonSheet[0] as string[]).map(normalizeHeader);
        const rows = jsonSheet.slice(1);

        const mappedCustomers: ICustomer[] = rows.map((row: any) => {
          const customer: any = { type, searchIndex: [] };
          
          // Map row data based on normalized headers
          headers.forEach((header, index) => {
            if (row[index] !== undefined) {
               // If strict schema key exists, map it
               if (['name', 'gstin', 'mobile', 'address', 'stateCode'].includes(header)) {
                 customer[header] = String(row[index]).trim();
               }
            }
          });

          // Validation: Name is mandatory
          if (!customer.name) return null;

          // Defaults
          if (!customer.stateCode) customer.stateCode = '27'; // Default MH
          
          // Generate Search Index
          customer.searchIndex = [
            customer.name.toLowerCase(), 
            customer.gstin?.toLowerCase() || '', 
            customer.mobile?.toLowerCase() || ''
          ].filter(Boolean);

          return customer as ICustomer;
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