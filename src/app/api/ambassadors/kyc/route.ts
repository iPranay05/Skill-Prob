import { NextRequest, NextResponse } from 'next/server';
import { AmbassadorService } from '../../../../lib/ambassadorService';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

interface KYCData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Identity Documents
  panNumber?: string; // For India
  aadharNumber?: string; // For India
  passportNumber?: string; // International
  drivingLicense?: string;
  
  // Bank Details
  bankAccount: {
    accountNumber: string;
    routingNumber: string; // Or IFSC for India
    bankName: string;
    accountHolderName: string;
    accountType: 'savings' | 'checking' | 'current';
  };
  
  // Document Uploads (file URLs)
  documents: {
    panCard?: string;
    aadharCard?: string;
    passport?: string;
    bankStatement?: string;
    addressProof?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an ambassador
    if (authResult.user.role !== UserRole.AMBASSADOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Ambassador role required.' },
        { status: 403 }
      );
    }

    const kycData: KYCData = await request.json();

    // Validate required fields
    const requiredFields = ['fullName', 'dateOfBirth', 'address', 'bankAccount'];
    for (const field of requiredFields) {
      if (!kycData[field as keyof KYCData]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate bank account details
    if (!kycData.bankAccount.accountNumber || !kycData.bankAccount.routingNumber || !kycData.bankAccount.bankName) {
      return NextResponse.json(
        { success: false, error: 'Complete bank account details are required' },
        { status: 400 }
      );
    }

    // Validate at least one identity document
    if (!kycData.panNumber && !kycData.aadharNumber && !kycData.passportNumber && !kycData.drivingLicense) {
      return NextResponse.json(
        { success: false, error: 'At least one identity document is required' },
        { status: 400 }
      );
    }

    // Get ambassador record
    const ambassador = await AmbassadorService.getAmbassadorByUserId(authResult.user.userId);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Update ambassador with KYC data
    const { error: updateError } = await supabaseAdmin
      .from('ambassadors')
      .update({
        payout_details: {
          ...kycData,
          verified: false, // Will be verified by admin
          submittedAt: new Date().toISOString(),
          status: 'pending_verification'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', ambassador.id);

    if (updateError) {
      throw new APIError(`Failed to submit KYC data: ${updateError.message}`, 500);
    }

    // Create audit log (optional - don't fail if audit table doesn't exist)
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: authResult.user.userId,
          action: 'kyc_submitted',
          resource_type: 'ambassador',
          resource_id: ambassador.id,
          details: {
            submittedFields: Object.keys(kycData),
            timestamp: new Date().toISOString()
          }
        });
    } catch (auditError) {
      console.log('Audit log failed (non-critical):', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'KYC verification submitted successfully',
        status: 'pending_verification',
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an ambassador
    if (authResult.user.role !== UserRole.AMBASSADOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Ambassador role required.' },
        { status: 403 }
      );
    }

    // Get ambassador record
    const ambassador = await AmbassadorService.getAmbassadorByUserId(authResult.user.userId);
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    const payoutDetails = ambassador.payoutDetails || {};
    
    return NextResponse.json({
      success: true,
      data: {
        status: payoutDetails.status || 'not_submitted',
        verified: payoutDetails.verified || false,
        submittedAt: payoutDetails.submittedAt,
        verifiedAt: payoutDetails.verifiedAt,
        rejectionReason: payoutDetails.rejectionReason,
        // Don't return sensitive data like full bank details
        hasPersonalInfo: !!(payoutDetails.fullName && payoutDetails.dateOfBirth),
        hasBankDetails: !!(payoutDetails.bankAccount?.accountNumber),
        hasDocuments: !!(payoutDetails.documents && Object.keys(payoutDetails.documents).length > 0)
      }
    });

  } catch (error) {
    console.error('KYC status fetch error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}