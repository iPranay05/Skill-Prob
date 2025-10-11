import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Increment view count
    await StudentLearningService.incrementForumViews(params.postId);

    const replies = await StudentLearningService.getForumReplies(params.postId);

    return NextResponse.json({
      success: true,
      data: { replies }
    });
  } catch (error) {
    console.error('Error fetching forum replies:', error);
    
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

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const replyData = await request.json();

    if (!replyData.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const reply = await StudentLearningService.createForumReply({
      forum_post_id: params.postId,
      author_id: decoded.userId,
      is_solution: false,
      ...replyData
    });

    return NextResponse.json({
      success: true,
      data: { reply }
    });
  } catch (error) {
    console.error('Error creating forum reply:', error);
    
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