import { NextRequest, NextResponse } from 'next/server';
import { RateLimitService } from './rateLimiting';
import { InputValidator } from './inputValidation';
import { AuditService } from './auditService';
import { SuspiciousActivityMonitor } from './suspiciousActivityMonitor';
import { ErrorHandler, RateLimitError, SecurityError } from '@/lib/errors';

export interface SecurityConfig {
  rateLimitAction?: string;
  requireAuth?: boolean;
  validateInput?: boolean;
  auditAction?: string;
  skipSuspiciousActivityCheck?: boolean;
  customRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface RequestContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export class SecurityMiddleware {
  // Main security middleware function
  static async apply(
    request: NextRequest,
    config: SecurityConfig = {},
    handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    let context: RequestContext;
    let auditData: any = {};

    try {
      // Extract request context
      context = await this.extractRequestContext(request);
      
      // 1. Check for blocked identifiers
      await this.checkBlocked(context);
      
      // 2. Apply rate limiting
      if (config.rateLimitAction) {
        await this.applyRateLimit(context, config);
      }
      
      // 3. Validate input if required
      if (config.validateInput) {
        await this.validateRequest(request);
      }
      
      // 4. Check for suspicious activity
      if (!config.skipSuspiciousActivityCheck) {
        await this.checkSuspiciousActivity(context);
      }
      
      // 5. Authentication check if required
      if (config.requireAuth) {
        await this.validateAuthentication(request, context);
      }
      
      // Execute the actual handler
      const response = await handler(request, context);
      
      // 6. Log successful operation
      if (config.auditAction) {
        auditData = {
          success: true,
          responseStatus: response.status,
          processingTime: Date.now() - startTime
        };
        
        await AuditService.logActivity({
          userId: context.userId,
          userEmail: context.userEmail,
          userRole: context.userRole,
          action: config.auditAction,
          resource: this.getResourceFromPath(request.nextUrl.pathname),
          details: auditData,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sessionId: context.sessionId,
          success: true,
          severity: 'low',
          category: 'data_access'
        });
      }
      
      // Record successful request for rate limiting
      if (config.rateLimitAction) {
        await RateLimitService.recordSuccess(
          this.getRateLimitIdentifier(context, config.rateLimitAction),
          config.rateLimitAction
        );
      }
      
      return response;
      
    } catch (error) {
      // Log failed operation
      if (config.auditAction) {
        auditData = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        };
        
        await AuditService.logActivity({
          userId: context?.userId,
          userEmail: context?.userEmail,
          userRole: context?.userRole,
          action: config.auditAction,
          resource: this.getResourceFromPath(request.nextUrl.pathname),
          details: auditData,
          ipAddress: context?.ipAddress || this.getClientIP(request),
          userAgent: context?.userAgent || request.headers.get('user-agent') || '',
          sessionId: context?.sessionId,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          severity: this.getErrorSeverity(error),
          category: 'security'
        });
      }
      
      // Record failed request for rate limiting
      if (config.rateLimitAction && context) {
        await RateLimitService.recordFailure(
          this.getRateLimitIdentifier(context, config.rateLimitAction),
          config.rateLimitAction
        );
      }
      
      return ErrorHandler.handle(error);
    }
  }

  // Extract request context information
  private static async extractRequestContext(request: NextRequest): Promise<RequestContext> {
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Try to extract user information from JWT token
    let userId: string | undefined;
    let userRole: string | undefined;
    let userEmail: string | undefined;
    let sessionId: string | undefined;
    
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // This would integrate with your JWT verification service
        // const payload = await AuthService.verifyToken(token);
        // userId = payload.userId;
        // userRole = payload.role;
        // userEmail = payload.email;
      }
      
      // Extract session ID from cookies or headers
      sessionId = request.cookies.get('session-id')?.value || 
                 request.headers.get('x-session-id') || 
                 undefined;
                 
    } catch (error) {
      // Token verification failed, continue without user context
    }
    
    return {
      userId,
      userRole,
      userEmail,
      ipAddress,
      userAgent,
      sessionId
    };
  }

  // Check if identifier is blocked
  private static async checkBlocked(context: RequestContext): Promise<void> {
    const ipIdentifier = `ip:${context.ipAddress}`;
    const userIdentifier = context.userId ? `user:${context.userId}` : null;
    
    // Check IP block
    const ipBlock = await RateLimitService.isBlocked(ipIdentifier);
    if (ipBlock.blocked) {
      throw new SecurityError(`Access blocked: ${ipBlock.reason}`, 'BLOCKED_IP');
    }
    
    // Check user block if authenticated
    if (userIdentifier) {
      const userBlock = await RateLimitService.isBlocked(userIdentifier);
      if (userBlock.blocked) {
        throw new SecurityError(`Account blocked: ${userBlock.reason}`, 'BLOCKED_USER');
      }
    }
  }

  // Apply rate limiting
  private static async applyRateLimit(
    context: RequestContext,
    config: SecurityConfig
  ): Promise<void> {
    const identifier = this.getRateLimitIdentifier(context, config.rateLimitAction!);
    
    const result = await RateLimitService.checkRateLimit(
      identifier,
      config.rateLimitAction!,
      config.customRateLimit
    );
    
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds`,
        result.resetTime,
        result.remaining
      );
    }
  }

  // Validate request input
  private static async validateRequest(request: NextRequest): Promise<void> {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().json();
        
        // Check for common injection patterns
        const bodyString = JSON.stringify(body);
        
        if (!InputValidator.validateCSPCompliance(bodyString)) {
          throw new SecurityError('Request contains potentially malicious content', 'MALICIOUS_CONTENT');
        }
        
        // Validate against common NoSQL injection patterns
        const sanitizedBody = InputValidator.sanitizeMongoQuery(body);
        if (JSON.stringify(sanitizedBody) !== bodyString) {
          throw new SecurityError('Request contains potentially malicious query patterns', 'INJECTION_ATTEMPT');
        }
        
      } catch (error) {
        if (error instanceof SecurityError) {
          throw error;
        }
        // If JSON parsing fails, that's handled by the actual handler
      }
    }
    
    // Validate URL parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams.entries()) {
      if (!InputValidator.validateCSPCompliance(value)) {
        throw new SecurityError(`URL parameter '${key}' contains potentially malicious content`, 'MALICIOUS_PARAMETER');
      }
    }
  }

  // Check for suspicious activity
  private static async checkSuspiciousActivity(context: RequestContext): Promise<void> {
    const ipIdentifier = `ip:${context.ipAddress}`;
    const userIdentifier = context.userId ? `user:${context.userId}` : null;
    
    // Check IP-based suspicious activity
    const ipAbuse = await RateLimitService.detectAbuse(ipIdentifier);
    if (ipAbuse.isAbusive) {
      await SuspiciousActivityMonitor.reportSuspiciousActivity({
        identifier: ipIdentifier,
        type: 'rate_limit_abuse',
        severity: ipAbuse.riskScore >= 75 ? 'high' : 'medium',
        details: {
          riskScore: ipAbuse.riskScore,
          reasons: ipAbuse.reasons,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      });
      
      // Auto-block if risk score is very high
      if (ipAbuse.riskScore >= 90) {
        await RateLimitService.blockIdentifier(
          ipIdentifier,
          60 * 60 * 1000, // 1 hour
          `Automatic block due to high risk score: ${ipAbuse.riskScore}`
        );
        
        throw new SecurityError('Access temporarily blocked due to suspicious activity', 'AUTO_BLOCKED');
      }
    }
    
    // Check user-based suspicious activity if authenticated
    if (userIdentifier) {
      const userAbuse = await RateLimitService.detectAbuse(userIdentifier);
      if (userAbuse.isAbusive && userAbuse.riskScore >= 70) {
        await SuspiciousActivityMonitor.reportSuspiciousActivity({
          identifier: userIdentifier,
          type: 'user_abuse',
          severity: userAbuse.riskScore >= 85 ? 'high' : 'medium',
          details: {
            riskScore: userAbuse.riskScore,
            reasons: userAbuse.reasons,
            userId: context.userId,
            userEmail: context.userEmail
          }
        });
      }
    }
  }

  // Validate authentication
  private static async validateAuthentication(
    request: NextRequest,
    context: RequestContext
  ): Promise<void> {
    if (!context.userId) {
      throw new SecurityError('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
    
    // Additional authentication checks could go here
    // e.g., token expiration, session validation, etc.
  }

  // Get rate limit identifier based on context and action
  private static getRateLimitIdentifier(context: RequestContext, action: string): string {
    // For user-specific actions, use user ID if available, otherwise fall back to IP
    if (context.userId && ['api', 'payment', 'course_access'].includes(action)) {
      return `user:${context.userId}`;
    }
    
    // For authentication actions, always use IP
    return `ip:${context.ipAddress}`;
  }

  // Extract client IP address
  private static getClientIP(request: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to connection IP (may be proxy IP)
    return request.ip || '127.0.0.1';
  }

  // Get resource name from URL path
  private static getResourceFromPath(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length >= 2 && segments[0] === 'api') {
      return segments.slice(1).join('/');
    }
    
    return pathname;
  }

  // Determine error severity based on error type
  private static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof SecurityError) {
      return 'high';
    }
    
    if (error instanceof RateLimitError) {
      return 'medium';
    }
    
    return 'low';
  }
}

// Convenience wrapper for common security configurations
export class SecurityPresets {
  static readonly PUBLIC_API: SecurityConfig = {
    rateLimitAction: 'api',
    validateInput: true,
    auditAction: 'api_access'
  };
  
  static readonly AUTHENTICATED_API: SecurityConfig = {
    rateLimitAction: 'api',
    requireAuth: true,
    validateInput: true,
    auditAction: 'authenticated_api_access'
  };
  
  static readonly AUTHENTICATION: SecurityConfig = {
    rateLimitAction: 'login',
    validateInput: true,
    auditAction: 'authentication_attempt'
  };
  
  static readonly REGISTRATION: SecurityConfig = {
    rateLimitAction: 'registration',
    validateInput: true,
    auditAction: 'registration_attempt'
  };
  
  static readonly PAYMENT: SecurityConfig = {
    rateLimitAction: 'payment',
    requireAuth: true,
    validateInput: true,
    auditAction: 'payment_attempt'
  };
  
  static readonly ADMIN_API: SecurityConfig = {
    rateLimitAction: 'api',
    requireAuth: true,
    validateInput: true,
    auditAction: 'admin_api_access',
    customRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200 // Higher limit for admin users
    }
  };
}