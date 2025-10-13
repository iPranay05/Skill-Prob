import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/database';
import { verifyToken } from '../../../../../lib/auth';
import { AppError } from '../../../../../lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    // Only mentors can view attendance details
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Only mentors can view attendance' }, { status: 403 });
    }

    // Verify mentor owns the session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('mentor_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.mentor_id !== decoded.userId) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 403 });
    }

    // Get attendance records with user details
    const { data: attendance, error } = await supabase
      .from('session_attendance')
      .select(`
        *,
        users:student_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch attendance', 500);
    }

    // Calculate attendance statistics
    const totalRegistered = attendance.length;
    const totalJoined = attendance.filter(a => a.status === 'joined' || a.status === 'left' || a.status === 'completed').length;
    const currentlyOnline = attendance.filter(a => a.status === 'joined').length;

    const attendanceData = attendance.map(record => ({
      id: record.id,
      student: {
        id: record.users.id,
        email: record.users.email,
        name: `${record.users.first_name} ${record.users.last_name}`.trim(),
      },
      joinedAt: record.joined_at,
      leftAt: record.left_at,
      durationMinutes: record.duration_minutes,
      status: record.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          totalRegistered,
          totalJoined,
          currentlyOnline,
          attendanceRate: totalRegistered > 0 ? (totalJoined / totalRegistered) * 100 : 0,
        },
        attendance: attendanceData,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}