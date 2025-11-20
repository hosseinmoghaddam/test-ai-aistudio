export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // List of names
}

export interface ReceiptData {
  items: ReceiptItem[];
  tax: number;
  tip: number;
  currency?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface PersonSummary {
  name: string;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
  items: string[];
}

export interface AnalysisResult {
  modifications: {
    itemId: string;
    assignees: string[];
  }[];
  reply: string;
}