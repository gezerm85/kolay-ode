import type { Timestamp } from 'firebase/firestore';

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
  createdAt: Timestamp;
};
