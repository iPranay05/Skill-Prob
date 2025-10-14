export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  AMBASSADOR = 'ambassador',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  education?: {
    institution: string;
    degree: string;
    year: number;
  }[];
}

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: VerificationStatus;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface User {
  id?: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
  verification: UserVerification;
  preferences: {
    notifications: NotificationPreferences;
  };
  referralCode?: string;
  referredBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OTPVerification {
  id?: string;
  userId: string;
  type: 'email' | 'phone';
  code: string;
  expiresAt: string;
  verified: boolean;
  createdAt?: string;
  attempts?: number;
}