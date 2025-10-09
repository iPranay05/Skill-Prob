import { NextRequest } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database';
import { ErrorHandler } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const dbHealth = await checkDatabaseHealth();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: dbHealth
      }
    };

    const allHealthy = Object.values(dbHealth).every(status => status === true);

    return ErrorHandler.success(
      health,
      allHealthy ? 'All services are healthy' : 'Some services are experiencing issues',
      allHealthy ? 200 : 503
    );

  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
