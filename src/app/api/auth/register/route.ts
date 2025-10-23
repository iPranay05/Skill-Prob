import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';
import { ErrorHandler, ValidationError, ConflictError, validateRequired, validateEmail, validatePhone, validatePassword } from '@/lib/errors';
import { UserModel } from '@/models/User';
import { OTPVerificationModel } from '@/models/OTPVerification';
import { UserRole, VerificationStatus } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Registration API called');
    await connectToDatabase();

    const body = await request.json();
    console.log('📝 Request body:', body);
    const { email, phone, password, firstName, lastName, referralCode, role, mentorInfo, ambassadorInfo } = body;
    console.log('👤 Role:', role);
    console.log('🎓 Mentor info:', mentorInfo);
    console.log('🎯 Ambassador info:', ambassadorInfo);

    // Validate required fields
    validateRequired(body, ['email', 'password', 'firstName', 'lastName']);

    // Validate email format
    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate phone format if provided
    if (phone && !validatePhone(phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password does not meet requirements', {
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUserByEmail = await UserModel.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictError('User with this email already exists');
    }

    if (phone) {
      const existingUserByPhone = await UserModel.findByPhone(phone);
      if (existingUserByPhone) {
        throw new ConflictError('User with this phone number already exists');
      }
    }

    // Validate referral code if provided (check both user and ambassador referrals)
    let referredBy: string | undefined;
    let ambassadorReferralCode: string | undefined;
    
    if (referralCode) {
      // First check if it's an ambassador referral code
      try {
        const { AmbassadorService } = await import('@/lib/ambassadorService');
        const ambassador = await AmbassadorService.getAmbassadorByReferralCode(referralCode);
        if (ambassador) {
          ambassadorReferralCode = referralCode;
        }
      } catch (error) {
        console.warn('Ambassador service check failed:', error);
      }
      
      // If not an ambassador code, check user referral codes
      if (!ambassadorReferralCode) {
        const referrer = await UserModel.findByReferralCode(referralCode);
        if (!referrer) {
          throw new ValidationError('Invalid referral code');
        }
        referredBy = referrer.id;
      }
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Generate referral code for new user
    const userReferralCode = AuthService.generateReferralCode(firstName, lastName);

    // Determine user role
    let userRole = UserRole.STUDENT; // default
    if (role === 'mentor') {
      userRole = UserRole.MENTOR;
    } else if (role === 'ambassador') {
      userRole = UserRole.AMBASSADOR;
    }

    // Create user data
    const userData: any = {
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: userRole,
      profile: {
        firstName,
        lastName,
        ...(mentorInfo && {
          // Education
          degree: mentorInfo.degree,
          major: mentorInfo.major,
          cgpa: mentorInfo.cgpa,
          university: mentorInfo.university,
          startYear: mentorInfo.startYear,
          endYear: mentorInfo.endYear,
          // Professional
          skills: mentorInfo.skills,
          experience: mentorInfo.experience,
          linkedinUrl: mentorInfo.linkedinUrl,
          motivation: mentorInfo.motivation
        }),
        ...(ambassadorInfo && {
          // Personal Information
          dateOfBirth: ambassadorInfo.dateOfBirth,
          gender: ambassadorInfo.gender,
          city: ambassadorInfo.city,
          state: ambassadorInfo.state,
          country: ambassadorInfo.country,
          // Education
          currentEducation: ambassadorInfo.currentEducation,
          institution: ambassadorInfo.institution,
          course: ambassadorInfo.course,
          year: ambassadorInfo.year,
          // Social Media
          instagramHandle: ambassadorInfo.instagramHandle,
          linkedinUrl: ambassadorInfo.linkedinUrl,
          twitterHandle: ambassadorInfo.twitterHandle,
          // Ambassador Specific
          referralSource: ambassadorInfo.referralSource,
          networkSize: ambassadorInfo.networkSize,
          motivation: ambassadorInfo.motivation,
          availableHours: ambassadorInfo.availableHours,
          previousExperience: ambassadorInfo.previousExperience
        })
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        kycStatus: VerificationStatus.PENDING
      },
      preferences: {
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      referralCode: userReferralCode
    };

    // Only add referredBy if it exists
    if (referredBy) {
      userData.referredBy = referredBy;
    }

    // Create user
    const user = await UserModel.create(userData);

    // If user is an ambassador, create ambassador record
    if (role === 'ambassador' && ambassadorInfo && user.id) {
      try {
        const { AmbassadorService } = await import('@/lib/ambassadorService');
        
        // Create ambassador application data
        const ambassadorApplication = {
          motivation: ambassadorInfo.motivation,
          socialMedia: [
            ...(ambassadorInfo.instagramHandle ? [{
              platform: 'instagram',
              handle: ambassadorInfo.instagramHandle,
              followers: 0 // Default, can be updated later
            }] : []),
            ...(ambassadorInfo.linkedinUrl ? [{
              platform: 'linkedin',
              handle: ambassadorInfo.linkedinUrl,
              followers: 0
            }] : []),
            ...(ambassadorInfo.twitterHandle ? [{
              platform: 'twitter',
              handle: ambassadorInfo.twitterHandle,
              followers: 0
            }] : [])
          ],
          experience: ambassadorInfo.previousExperience || 'No previous experience mentioned'
        };

        await AmbassadorService.applyForAmbassador(user.id, ambassadorApplication);
        console.log('✅ Ambassador record created successfully');
      } catch (ambassadorError) {
        console.error('❌ Failed to create ambassador record:', ambassadorError);
        // Don't fail the registration, just log the error
      }
    }

    // Generate and send email OTP
    const emailOTP = AuthService.generateOTP();
    await OTPVerificationModel.create({
      userId: user.id!,
      type: 'email',
      code: emailOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      verified: false
    });

    // Send email OTP
    await NotificationService.sendOTPEmail(email, emailOTP, firstName);

    // Generate and send phone OTP if phone is provided
    if (phone) {
      const phoneOTP = AuthService.generateOTP();
      await OTPVerificationModel.create({
        userId: user.id!,
        type: 'phone',
        code: phoneOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        verified: false
      });

      // Send SMS OTP
      await NotificationService.sendOTPSMS(phone, phoneOTP);
    }

    // Process ambassador referral if applicable
    if (ambassadorReferralCode && user.id) {
      try {
        const { AmbassadorService } = await import('@/lib/ambassadorService');
        await AmbassadorService.processReferralRegistration(
          ambassadorReferralCode,
          user.id,
          {
            source: 'registration',
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || '',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          }
        );
      } catch (error) {
        // Log error but don't fail registration
        console.error('Ambassador referral processing failed:', error);
      }
    }

    // Return success response (without sensitive data)
    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user.profile,
      verification: user.verification,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      referralProcessed: !!ambassadorReferralCode
    };

    return ErrorHandler.success(
      userResponse,
      'User registered successfully. Please verify your email and phone number.',
      201
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
