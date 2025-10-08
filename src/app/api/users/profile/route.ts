import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthMiddleware } from '@/middleware/auth';
import { ErrorHandler, ValidationError, NotFoundError, validateEmail, validatePhone } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { UserRole } from '@/types/user';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const authResult = await AuthMiddleware.requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { user: authUser } = authResult;

    // Find the user
    const user = await UserModel.findById(authUser.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Remove password from response
    const { password, ...userResponse } = user;

    return ErrorHandler.success(userResponse, 'Profile retrieved successfully');

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const authResult = await AuthMiddleware.requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { user: authUser } = authResult;
    const body = await request.json();

    // Find the user
    const user = await UserModel.findById(authUser.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate and update allowed fields
    const updates: any = {};

    // Update profile information
    if (body.profile) {
      const { firstName, lastName, bio, education } = body.profile;
      
      if (firstName !== undefined) {
        if (!firstName.trim()) {
          throw new ValidationError('First name cannot be empty');
        }
        updates['profile.firstName'] = firstName.trim();
      }

      if (lastName !== undefined) {
        if (!lastName.trim()) {
          throw new ValidationError('Last name cannot be empty');
        }
        updates['profile.lastName'] = lastName.trim();
      }

      if (bio !== undefined) {
        updates['profile.bio'] = bio;
      }

      if (education !== undefined) {
        if (Array.isArray(education)) {
          // Validate education entries
          for (const edu of education) {
            if (!edu.institution || !edu.degree || !edu.year) {
              throw new ValidationError('Education entries must include institution, degree, and year');
            }
          }
          updates['profile.education'] = education;
        }
      }
    }

    // Update notification preferences
    if (body.preferences?.notifications) {
      const { email, sms, push } = body.preferences.notifications;
      
      if (email !== undefined) {
        updates['preferences.notifications.email'] = Boolean(email);
      }
      if (sms !== undefined) {
        updates['preferences.notifications.sms'] = Boolean(sms);
      }
      if (push !== undefined) {
        updates['preferences.notifications.push'] = Boolean(push);
      }
    }

    // Update contact information (requires re-verification)
    if (body.email && body.email !== user.email) {
      if (!validateEmail(body.email)) {
        throw new ValidationError('Invalid email format');
      }
      
      // Check if email is already taken
      const existingUser = await UserModel.findByEmail(body.email.toLowerCase());
      
      if (existingUser && existingUser.id !== user.id) {
        throw new ValidationError('Email is already in use');
      }

      updates.email = body.email.toLowerCase();
      updates.verification = {
        ...user.verification,
        emailVerified: false
      };
    }

    if (body.phone && body.phone !== user.phone) {
      if (!validatePhone(body.phone)) {
        throw new ValidationError('Invalid phone number format');
      }
      
      // Check if phone is already taken
      const existingUser = await UserModel.findByPhone(body.phone);
      
      if (existingUser && existingUser.id !== user.id) {
        throw new ValidationError('Phone number is already in use');
      }

      updates.phone = body.phone;
      updates.verification = {
        ...user.verification,
        phoneVerified: false
      };
    }

    // Apply updates
    let updatedUser = user;
    if (Object.keys(updates).length > 0) {
      updatedUser = await UserModel.update(user.id!, updates);
    }

    // Remove password from response
    const { password, ...userResponse } = updatedUser;

    return ErrorHandler.success(userResponse, 'Profile updated successfully');

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
