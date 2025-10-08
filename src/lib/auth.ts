import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, AuthTokens, UserRole } from '@/types/user';
import { redis } from './database';

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateTokens(payload: JWTPayload): AuthTokens {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }

    try {
      return jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static async verifyRefreshToken(token: string): Promise<JWTPayload> {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    try {
      const payload = jwt.verify(token, jwtRefreshSecret) as JWTPayload;
      
      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`${this.REFRESH_TOKEN_PREFIX}${payload.userId}`);
      if (storedToken !== token) {
        throw new Error('Refresh token not found or invalid');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Store refresh token in Redis with expiry
    const expirySeconds = 7 * 24 * 60 * 60; // 7 days
    await redis.setex(`${this.REFRESH_TOKEN_PREFIX}${userId}`, expirySeconds, refreshToken);
  }

  static async revokeRefreshToken(userId: string): Promise<void> {
    await redis.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }

  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const newTokens = this.generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    // Store new refresh token
    await this.storeRefreshToken(payload.userId, newTokens.refreshToken);

    return newTokens;
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateReferralCode(firstName: string, lastName: string): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${firstName.substring(0, 2)}${lastName.substring(0, 2)}${randomSuffix}`.toUpperCase();
  }
}

// Convenience function for API routes
export const verifyToken = AuthService.verifyAccessToken;

// Additional convenience functions
export const generateToken = (payload: JWTPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
};