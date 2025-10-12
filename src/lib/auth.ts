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
      const decoded = jwt.verify(token, jwtRefreshSecret) as JWTPayload;

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== token) {
        throw new Error('Invalid or expired refresh token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateReferralCode(firstName: string, lastName: string): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${firstName.slice(0, 2)}${lastName.slice(0, 2)}${randomSuffix}`.toUpperCase();
  }

  static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expirySeconds = 7 * 24 * 60 * 60; // 7 days
    await redis.setex(`refresh_token:${userId}`, expirySeconds, refreshToken);
  }

  static async revokeRefreshToken(userId: string): Promise<void> {
    await redis.del(`refresh_token:${userId}`);
  }

  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Generate new tokens
    const newTokens = this.generateTokens({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    // Store new refresh token
    await this.storeRefreshToken(decoded.userId, newTokens.refreshToken);

    return newTokens;
  }
}

// Helper function for API routes
export async function verifyToken(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, user: null };
    }

    const token = authHeader.substring(7);
    const decoded = await AuthService.verifyAccessToken(token);

    return {
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    return { success: false, user: null };
  }
}