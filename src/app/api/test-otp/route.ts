import { NextRequest } from 'next/server';
import { ErrorHandler } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test OTP endpoint received:', body);
    
    return ErrorHandler.success(
      { 
        received: body,
        timestamp: new Date().toISOString(),
        message: 'Test endpoint working - server has latest code'
      },
      'Test successful'
    );
  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
