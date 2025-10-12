import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../../lib/auth';
import { APIError } from '../../../../../../lib/errors';
import { UserRole } from '../../../../../../types/user';
import { supabaseAdmin } from '../../../../../../lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
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

    const { resourceId } = await params;

    // Get resource details
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('ambassador_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('is_active', true)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Get ambassador record
    const { data: ambassador, error: ambassadorError } = await supabaseAdmin
      .from('ambassadors')
      .select('id')
      .eq('user_id', authResult.user.userId)
      .single();

    if (ambassadorError || !ambassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador profile not found' },
        { status: 404 }
      );
    }

    // Track download
    const { error: downloadError } = await supabaseAdmin
      .from('resource_downloads')
      .insert({
        resource_id: resourceId,
        ambassador_id: ambassador.id,
        downloaded_at: new Date().toISOString()
      });

    if (downloadError) {
      console.error('Failed to track download:', downloadError);
      // Don't fail the request if tracking fails
    }

    // Update download count
    const { error: updateError } = await supabaseAdmin
      .from('ambassador_resources')
      .update({
        download_count: (resource.download_count || 0) + 1
      })
      .eq('id', resourceId);

    if (updateError) {
      console.error('Failed to update download count:', updateError);
      // Don't fail the request if count update fails
    }

    // For now, return the resource URL for direct download
    // In a production environment, you might want to:
    // 1. Generate a signed URL for S3/cloud storage
    // 2. Stream the file content directly
    // 3. Implement access controls and rate limiting

    if (resource.url.startsWith('http')) {
      // External URL - redirect
      return NextResponse.redirect(resource.url);
    } else {
      // Internal file - you would implement file serving here
      return NextResponse.json({
        success: true,
        data: {
          downloadUrl: resource.url,
          filename: resource.title,
          type: resource.type
        }
      });
    }

  } catch (error) {
    console.error('Resource download error:', error);
    
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