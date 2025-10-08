import { NextRequest } from 'next/server';
import { AuthMiddleware } from '@/middleware/auth';
import { UserRole, JWTPayload } from '@/types/user';

// Mock the AuthService
jest.mock('@/lib/auth', () => ({
  AuthService: {
    verifyAccessToken: jest.fn(),
  },
}));

import { AuthService } from '@/lib/auth';

describe('AuthMiddleware', () => {
  const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
  
  const mockUser: JWTPayload = {
    userId: 'user123',
    email: 'test@example.com',
    role: UserRole.STUDENT
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid Bearer token', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token-123')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      const result = await AuthMiddleware.authenticate(mockRequest);

      expect(result).toEqual({ user: mockUser });
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should return error when authorization header is missing', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest;

      const result = await AuthMiddleware.authenticate(mockRequest);

      expect(result).toEqual({ error: 'Authorization header missing or invalid' });
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return error when authorization header does not start with Bearer', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Basic some-token')
        }
      } as unknown as NextRequest;

      const result = await AuthMiddleware.authenticate(mockRequest);

      expect(result).toEqual({ error: 'Authorization header missing or invalid' });
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return error when token verification fails', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const result = await AuthMiddleware.authenticate(mockRequest);

      expect(result).toEqual({ error: 'Invalid or expired token' });
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should extract token correctly from Bearer header', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(`Bearer ${token}`)
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      await AuthMiddleware.authenticate(mockRequest);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
    });
  });

  describe('authorize', () => {
    it('should authorize user with allowed role', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      const authorizeMiddleware = AuthMiddleware.authorize([UserRole.STUDENT, UserRole.MENTOR]);
      const result = await authorizeMiddleware(mockRequest);

      expect(result).toEqual({ authorized: true, user: mockUser });
    });

    it('should deny authorization for user with disallowed role', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      const authorizeMiddleware = AuthMiddleware.authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      const result = await authorizeMiddleware(mockRequest);

      expect(result).toEqual({ authorized: false, error: 'Insufficient permissions' });
    });

    it('should deny authorization when authentication fails', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const authorizeMiddleware = AuthMiddleware.authorize([UserRole.STUDENT]);
      const result = await authorizeMiddleware(mockRequest);

      expect(result).toEqual({ authorized: false, error: 'Invalid or expired token' });
    });
  });

  describe('requireMinimumRole', () => {
    it('should authorize user with sufficient role level', async () => {
      const adminUser: JWTPayload = {
        userId: 'admin123',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      };

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer admin-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(adminUser);

      const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.MENTOR);
      const result = await requireMinRoleMiddleware(mockRequest);

      expect(result).toEqual({ authorized: true, user: adminUser });
    });

    it('should deny authorization for user with insufficient role level', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer student-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser); // Student role

      const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.ADMIN);
      const result = await requireMinRoleMiddleware(mockRequest);

      expect(result).toEqual({ authorized: false, error: 'Insufficient permissions' });
    });

    it('should authorize user with exact minimum role', async () => {
      const mentorUser: JWTPayload = {
        userId: 'mentor123',
        email: 'mentor@example.com',
        role: UserRole.MENTOR
      };

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer mentor-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mentorUser);

      const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.MENTOR);
      const result = await requireMinRoleMiddleware(mockRequest);

      expect(result).toEqual({ authorized: true, user: mentorUser });
    });

    it('should handle role hierarchy correctly', async () => {
      const superAdminUser: JWTPayload = {
        userId: 'superadmin123',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN
      };

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer superadmin-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(superAdminUser);

      // Super admin should have access to student-level resources
      const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.STUDENT);
      const result = await requireMinRoleMiddleware(mockRequest);

      expect(result).toEqual({ authorized: true, user: superAdminUser });
    });
  });

  describe('requireAuth', () => {
    it('should return user when authentication succeeds without role restriction', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      const result = await AuthMiddleware.requireAuth(mockRequest);

      expect(result).toEqual({ user: mockUser });
    });

    it('should return user when authentication succeeds with allowed role', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      const result = await AuthMiddleware.requireAuth(mockRequest, [UserRole.STUDENT, UserRole.MENTOR]);

      expect(result).toEqual({ user: mockUser });
    });

    it('should return 401 response when authentication fails', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const result = await AuthMiddleware.requireAuth(mockRequest);

      expect(result).toHaveProperty('status', 401);
      // Check if it's a NextResponse by checking for json method
      expect(typeof (result as any).json).toBe('function');
    });

    it('should return 403 response when user has insufficient permissions', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest;

      mockAuthService.verifyAccessToken.mockResolvedValue(mockUser); // Student role

      const result = await AuthMiddleware.requireAuth(mockRequest, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      expect(result).toHaveProperty('status', 403);
      // Check if it's a NextResponse by checking for json method
      expect(typeof (result as any).json).toBe('function');
    });

    it('should handle missing authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest;

      const result = await AuthMiddleware.requireAuth(mockRequest);

      expect(result).toHaveProperty('status', 401);
      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Role Hierarchy', () => {
    const testCases = [
      { role: UserRole.STUDENT, level: 1 },
      { role: UserRole.MENTOR, level: 2 },
      { role: UserRole.AMBASSADOR, level: 2 },
      { role: UserRole.EMPLOYER, level: 3 },
      { role: UserRole.ADMIN, level: 4 },
      { role: UserRole.SUPER_ADMIN, level: 5 }
    ];

    testCases.forEach(({ role, level }) => {
      it(`should correctly handle ${role} role hierarchy`, async () => {
        const userWithRole: JWTPayload = {
          userId: 'test123',
          email: 'test@example.com',
          role: role
        };

        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer valid-token')
          }
        } as unknown as NextRequest;

        mockAuthService.verifyAccessToken.mockResolvedValue(userWithRole);

        // Test against a lower level role (should succeed)
        if (level > 1) {
          const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.STUDENT);
          const result = await requireMinRoleMiddleware(mockRequest);
          expect(result.authorized).toBe(true);
        }

        // Test against a higher level role (should fail unless it's the highest)
        if (level < 5) {
          const requireMinRoleMiddleware = AuthMiddleware.requireMinimumRole(UserRole.SUPER_ADMIN);
          const result = await requireMinRoleMiddleware(mockRequest);
          expect(result.authorized).toBe(false);
        }
      });
    });
  });
});