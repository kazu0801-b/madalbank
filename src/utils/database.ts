import { Store, MedalRecord, User } from '@/types';

class DataStore {
  private stores: Store[] = [];
  private medalRecords: MedalRecord[] = [];
  private user: User | null = null;

  getAllStores(): Store[] {
    return this.stores.filter(store => store.isActive);
  }

  getStoreById(id: string): Store | undefined {
    return this.stores.find(store => store.id === id);
  }

  addStore(name: string): Store {
    const store: Store = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      isActive: true
    };
    this.stores.push(store);
    return store;
  }

  deleteStore(id: string): boolean {
    const index = this.stores.findIndex(store => store.id === id);
    if (index !== -1) {
      this.stores[index].isActive = false;
      return true;
    }
    return false;
  }

  getMedalRecordsByStoreId(storeId: string): MedalRecord[] {
    return this.medalRecords
      .filter(record => record.storeId === storeId)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
  }

  addMedalRecord(record: Omit<MedalRecord, 'id' | 'createdAt'>): MedalRecord {
    const newRecord: MedalRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    this.medalRecords.push(newRecord);
    
    this.scheduleNotification(newRecord);
    
    return newRecord;
  }

  getStoreMedalBalance(storeId: string): number {
    const currentDate = new Date();
    const records = this.getMedalRecordsByStoreId(storeId);
    
    return records
      .filter(record => record.expiryDate > currentDate)
      .reduce((balance, record) => {
        return balance + (record.transactionType === 'deposit' ? record.medalCount : -record.medalCount);
      }, 0);
  }

  getExpiringMedals(daysFromNow: number = 14): Array<{
    store: Store;
    record: MedalRecord;
  }> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    
    const expiringRecords: Array<{ store: Store; record: MedalRecord }> = [];
    
    this.medalRecords.forEach(record => {
      if (record.expiryDate <= targetDate && record.expiryDate > new Date()) {
        const store = this.getStoreById(record.storeId);
        if (store) {
          expiringRecords.push({ store, record });
        }
      }
    });
    
    return expiringRecords;
  }

  private scheduleNotification(record: MedalRecord): void {
    const notificationDate = new Date(record.expiryDate);
    notificationDate.setDate(notificationDate.getDate() - 14);
    
    if (notificationDate > new Date()) {
      const timeUntilNotification = notificationDate.getTime() - new Date().getTime();
      
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const store = this.getStoreById(record.storeId);
          new Notification('メダル有効期限のお知らせ', {
            body: `${store?.name}のメダル${record.medalCount}枚が${record.expiryDate.toLocaleDateString('ja-JP')}に期限切れになります`,
            icon: '/medal-icon.png'
          });
        }
      }, timeUntilNotification);
    }
  }

  getUser(): User | null {
    return this.user;
  }

  setUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    this.user = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    return this.user;
  }
}

export const dataStore = new DataStore();