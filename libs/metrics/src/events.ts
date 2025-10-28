export interface OrderCreatedEvent {
  id: number | string;
  userId?: string;
  amount: number;
  items: any[];
  createdAt: string;
}

export interface PaymentProcessedEvent {
  orderId: number | string;
  status: 'processed' | 'failed';
  transactionId?: string;
  processedAt: string;
}
