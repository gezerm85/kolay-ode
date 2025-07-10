import type { Timestamp } from 'firebase/firestore';

export type PaymentStatus = 'Ödendi' | 'Bekliyor' | 'İade Edildi';

export type Payment = {
  id: string;
  customerName: string;
  customerId?: string | null;
  amount: number;
  installments: number[];
  chosenInstallment?: number;
  status: PaymentStatus;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  refundedAt?: Timestamp;
  bank: string;
  payerName?: string;
  cardLast4?: string;
  akbankOrderId?: string;
};
