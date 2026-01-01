import Fuse from 'fuse.js';
import { ICustomer, IProduct } from '../types';

// Factory to create search instances based on mode
export const createSearchEngine = <T>(data: T[], keys: string[], mode: 'fast' | 'accurate') => {
  const options: Fuse.IFuseOptions<T> = mode === 'fast' 
    ? {
        threshold: 0.3, // Loose matching
        includeScore: true,
        keys: keys
      }
    : {
        threshold: 0.1, // Strict matching
        includeScore: true,
        useExtendedSearch: true,
        keys: keys,
        ignoreLocation: true
      };

  return new Fuse(data, options);
};

export const searchItems = <T>(
  fuse: Fuse<T>, 
  query: string, 
  mode: 'fast' | 'accurate'
): T[] => {
  if (!query) return [];
  
  // For 'accurate' mode, we might want to force prefix matching logic or exact logic
  const finalQuery = mode === 'accurate' ? `'${query}` : query;
  
  const results = fuse.search(finalQuery);
  return results.map(r => r.item);
};