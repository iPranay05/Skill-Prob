export enum AmbassadorStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  CONVERSION = 'conversion',
  PAYOUT = 'payout',
  REFERRAL_BONUS = 'referral_bonus',
  REGISTRATION_BONUS = 'registration_bonus'
}

export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
}

export enum ReferralEventType {
  REGISTRATION = 'registration',
  FIRST_PURCHASE = 'first_purchase',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  COURSE_COMPLETION = 'course_completion'
}

export interface AmbassadorApplication {
  motivation: string;
  socialMedia: {
    platform: string;
    handle: string;
    followers: number;
  }[];
  experience: string;
  expectedReferrals?: number;
  marketingStrategy?: string;
}

export interface AmbassadorPerformance {
  totalReferrals: number;
  successfulConversions: number;
  totalEarnings: number;
  currentPoints: number;
  lifetimePoints: number;
  conversionRate?: number;
  averageOrderValue?: number;
}

export interface PayoutDetails {
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  upiId?: string;
  verified: boolean;
  kycDocuments?: {
    panCard?: string;
    bankStatement?: string;
    addressProof?: string;
  };
}

export interface Ambassador {
  id?: string;
  userId: string;
  referralCode: string;
  status: AmbassadorStatus;
  application: AmbassadorApplication;
  performance: AmbassadorPerformance;
  payoutDetails: PayoutDetails;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversionEvent {
  type: ReferralEventType;
  date: string;
  value: number;
  pointsEarned: number;
  metadata?: any;
}

export interface Referral {
  id?: string;
  ambassadorId: string;
  studentId: string;
  referralCode: string;
  registrationDate: string;
  conversionEvents: ConversionEvent[];
  status: 'pending' | 'converted' | 'inactive' | 'fraud';
  fraudFlags?: any;
  sourceData?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    utm?: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletBalance {
  points: number;
  credits: number;
  currency: string;
}

export interface Wallet {
  id?: string;
  userId: string;
  userType: 'student' | 'ambassador';
  balance: WalletBalance;
  totalEarned: number;
  totalSpent: number;
  totalWithdrawn: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id?: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  points: number;
  description: string;
  referenceId?: string;
  balanceAfter: WalletBalance;
  metadata?: any;
  createdAt?: string;
}

export interface PayoutRequest {
  id?: string;
  ambassadorId: string;
  walletId: string;
  amount: number;
  pointsRedeemed: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  transactionId?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PointConfiguration {
  id?: string;
  eventType: ReferralEventType;
  pointsAwarded: number;
  conditions: any;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Validation schemas
export const ambassadorApplicationSchema = {
  motivation: { required: true, minLength: 50, maxLength: 1000 },
  socialMedia: { required: true, minItems: 1 },
  experience: { required: true, minLength: 20, maxLength: 500 }
};

export const payoutDetailsSchema = {
  bankAccount: { required: false, pattern: /^[0-9]{9,18}$/ },
  ifscCode: { required: false, pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
  panNumber: { required: false, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
  upiId: { required: false, pattern: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/ }
};

// Helper functions
export const calculateConversionRate = (performance: AmbassadorPerformance): number => {
  if (performance.totalReferrals === 0) return 0;
  return (performance.successfulConversions / performance.totalReferrals) * 100;
};

export const calculatePointsValue = (points: number, conversionRate: number = 1): number => {
  return points * conversionRate;
};

export const isEligibleForPayout = (wallet: Wallet, minPoints: number = 100): boolean => {
  return wallet.balance.points >= minPoints;
};

export const generateReferralCode = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const userHash = userId.slice(-4).replace(/[^A-Z0-9]/gi, ''); // Remove non-alphanumeric chars
  const code = `REF${userHash.toUpperCase()}${timestamp.toUpperCase()}`.replace(/[^A-Z0-9]/g, '').slice(0, 12);
  
  // Ensure minimum length by padding with random chars if needed
  if (code.length < 8) {
    const randomChars = Math.random().toString(36).substring(2).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return (code + randomChars).slice(0, 12);
  }
  
  return code;
};

export const validateReferralCode = (code: string): boolean => {
  // Must start with REF, followed by 5-9 alphanumeric characters, total length 8-12
  return /^REF[A-Z0-9]{5,9}$/.test(code);
};