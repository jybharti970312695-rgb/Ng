import { ICartItem, ICustomer } from "../types";

// Standard ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const COMMANDS = {
  INIT: ESC + '@',
  CENTER: ESC + 'a' + '\x01',
  LEFT: ESC + 'a' + '\x00',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  CUT: GS + 'V' + '\x41' + '\x00'
};

interface USBDevice {
  productName: string;
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<any>;
}

let printerDevice: USBDevice | null = null;

export const connectPrinter = async () => {
  const nav = navigator as any;
  if (!nav.usb) {
    alert("WebUSB not supported in this browser. Use Chrome/Edge.");
    return;
  }

  try {
    // Request permission to access a USB device (Standard Thermal Printer filters)
    printerDevice = await nav.usb.requestDevice({
      filters: [{ vendorId: 0x0416 }, { vendorId: 0x0483 }] // Common thermal printer vendor IDs
    });

    if (printerDevice) {
      await printerDevice.open();
      await printerDevice.selectConfiguration(1);
      await printerDevice.claimInterface(0);
      console.log("Printer connected:", printerDevice.productName);
      return true;
    }
  } catch (error) {
    console.error("Printer connection failed:", error);
    alert("Could not connect to printer. Ensure it is plugged in.");
    return false;
  }
};

const sendToPrinter = async (data: string) => {
  if (!printerDevice) {
    // Fallback if no printer connected
    console.log("RAW PRINT DATA:\n", data);
    return;
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Transfer to endpoint 1 (standard OUT endpoint for printers)
  await printerDevice.transferOut(1, dataBuffer);
};

export const printInvoice = async (customer: ICustomer | null, items: ICartItem[], total: number) => {
  console.log("Formatting Invoice...");
  
  const date = new Date().toLocaleDateString();
  const custName = customer?.name || 'Cash Sale';
  
  let receipt = COMMANDS.INIT;
  
  // Header
  receipt += COMMANDS.CENTER + COMMANDS.BOLD_ON + "GOPI PHARMA DISTRIBUTORS\n" + COMMANDS.BOLD_OFF;
  receipt += "Wholesale & Retail Engine\n";
  receipt += "--------------------------------\n";
  
  // Meta
  receipt += COMMANDS.LEFT;
  receipt += `Date: ${date}\n`;
  receipt += `Bill To: ${custName}\n`;
  receipt += "--------------------------------\n";
  
  // Items
  receipt += "Item           Qty+Free    Amt\n";
  receipt += "--------------------------------\n";
  
  items.forEach(item => {
    const name = item.product.name.substring(0, 15).padEnd(15);
    const qty = `${item.billedQty}+${item.freeQty}`.padEnd(8);
    const amt = (item.product.rate * item.billedQty).toFixed(2).padStart(8);
    receipt += `${name} ${qty} ${amt}\n`;
  });

  // Footer
  receipt += "--------------------------------\n";
  receipt += COMMANDS.BOLD_ON + `TOTAL: Rs. ${total.toFixed(2)}\n` + COMMANDS.BOLD_OFF;
  receipt += COMMANDS.CENTER + "Thank You!\n";
  receipt += "\n\n\n"; 
  receipt += COMMANDS.CUT;

  if (printerDevice) {
    await sendToPrinter(receipt);
  } else {
    // Simulation Mode
    alert(`Printing Receipt for ₹${total}...\n(Connect WebUSB device for real print)\n\nCheck Console.`);
    console.log(receipt);
  }
};