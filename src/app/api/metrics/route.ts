import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cacheService } from '@/lib/cache';

// System metrics collection endpoint for monitoring
export async function GET(request: NextRequest) {
    try {
        const startTime = Date.now();

        // Initialize Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Collect various system metrics
        const metrics = {
            timestamp: new Date().toISOString(),
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                nodeVersion: process.version,
                platform: process.platform
            },
            database: {
                connectionStatus: 'unknown',
                responseTime: 0,
                activeConnections: 0
            },
            cache: {
                status: 'unknown',
                stats: null
            },
            application: {
                totalUsers: 0,
                activeSessions: 0,
                totalCourses: 0,
                totalEnrollments: 0,
                totalLiveSessions: 0,
                totalJobs: 0
            },
            performance: {
                avgResponseTime: 0,
                requestsPerMinute: 0,
                errorRate: 0
            }
        };

        // Test database connection and get basic stats
        try {
            const dbStartTime = Date.now();

            // Test connection with a simple query
            const { data: healthCheck } = await supabase
                .from('users')
                .select('count')
                .limit(1)
                .single();

            metrics.database.responseTime = Date.now() - dbStartTime;
            metrics.database.connectionStatus = 'healthy';

            // Get application statistics
            const [
                { count: userCount },
                { count: courseCount },
                { count: enrollmentCount },
                { count: sessionCount },
                { count: jobCount }
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('courses').select('*', { count: 'exact', head: true }),
                supabase.from('enrollments').select('*', { count: 'exact', head: true }),
                supabase.from('live_sessions').select('*', { count: 'exact', head: true }),
                supabase.from('jobs').select('*', { count: 'exact', head: true })
            ]);

            metrics.application.totalUsers = userCount || 0;
            metrics.application.totalCourses = courseCount || 0;
            metrics.application.totalEnrollments = enrollmentCount || 0;
            metrics.application.totalLiveSessions = sessionCount || 0;
            metrics.application.totalJobs = jobCount || 0;

        } catch (error) {
            metrics.database.connectionStatus = 'error';
            metrics.database.responseTime = Date.now() - startTime;
        }

        // Test cache connection
        try {
            const cacheStats = await cacheService.getStats();
            metrics.cache.status = cacheStats ? 'healthy' : 'error';
            metrics.cache.stats = cacheStats;
        } catch (error) {
            metrics.cache.status = 'error';
        }

        // Calculate total response time
        const totalResponseTime = Date.now() - startTime;
        metrics.performance.avgResponseTime = totalResponseTime;

        // Return metrics in Prometheus format if requested
        const acceptHeader = request.headers.get('accept');
        if (acceptHeader?.includes('text/plain')) {
            const prometheusMetrics = formatPrometheusMetrics(metrics);
            return new NextResponse(prometheusMetrics, {
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // Return JSON format by default
        return NextResponse.json({
            success: true,
            data: metrics,
            responseTime: totalResponseTime
        });

    } catch (error) {
        console.error('Metrics collection error:', error);

        return NextResponse.json({
            success: false,
            error: {
                code: 'METRICS_COLLECTION_ERROR',
                message: 'Failed to collect system metrics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        }, { status: 500 });
    }
}

// Format metrics for Prometheus monitoring
function formatPrometheusMetrics(metrics: any): string {
    const lines: string[] = [];

    // System metrics
    lines.push(`# HELP system_uptime_seconds System uptime in seconds`);
    lines.push(`# TYPE system_uptime_seconds gauge`);
    lines.push(`system_uptime_seconds ${metrics.system.uptime}`);

    lines.push(`# HELP system_memory_usage_bytes Memory usage in bytes`);
    lines.push(`# TYPE system_memory_usage_bytes gauge`);
    lines.push(`system_memory_usage_bytes{type="rss"} ${metrics.system.memory.rss}`);
    lines.push(`system_memory_usage_bytes{type="heapUsed"} ${metrics.system.memory.heapUsed}`);
    lines.push(`system_memory_usage_bytes{type="heapTotal"} ${metrics.system.memory.heapTotal}`);

    // Database metrics
    lines.push(`# HELP database_response_time_ms Database response time in milliseconds`);
    lines.push(`# TYPE database_response_time_ms gauge`);
    lines.push(`database_response_time_ms ${metrics.database.responseTime}`);

    lines.push(`# HELP database_connection_status Database connection status (1=healthy, 0=error)`);
    lines.push(`# TYPE database_connection_status gauge`);
    lines.push(`database_connection_status ${metrics.database.connectionStatus === 'healthy' ? 1 : 0}`);

    // Application metrics
    lines.push(`# HELP app_total_users Total number of users`);
    lines.push(`# TYPE app_total_users gauge`);
    lines.push(`app_total_users ${metrics.application.totalUsers}`);

    lines.push(`# HELP app_total_courses Total number of courses`);
    lines.push(`# TYPE app_total_courses gauge`);
    lines.push(`app_total_courses ${metrics.application.totalCourses}`);

    lines.push(`# HELP app_total_enrollments Total number of enrollments`);
    lines.push(`# TYPE app_total_enrollments gauge`);
    lines.push(`app_total_enrollments ${metrics.application.totalEnrollments}`);

    lines.push(`# HELP app_total_live_sessions Total number of live sessions`);
    lines.push(`# TYPE app_total_live_sessions gauge`);
    lines.push(`app_total_live_sessions ${metrics.application.totalLiveSessions}`);

    lines.push(`# HELP app_total_jobs Total number of jobs`);
    lines.push(`# TYPE app_total_jobs gauge`);
    lines.push(`app_total_jobs ${metrics.application.totalJobs}`);

    // Cache metrics
    lines.push(`# HELP cache_status Cache connection status (1=healthy, 0=error)`);
    lines.push(`# TYPE cache_status gauge`);
    lines.push(`cache_status ${metrics.cache.status === 'healthy' ? 1 : 0}`);

    // Performance metrics
    lines.push(`# HELP http_request_duration_ms HTTP request duration in milliseconds`);
    lines.push(`# TYPE http_request_duration_ms gauge`);
    lines.push(`http_request_duration_ms ${metrics.performance.avgResponseTime}`);

    return lines.join('\n') + '\n';
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
    try {
        // Quick health check
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Test database connection
        await supabase.from('users').select('count').limit(1);

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        return new NextResponse(null, { status: 503 });
    }
}