
/**
 * Indian Pharma Pricing Calculator
 * Handles reverse calculation from MRP and Scheme Net Rates
 */

export const calculatePTR = (mrp: number, gstPercent: number, retailerMargin: number = 20): number => {
  // Formula: PTR = (MRP - (MRP * retail_margin%)) / (1 + (gst% / 100))
  const marginAmount = mrp * (retailerMargin / 100);
  const taxableValue = (mrp - marginAmount) / (1 + (gstPercent / 100));
  return parseFloat(taxableValue.toFixed(2));
};

export const calculatePTS = (ptr: number, stockistMargin: number = 10): number => {
  // Formula: PTS = PTR - (PTR * stockist_margin%)
  const marginAmount = ptr * (stockistMargin / 100);
  return parseFloat((ptr - marginAmount).toFixed(2));
};

export const calculateNetRate = (rate: number, billedQty: number, freeQty: number): number => {
  // Scheme Logic: (Rate * Billed) / (Billed + Free)
  // Actually, usually in billing: Total Cost / Total Units, or just Total Cost / Billed Units depending on display.
  // Standard Net Rate display = Effective cost per unit to the retailer including free goods.
  
  if (billedQty + freeQty === 0) return 0;
  const totalCost = rate * billedQty;
  const totalUnits = billedQty + freeQty;
  return parseFloat((totalCost / totalUnits).toFixed(2));
};

export const calculateItemTotal = (item: { product: { rate: number }, billedQty: number }): number => {
  return item.product.rate * item.billedQty;
};
