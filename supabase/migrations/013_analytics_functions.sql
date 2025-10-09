-- Analytics functions for comprehensive reporting

-- Function to get enrollment trend data
CREATE OR REPLACE FUNCTION get_enrollment_trend(timeframe_param TEXT DEFAULT 'month')
RETURNS TABLE(
    month TEXT,
    count BIGINT,
    revenue NUMERIC
) AS $$
BEGIN
    CASE timeframe_param
        WHEN 'week' THEN
            RETURN QUERY
            SELECT 
                TO_CHAR(DATE_TRUNC('week', enrolled_at), 'YYYY-MM-DD') as month,
                COUNT(*) as count,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM course_enrollments
            WHERE enrolled_at >= NOW() - INTERVAL '12 weeks'
            GROUP BY DATE_TRUNC('week', enrolled_at)
            ORDER BY DATE_TRUNC('week', enrolled_at);
        
        WHEN 'quarter' THEN
            RETURN QUERY
            SELECT 
                TO_CHAR(DATE_TRUNC('quarter', enrolled_at), 'YYYY-"Q"Q') as month,
                COUNT(*) as count,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM course_enrollments
            WHERE enrolled_at >= NOW() - INTERVAL '8 quarters'
            GROUP BY DATE_TRUNC('quarter', enrolled_at)
            ORDER BY DATE_TRUNC('quarter', enrolled_at);
        
        WHEN 'year' THEN
            RETURN QUERY
            SELECT 
                TO_CHAR(DATE_TRUNC('year', enrolled_at), 'YYYY') as month,
                COUNT(*) as count,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM course_enrollments
            WHERE enrolled_at >= NOW() - INTERVAL '5 years'
            GROUP BY DATE_TRUNC('year', enrolled_at)
            ORDER BY DATE_TRUNC('year', enrolled_at);
        
        ELSE -- Default to month
            RETURN QUERY
            SELECT 
                TO_CHAR(DATE_TRUNC('month', enrolled_at), 'YYYY-MM') as month,
                COUNT(*) as count,
                COALESCE(SUM(amount_paid), 0) as revenue
            FROM course_enrollments
            WHERE enrolled_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', enrolled_at)
            ORDER BY DATE_TRUNC('month', enrolled_at);
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue by month
CREATE OR REPLACE FUNCTION get_revenue_by_month(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
    month TEXT,
    revenue NUMERIC,
    enrollments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('month', enrolled_at), 'YYYY-MM') as month,
        COALESCE(SUM(amount_paid), 0) as revenue,
        COUNT(*) as enrollments
    FROM course_enrollments
    WHERE enrolled_at >= NOW() - (months_back || ' months')::INTERVAL
    GROUP BY DATE_TRUNC('month', enrolled_at)
    ORDER BY DATE_TRUNC('month', enrolled_at);
END;
$$ LANGUAGE plpgsql;

-- Function to get ambassador performance metrics
CREATE OR REPLACE FUNCTION get_ambassador_performance()
RETURNS TABLE(
    ambassador_id UUID,
    ambassador_name TEXT,
    total_referrals BIGINT,
    successful_conversions BIGINT,
    total_earnings NUMERIC,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH ambassador_stats AS (
        SELECT 
            u.id as ambassador_id,
            COALESCE(u.profile->>'firstName', '') || ' ' || COALESCE(u.profile->>'lastName', '') as ambassador_name,
            COUNT(DISTINCT referred.id) as total_referrals,
            COUNT(DISTINCT ce.student_id) as successful_conversions,
            COALESCE(SUM(ce.amount_paid * 0.1), 0) as total_earnings -- 10% commission
        FROM users u
        LEFT JOIN users referred ON referred.referred_by = u.id
        LEFT JOIN course_enrollments ce ON ce.student_id = referred.id
        WHERE u.role = 'ambassador'
        GROUP BY u.id, u.profile
    )
    SELECT 
        as_data.ambassador_id,
        as_data.ambassador_name,
        as_data.total_referrals,
        as_data.successful_conversions,
        as_data.total_earnings,
        CASE 
            WHEN as_data.total_referrals > 0 
            THEN (as_data.successful_conversions::NUMERIC / as_data.total_referrals::NUMERIC) * 100
            ELSE 0
        END as conversion_rate
    FROM ambassador_stats as_data
    WHERE as_data.total_referrals > 0
    ORDER BY as_data.total_earnings DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get ambassador monthly metrics
CREATE OR REPLACE FUNCTION get_ambassador_monthly_metrics(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
    month TEXT,
    new_referrals BIGINT,
    conversions BIGINT,
    points_paid NUMERIC,
    roi NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', referred.created_at) as month_date,
            COUNT(DISTINCT referred.id) as new_referrals,
            COUNT(DISTINCT ce.student_id) as conversions,
            COALESCE(SUM(ce.amount_paid * 0.1), 0) as points_paid,
            COALESCE(SUM(ce.amount_paid), 0) as total_revenue
        FROM users ambassador
        LEFT JOIN users referred ON referred.referred_by = ambassador.id
        LEFT JOIN course_enrollments ce ON ce.student_id = referred.id
        WHERE ambassador.role = 'ambassador'
        AND referred.created_at >= NOW() - (months_back || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', referred.created_at)
    )
    SELECT 
        TO_CHAR(md.month_date, 'YYYY-MM') as month,
        md.new_referrals,
        md.conversions,
        md.points_paid,
        CASE 
            WHEN md.points_paid > 0 
            THEN md.total_revenue / md.points_paid
            ELSE 0
        END as roi
    FROM monthly_data md
    WHERE md.month_date IS NOT NULL
    ORDER BY md.month_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get average time to hire for internships
CREATE OR REPLACE FUNCTION get_avg_time_to_hire()
RETURNS TABLE(avg_days NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
    FROM job_applications
    WHERE status = 'hired'
    AND updated_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly placement metrics
CREATE OR REPLACE FUNCTION get_monthly_placement_metrics(months_back INTEGER DEFAULT 12)
RETURNS TABLE(
    month TEXT,
    applications BIGINT,
    hires BIGINT,
    placement_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_stats AS (
        SELECT 
            DATE_TRUNC('month', created_at) as month_date,
            COUNT(*) as applications,
            COUNT(CASE WHEN status = 'hired' THEN 1 END) as hires
        FROM job_applications
        WHERE created_at >= NOW() - (months_back || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', created_at)
    )
    SELECT 
        TO_CHAR(ms.month_date, 'YYYY-MM') as month,
        ms.applications,
        ms.hires,
        CASE 
            WHEN ms.applications > 0 
            THEN (ms.hires::NUMERIC / ms.applications::NUMERIC) * 100
            ELSE 0
        END as placement_rate
    FROM monthly_stats ms
    ORDER BY ms.month_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get course performance metrics
CREATE OR REPLACE FUNCTION get_course_performance_metrics()
RETURNS TABLE(
    course_id UUID,
    course_title TEXT,
    mentor_name TEXT,
    total_enrollments BIGINT,
    total_revenue NUMERIC,
    avg_rating NUMERIC,
    completion_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as course_id,
        c.title as course_title,
        COALESCE(u.profile->>'firstName', '') || ' ' || COALESCE(u.profile->>'lastName', '') as mentor_name,
        COUNT(DISTINCT ce.id) as total_enrollments,
        COALESCE(SUM(ce.amount_paid), 0) as total_revenue,
        COALESCE((c.ratings->>'average')::NUMERIC, 0) as avg_rating,
        CASE 
            WHEN COUNT(DISTINCT ce.id) > 0 
            THEN (COUNT(CASE WHEN ce.completed_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(DISTINCT ce.id)::NUMERIC) * 100
            ELSE 0
        END as completion_rate,
        c.created_at
    FROM courses c
    LEFT JOIN users u ON u.id = c.mentor_id
    LEFT JOIN course_enrollments ce ON ce.course_id = c.id
    WHERE c.status = 'published'
    GROUP BY c.id, c.title, u.profile, c.ratings, c.created_at
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get mentor performance summary
CREATE OR REPLACE FUNCTION get_mentor_performance_summary()
RETURNS TABLE(
    mentor_id UUID,
    mentor_name TEXT,
    total_courses BIGINT,
    published_courses BIGINT,
    total_students BIGINT,
    total_revenue NUMERIC,
    avg_course_rating NUMERIC,
    avg_completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as mentor_id,
        COALESCE(u.profile->>'firstName', '') || ' ' || COALESCE(u.profile->>'lastName', '') as mentor_name,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_courses,
        COUNT(DISTINCT ce.student_id) as total_students,
        COALESCE(SUM(ce.amount_paid), 0) as total_revenue,
        AVG(COALESCE((c.ratings->>'average')::NUMERIC, 0)) as avg_course_rating,
        AVG(
            CASE 
                WHEN COUNT(DISTINCT ce2.id) > 0 
                THEN (COUNT(CASE WHEN ce2.completed_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(DISTINCT ce2.id)::NUMERIC) * 100
                ELSE 0
            END
        ) as avg_completion_rate
    FROM users u
    LEFT JOIN courses c ON c.mentor_id = u.id
    LEFT JOIN course_enrollments ce ON ce.course_id = c.id
    LEFT JOIN course_enrollments ce2 ON ce2.course_id = c.id
    WHERE u.role = 'mentor'
    GROUP BY u.id, u.profile
    HAVING COUNT(DISTINCT c.id) > 0
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_users'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT, NOW()
    FROM users
    UNION ALL
    SELECT 'active_users_30d'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT, NOW()
    FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT 'total_courses'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT, NOW()
    FROM courses
    UNION ALL
    SELECT 'published_courses'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT, NOW()
    FROM courses WHERE status = 'published'
    UNION ALL
    SELECT 'total_enrollments'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT, NOW()
    FROM course_enrollments
    UNION ALL
    SELECT 'total_revenue'::TEXT, COALESCE(SUM(amount_paid), 0), 'currency'::TEXT, NOW()
    FROM course_enrollments
    UNION ALL
    SELECT 'avg_course_rating'::TEXT, 
           AVG(COALESCE((ratings->>'average')::NUMERIC, 0)), 'rating'::TEXT, NOW()
    FROM courses WHERE status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_enrollment_trend(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_revenue_by_month(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_ambassador_performance() TO service_role;
GRANT EXECUTE ON FUNCTION get_ambassador_monthly_metrics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_avg_time_to_hire() TO service_role;
GRANT EXECUTE ON FUNCTION get_monthly_placement_metrics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_course_performance_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION get_mentor_performance_summary() TO service_role;
GRANT EXECUTE ON FUNCTION get_system_health_metrics() TO service_role;