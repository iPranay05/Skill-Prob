import { JobApplication, ApplicationStatus } from '../models/Job';
import { JobService } from './jobService';
import { JobNotificationService } from './jobNotificationService';
import { AppError } from './errors';

export interface InterviewSlot {
  id: string;
  start_time: Date;
  end_time: Date;
  is_available: boolean;
  interviewer_id?: string;
  interviewer_name?: string;
}

export interface ScheduleInterviewRequest {
  application_id: string;
  interview_date: Date;
  duration_minutes?: number;
  interview_type?: 'phone' | 'video' | 'in_person';
  location?: string;
  meeting_link?: string;
  interviewer_id?: string;
  notes?: string;
}

export interface InterviewDetails {
  id: string;
  application_id: string;
  scheduled_at: Date;
  duration_minutes: number;
  type: 'phone' | 'video' | 'in_person';
  location?: string;
  meeting_link?: string;
  interviewer_id?: string;
  interviewer_name?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: Date;
  updated_at: Date;
}

export class InterviewSchedulingService {
  // Schedule an interview for a job application
  static async scheduleInterview(request: ScheduleInterviewRequest, scheduledBy: string): Promise<void> {
    try {
      // Get the application details
      const application = await JobService.getJobApplicationById(request.application_id);
      if (!application) {
        throw new AppError('Job application not found', 404);
      }

      // Update application with interview details
      await JobService.updateApplicationStatus(
        request.application_id,
        ApplicationStatus.INTERVIEW_SCHEDULED,
        scheduledBy || 'system',
        request.notes
      );

      // Send notifications
      await JobNotificationService.notifyApplicationStatusChange(
        { ...application, status: ApplicationStatus.INTERVIEW_SCHEDULED as any, interview_scheduled_at: request.interview_date } as any,
        { id: application.job_posting_id } as any,
        { id: application.applicant_id } as any,
        { name: 'Company' } as any
      );

      // Schedule reminder notifications
      await this.scheduleInterviewReminders(request.application_id, request.interview_date);

    } catch (error: any) {
      throw new AppError(`Failed to schedule interview: ${error.message}`, 500);
    }
  }

  // Reschedule an existing interview
  static async rescheduleInterview(
    applicationId: string,
    newInterviewDate: Date,
    reason?: string,
    rescheduledBy?: string
  ): Promise<void> {
    try {
      const application = await JobService.getJobApplicationById(applicationId);
      if (!application) {
        throw new AppError('Job application not found', 404);
      }

      if (!application.interview_scheduled_at) {
        throw new AppError('No interview scheduled for this application', 400);
      }

      // Update application with new interview date
      await JobService.updateApplicationStatus(
        applicationId,
        ApplicationStatus.INTERVIEW_SCHEDULED,
        rescheduledBy || 'system',
        reason ? `Rescheduled: ${reason}` : 'Interview rescheduled'
      );

      // Send reschedule notification
      await this.sendRescheduleNotification(application, newInterviewDate, reason);

      // Schedule new reminder notifications
      await this.scheduleInterviewReminders(applicationId, newInterviewDate);

    } catch (error: any) {
      throw new AppError(`Failed to reschedule interview: ${error.message}`, 500);
    }
  }

  // Cancel an interview
  static async cancelInterview(
    applicationId: string,
    reason?: string,
    cancelledBy?: string
  ): Promise<void> {
    try {
      const application = await JobService.getJobApplicationById(applicationId);
      if (!application) {
        throw new AppError('Job application not found', 404);
      }

      // Update application status back to reviewed or shortlisted
      await JobService.updateApplicationStatus(
        applicationId,
        ApplicationStatus.REVIEWED,
        cancelledBy || 'system',
        reason ? `Interview cancelled: ${reason}` : 'Interview cancelled'
      );

      // Send cancellation notification
      await this.sendCancellationNotification(application, reason);

    } catch (error: any) {
      throw new AppError(`Failed to cancel interview: ${error.message}`, 500);
    }
  }

  // Get available interview slots for an employer
  static async getAvailableSlots(
    employerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InterviewSlot[]> {
    try {
      // This is a simplified implementation
      // In a real system, you would integrate with calendar systems like Google Calendar, Outlook, etc.

      const slots: InterviewSlot[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          // Generate slots from 9 AM to 5 PM
          for (let hour = 9; hour < 17; hour++) {
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, 0, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setHours(hour + 1, 0, 0, 0);

            // Check if slot is in the future
            if (slotStart > new Date()) {
              slots.push({
                id: `${employerId}-${slotStart.getTime()}`,
                start_time: slotStart,
                end_time: slotEnd,
                is_available: true, // In real implementation, check against existing interviews
                interviewer_id: employerId
              });
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return slots;
    } catch (error: any) {
      throw new AppError(`Failed to get available slots: ${error.message}`, 500);
    }
  }

  // Bulk schedule interviews for multiple applications
  static async bulkScheduleInterviews(
    requests: ScheduleInterviewRequest[],
    scheduledBy: string
  ): Promise<{ successful: string[]; failed: { applicationId: string; error: string }[] }> {
    const successful: string[] = [];
    const failed: { applicationId: string; error: string }[] = [];

    for (const request of requests) {
      try {
        await this.scheduleInterview(request, scheduledBy);
        successful.push(request.application_id);
      } catch (error: any) {
        failed.push({
          applicationId: request.application_id,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }

  // Get interview statistics for an employer
  static async getInterviewStats(employerId: string): Promise<{
    total_scheduled: number;
    upcoming_interviews: number;
    completed_interviews: number;
    cancelled_interviews: number;
    this_week_interviews: number;
  }> {
    try {
      // This would typically query a dedicated interviews table
      // For now, we'll use the job applications table

      const applications = await JobService.getEmployerApplications(employerId);

      const scheduledApplications = applications.filter((app: any) =>
        app.status === ApplicationStatus.INTERVIEW_SCHEDULED && app.interview_scheduled_at
      );

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const upcomingInterviews = scheduledApplications.filter((app: any) =>
        new Date(app.interview_scheduled_at!) > now
      );

      const thisWeekInterviews = scheduledApplications.filter((app: any) => {
        const interviewDate = new Date(app.interview_scheduled_at!);
        return interviewDate >= weekStart && interviewDate < weekEnd;
      });

      return {
        total_scheduled: scheduledApplications.length,
        upcoming_interviews: upcomingInterviews.length,
        completed_interviews: 0, // Would need additional tracking
        cancelled_interviews: 0, // Would need additional tracking
        this_week_interviews: thisWeekInterviews.length
      };
    } catch (error: any) {
      throw new AppError(`Failed to get interview stats: ${error.message}`, 500);
    }
  }

  // Private helper methods
  private static async scheduleInterviewReminders(
    applicationId: string,
    interviewDate: Date
  ): Promise<void> {
    try {
      // Schedule reminder 24 hours before interview
      const reminderDate = new Date(interviewDate);
      reminderDate.setHours(reminderDate.getHours() - 24);

      if (reminderDate > new Date()) {
        // In a real implementation, you would use a job queue like Bull or Agenda
        // For now, we'll just log the reminder scheduling
        console.log(`Interview reminder scheduled for ${reminderDate} for application ${applicationId}`);

        // You could implement this with a cron job or background task processor
        // setTimeout(() => {
        //   this.sendInterviewReminder(applicationId);
        // }, reminderDate.getTime() - Date.now());
      }
    } catch (error) {
      console.error('Error scheduling interview reminders:', error);
    }
  }

  private static async sendRescheduleNotification(
    application: any,
    newInterviewDate: Date,
    reason?: string
  ): Promise<void> {
    try {
      // Send email notification about reschedule
      const subject = `Interview Rescheduled - ${application.job_posting.title}`;
      const template = `
        <h2>Interview Rescheduled</h2>
        <p>Dear ${application.applicant.profile?.firstName || application.applicant.email},</p>
        <p>Your interview for the <strong>${application.job_posting.title}</strong> position at <strong>${application.job_posting.company.name}</strong> has been rescheduled.</p>
        <p><strong>New Interview Details:</strong></p>
        <ul>
          <li>Date & Time: ${newInterviewDate.toLocaleString()}</li>
          <li>Position: ${application.job_posting.title}</li>
          <li>Company: ${application.job_posting.company.name}</li>
        </ul>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please confirm your availability for the new time slot.</p>
        <p>We apologize for any inconvenience caused.</p>
        <p>Best regards,<br>${application.job_posting.company.name} Team</p>
      `;

      // In a real implementation, you would use the NotificationService
      console.log('Reschedule notification would be sent:', { subject, to: application.applicant.email });
    } catch (error) {
      console.error('Error sending reschedule notification:', error);
    }
  }

  private static async sendCancellationNotification(
    application: any,
    reason?: string
  ): Promise<void> {
    try {
      // Send email notification about cancellation
      const subject = `Interview Cancelled - ${application.job_posting.title}`;
      const template = `
        <h2>Interview Cancelled</h2>
        <p>Dear ${application.applicant.profile?.firstName || application.applicant.email},</p>
        <p>We regret to inform you that your interview for the <strong>${application.job_posting.title}</strong> position at <strong>${application.job_posting.company.name}</strong> has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>We will be in touch if we need to reschedule or if there are any updates regarding your application.</p>
        <p>Thank you for your understanding.</p>
        <p>Best regards,<br>${application.job_posting.company.name} Team</p>
      `;

      // In a real implementation, you would use the NotificationService
      console.log('Cancellation notification would be sent:', { subject, to: application.applicant.email });
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
    }
  }
}