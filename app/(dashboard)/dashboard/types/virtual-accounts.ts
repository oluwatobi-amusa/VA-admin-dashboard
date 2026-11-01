export type MerchantStatus = 'Active' | 'Suspended';
export type TillStatus = 'Active' | 'Inactive';
export type TransactionStatus = 'Successful' | 'Pending' | 'Failed';
export type VerificationStatus = 'Pending' | 'Approved' | 'Declined';
export interface MerchantVerification {
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reason?: string;
}
export interface UploadedDocument {
  label: string;
  filename: string;
  type: 'application/pdf' | 'image/svg+xml' | 'image/png' | 'image/jpeg';
  size?: string;
  url: string;
  uploadedAt: string;
}
export interface Business {
  status: 'Active' | 'Pending' | 'Declined';
  id: string;
  name: string;
  registrationType?: string;
  rcNumber?: string;
  taxId?: string;
  registrationDate?: string;
  email?: string;
  address?: string;
  documents: UploadedDocument[];
  verification: MerchantVerification;
}
export interface Merchant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: MerchantStatus;
  verification: MerchantVerification;
  firstName: string;
  lastName: string;
  phone?: string;
  bvnLastFour?: string;
  businesses: Business[];
}
export interface Till {
  id: string;
  merchantId: string;
  businessId: string;
  name: string;
  number: string;
  balance: number;
  status: TillStatus;
}
export interface Transaction {
  reference: string;
  tillId: string;
  date: string;
  type: 'Credit' | 'Debit';
  counterparty: string;
  counterpartyNumber: string;
  bank: string;
  description: string;
  amount: number;
  status: TransactionStatus;
}
export interface DashboardData {
  merchants: Merchant[];
  tills: Till[];
  transactions: Transaction[];
}
