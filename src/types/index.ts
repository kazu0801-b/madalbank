export interface Store {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
}

export interface MedalRecord {
  id: string;
  storeId: string;
  medalCount: number;
  transactionType: 'deposit' | 'withdraw';
  transactionDate: Date;
  expiryDate: Date;
  memo: string;
  createdAt: Date;
}

export interface User {
  id: string;
  userName: string;
  notificationEnabled: boolean;
  createdAt: Date;
}