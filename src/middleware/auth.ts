import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserRole, JWTPayload } from '@/types/user';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 1,
  [UserRole.MENTOR]: 2,
  [UserRole.AMBASSADOR]: 2,
  [UserRole.EMPLOYER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5
};

export class AuthMiddleware {
  static async authenticate(request: NextRequest): Promise<{ user: JWTPayload } | { error: string }> {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'Authorization header missing or invalid' };
      }

      const token = authHeader.substring(7);
      const user = await AuthService.verifyAccessToken(token);

      return { user };
    } catch (error) {
      return { error: 'Invalid or expired token' };
    }
  }

  static authorize(allowedRoles: UserRole[]) {
    return async (request: NextRequest): Promise<{ authorized: boolean; user?: JWTPayload; error?: string }> => {
      const authResult = await this.authenticate(request);
      
      if ('error' in authResult) {
        return { authorized: false, error: authResult.error };
      }

      const { user } = authResult;
      
      if (!allowedRoles.includes(user.role)) {
        return { authorized: false, error: 'Insufficient permissions' };
      }

      return { authorized: true, user };
    };
  }

  static requireMinimumRole(minimumRole: UserRole) {
    return async (request: NextRequest): Promise<{ authorized: boolean; user?: JWTPayload; error?: string }> => {
      const authResult = await this.authenticate(request);
      
      if ('error' in authResult) {
        return { authorized: false, error: authResult.error };
      }

      const { user } = authResult;
      const userRoleLevel = ROLE_HIERARCHY[user.role];
      const minimumRoleLevel = ROLE_HIERARCHY[minimumRole];
      
      if (userRoleLevel < minimumRoleLevel) {
        return { authorized: false, error: 'Insufficient permissions' };
      }

      return { authorized: true, user };
    };
  }

  static async requireAuth(request: NextRequest, allowedRoles?: UserRole[]): Promise<NextResponse | { user: JWTPayload }> {
    const authResult = await this.authenticate(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: authResult.error } },
        { status: 401 }
      );
    }

    const { user } = authResult;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    return { user };
  }
}

// Permission definitions for different resources
export const PERMISSIONS = {
  USERS: {
    CREATE: ['admin', 'super_admin'],
    READ: ['student', 'mentor', 'ambassador', 'employer', 'admin', 'super_admin'],
    UPDATE: ['admin', 'super_admin'],
    DELETE: ['super_admin']
  },
  COURSES: {
    CREATE: ['mentor', 'admin', 'super_admin'],
    READ: ['student', 'mentor', 'ambassador', 'employer', 'admin', 'super_admin'],
    UPDATE: ['mentor', 'admin', 'super_admin'],
    DELETE: ['mentor', 'admin', 'super_admin']
  },
  AMBASSADORS: {
    CREATE: ['admin', 'super_admin'],
    READ: ['ambassador', 'admin', 'super_admin'],
    UPDATE: ['ambassador', 'admin', 'super_admin'],
    DELETE: ['admin', 'super_admin']
  },
  PAYMENTS: {
    CREATE: ['student', 'admin', 'super_admin'],
    READ: ['student', 'mentor', 'ambassador', 'admin', 'super_admin'],
    UPDATE: ['admin', 'super_admin'],
    DELETE: ['super_admin']
  }
} as const;