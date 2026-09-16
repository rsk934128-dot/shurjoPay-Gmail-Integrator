export interface Payment {
  id?: string;
  userId: string;
  orderId: string;
  spOrderId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  createdAt: any; // Firestore Timestamp or Date
  updatedAt: any;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
}

export interface UserSettings {
  emailNotificationsEnabled: boolean;
  theme: 'light' | 'dark';
  visibleCards: {
    payments: boolean;
    history: boolean;
    gmail: boolean;
  };
  updatedAt: any;
}

export interface EmailTemplate {
  id?: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  createdAt: any;
  updatedAt: any;
}
