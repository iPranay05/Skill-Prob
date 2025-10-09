import { NotificationService } from './notifications';
import { JobApplication, JobPosting, ApplicationStatus } from '../models/JobPosting';
import { User } from '../models/User';

export class JobNotificationService {
  // Notification templates for job-related events
  private static getApplicationStatusTemplate(status: ApplicationStatus): {
    subject: string;
    template: string;
  } {
    const templates = {
      [ApplicationStatus.PENDING]: {
        subject: 'Application Received - {{jobTitle}}',
        template: `
          <h2>Application Received</h2>
          <p>Dear {{applicantName}},</p>
          <p>Thank you for applying to the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
          <p>We have received your application and it is currently under review. We will get back to you soon with an update.</p>
          <p>Application Details:</p>
          <ul>
            <li>Position: {{jobTitle}}</li>
            <li>Company: {{companyName}}</li>
            <li>Applied on: {{appliedDate}}</li>
            <li>Application ID: {{applicationId}}</li>
          </ul>
          <p>You can track your application status in your dashboard.</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      },
      [ApplicationStatus.REVIEWED]: {
        subject: 'Application Under Review - {{jobTitle}}',
        template: `
          <h2>Application Under Review</h2>
          <p>Dear {{applicantName}},</p>
          <p>Your application for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong> is now under review.</p>
          <p>Our hiring team is carefully evaluating your qualifications and experience. We will contact you soon with the next steps.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      },
      [ApplicationStatus.SHORTLISTED]: {
        subject: 'Congratulations! You\'ve been shortlisted - {{jobTitle}}',
        template: `
          <h2>Congratulations! You've been shortlisted</h2>
          <p>Dear {{applicantName}},</p>
          <p>Great news! You have been shortlisted for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
          <p>We were impressed with your application and would like to move forward with the next stage of our hiring process.</p>
          <p>We will be in touch soon to schedule the next steps, which may include:</p>
          <ul>
            <li>Phone/video screening</li>
            <li>Technical assessment</li>
            <li>Interview with the hiring manager</li>
          </ul>
          <p>Please keep an eye on your email and phone for further communication.</p>
          <p>Congratulations again!</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      },
      [ApplicationStatus.INTERVIEW_SCHEDULED]: {
        subject: 'Interview Scheduled - {{jobTitle}}',
        template: `
          <h2>Interview Scheduled</h2>
          <p>Dear {{applicantName}},</p>
          <p>We are pleased to invite you for an interview for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
          <p><strong>Interview Details:</strong></p>
          <ul>
            <li>Date & Time: {{interviewDateTime}}</li>
            <li>Duration: Approximately 1 hour</li>
            <li>Format: {{interviewFormat}}</li>
            {{#if interviewLocation}}<li>Location: {{interviewLocation}}</li>{{/if}}
            {{#if interviewLink}}<li>Meeting Link: {{interviewLink}}</li>{{/if}}
          </ul>
          <p><strong>What to expect:</strong></p>
          <ul>
            <li>Discussion about your background and experience</li>
            <li>Questions about the role and company</li>
            <li>Opportunity for you to ask questions</li>
          </ul>
          <p>Please confirm your attendance by replying to this email.</p>
          <p>If you need to reschedule, please let us know as soon as possible.</p>
          <p>We look forward to meeting you!</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      },
      [ApplicationStatus.REJECTED]: {
        subject: 'Application Update - {{jobTitle}}',
        template: `
          <h2>Application Update</h2>
          <p>Dear {{applicantName}},</p>
          <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong> and for taking the time to apply.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
          <p>This decision was not easy, as we received many qualified applications. We encourage you to apply for future opportunities that match your skills and interests.</p>
          <p>We wish you the best of luck in your job search.</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      },
      [ApplicationStatus.HIRED]: {
        subject: 'Congratulations! Job Offer - {{jobTitle}}',
        template: `
          <h2>Congratulations! You've been selected</h2>
          <p>Dear {{applicantName}},</p>
          <p>Congratulations! We are delighted to offer you the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong>.</p>
          <p>We were impressed with your qualifications, experience, and the enthusiasm you demonstrated throughout the interview process.</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Our HR team will contact you within 24-48 hours with the formal offer letter</li>
            <li>The offer letter will include detailed information about compensation, benefits, and start date</li>
            <li>Please review the offer carefully and let us know if you have any questions</li>
          </ul>
          <p>We are excited about the possibility of you joining our team and look forward to your response.</p>
          <p>Welcome to {{companyName}}!</p>
          <p>Best regards,<br>{{companyName}} Team</p>
        `
      }
    };

    return templates[status];
  }

  // Send notification when application status changes
  static async notifyApplicationStatusChange(
    application: JobApplication,
    jobPosting: JobPosting,
    applicant: User,
    company: { name: string },
    previousStatus?: ApplicationStatus
  ): Promise<void> {
    try {
      const template = this.getApplicationStatusTemplate(application.status);
      
      const templateData = {
        applicantName: `${applicant.profile?.firstName || ''} ${applicant.profile?.lastName || ''}`.trim() || applicant.email,
        jobTitle: jobPosting.title,
        companyName: company.name,
        appliedDate: new Date(application.applied_at).toLocaleDateString(),
        applicationId: application.id,
        interviewDateTime: application.interview_scheduled_at 
          ? new Date(application.interview_scheduled_at).toLocaleString()
          : '',
        interviewFormat: 'Video Call', // Default format
        interviewLocation: '', // Can be customized based on job posting
        interviewLink: '' // Can be added when scheduling
      };

      // Send email notification
      await NotificationService.sendEmail({
        to: applicant.email,
        subject: this.interpolateTemplate(template.subject, templateData),
        html: this.interpolateTemplate(template.template, templateData),
        category: 'job_application'
      });

      // Send SMS for critical status changes
      if ([ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.HIRED].includes(application.status)) {
        const smsMessage = this.getSMSMessage(application.status, jobPosting.title, company.name);
        
        if (applicant.phone) {
          await NotificationService.sendSMS({
            to: applicant.phone,
            message: smsMessage
          });
        }
      }

      // Create in-app notification
      await NotificationService.createInAppNotification({
        userId: applicant.id!,
        title: this.interpolateTemplate(template.subject, templateData),
        message: this.getInAppMessage(application.status, jobPosting.title, company.name),
        type: 'job_application',
        data: {
          applicationId: application.id,
          jobPostingId: jobPosting.id,
          status: application.status
        }
      });

    } catch (error) {
      console.error('Error sending application status notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Send notification to employer when new application is received
  static async notifyEmployerNewApplication(
    application: JobApplication,
    jobPosting: JobPosting,
    applicant: User,
    employer: User
  ): Promise<void> {
    try {
      const subject = `New Application Received - ${jobPosting.title}`;
      const template = `
        <h2>New Application Received</h2>
        <p>Dear Hiring Manager,</p>
        <p>You have received a new application for the <strong>${jobPosting.title}</strong> position.</p>
        <p><strong>Applicant Details:</strong></p>
        <ul>
          <li>Name: ${applicant.profile?.firstName || ''} ${applicant.profile?.lastName || ''}</li>
          <li>Email: ${applicant.email}</li>
          <li>Applied on: ${new Date(application.applied_at).toLocaleDateString()}</li>
        </ul>
        <p>You can review the application and candidate details in your employer dashboard.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/applications/${application.id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Application</a></p>
        <p>Best regards,<br>Skill Probe Team</p>
      `;

      // Send email notification
      await NotificationService.sendEmail({
        to: employer.email,
        subject,
        html: template,
        category: 'new_application'
      });

      // Create in-app notification
      await NotificationService.createInAppNotification({
        userId: employer.id!,
        title: subject,
        message: `New application from ${applicant.profile?.firstName || applicant.email} for ${jobPosting.title}`,
        type: 'new_application',
        data: {
          applicationId: application.id,
          jobPostingId: jobPosting.id,
          applicantId: applicant.id
        }
      });

    } catch (error) {
      console.error('Error sending new application notification:', error);
    }
  }

  // Send bulk notification for application status updates
  static async notifyBulkApplicationUpdate(
    applications: JobApplication[],
    newStatus: ApplicationStatus,
    jobPosting: JobPosting,
    company: { name: string }
  ): Promise<void> {
    try {
      // Process notifications in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < applications.length; i += batchSize) {
        const batch = applications.slice(i, i + batchSize);
        
        const promises = batch.map(async (application) => {
          // Note: In a real implementation, you would fetch the applicant details
          // For now, we'll create a minimal notification
          await NotificationService.createInAppNotification({
            userId: application.applicant_id,
            title: `Application Status Updated - ${jobPosting.title}`,
            message: `Your application status has been updated to: ${newStatus.replace('_', ' ')}`,
            type: 'job_application',
            data: {
              applicationId: application.id,
              jobPostingId: jobPosting.id,
              status: newStatus
            }
          });
        });

        await Promise.all(promises);
        
        // Small delay between batches
        if (i + batchSize < applications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error sending bulk application notifications:', error);
    }
  }

  // Send interview reminder notifications
  static async sendInterviewReminder(
    application: JobApplication,
    jobPosting: JobPosting,
    applicant: User,
    company: { name: string },
    hoursBeforeInterview: number = 24
  ): Promise<void> {
    try {
      if (!application.interview_scheduled_at) return;

      const interviewDate = new Date(application.interview_scheduled_at);
      const subject = `Interview Reminder - ${jobPosting.title}`;
      const template = `
        <h2>Interview Reminder</h2>
        <p>Dear ${applicant.profile?.firstName || applicant.email},</p>
        <p>This is a friendly reminder about your upcoming interview for the <strong>${jobPosting.title}</strong> position at <strong>${company.name}</strong>.</p>
        <p><strong>Interview Details:</strong></p>
        <ul>
          <li>Date & Time: ${interviewDate.toLocaleString()}</li>
          <li>Position: ${jobPosting.title}</li>
          <li>Company: ${company.name}</li>
        </ul>
        <p>Please make sure to:</p>
        <ul>
          <li>Join the meeting 5-10 minutes early</li>
          <li>Test your audio and video beforehand</li>
          <li>Have your resume and any relevant documents ready</li>
          <li>Prepare questions about the role and company</li>
        </ul>
        <p>If you need to reschedule or have any questions, please contact us immediately.</p>
        <p>Good luck with your interview!</p>
        <p>Best regards,<br>${company.name} Team</p>
      `;

      // Send email reminder
      await NotificationService.sendEmail({
        to: applicant.email,
        subject,
        html: template,
        category: 'interview_reminder'
      });

      // Send SMS reminder if phone is available
      if (applicant.phone) {
        const smsMessage = `Interview reminder: ${jobPosting.title} at ${company.name} on ${interviewDate.toLocaleString()}. Good luck!`;
        await NotificationService.sendSMS({
          to: applicant.phone,
          message: smsMessage
        });
      }

    } catch (error) {
      console.error('Error sending interview reminder:', error);
    }
  }

  // Helper methods
  private static interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private static getSMSMessage(status: ApplicationStatus, jobTitle: string, companyName: string): string {
    const messages = {
      [ApplicationStatus.SHORTLISTED]: `Great news! You've been shortlisted for ${jobTitle} at ${companyName}. Check your email for details.`,
      [ApplicationStatus.INTERVIEW_SCHEDULED]: `Interview scheduled for ${jobTitle} at ${companyName}. Check your email for details.`,
      [ApplicationStatus.HIRED]: `Congratulations! You've been selected for ${jobTitle} at ${companyName}. Check your email for next steps.`,
      [ApplicationStatus.PENDING]: `Application received for ${jobTitle} at ${companyName}. We'll be in touch soon.`,
      [ApplicationStatus.REVIEWED]: `Your application for ${jobTitle} at ${companyName} is under review.`,
      [ApplicationStatus.REJECTED]: `Thank you for applying to ${jobTitle} at ${companyName}. Check your email for details.`
    };

    return messages[status] || `Application status updated for ${jobTitle} at ${companyName}.`;
  }

  private static getInAppMessage(status: ApplicationStatus, jobTitle: string, companyName: string): string {
    const messages = {
      [ApplicationStatus.PENDING]: `Your application for ${jobTitle} at ${companyName} has been received and is under review.`,
      [ApplicationStatus.REVIEWED]: `Your application for ${jobTitle} at ${companyName} is being reviewed by the hiring team.`,
      [ApplicationStatus.SHORTLISTED]: `Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}.`,
      [ApplicationStatus.INTERVIEW_SCHEDULED]: `Interview has been scheduled for ${jobTitle} at ${companyName}. Check your email for details.`,
      [ApplicationStatus.REJECTED]: `Your application for ${jobTitle} at ${companyName} was not selected this time.`,
      [ApplicationStatus.HIRED]: `Congratulations! You've been selected for ${jobTitle} at ${companyName}.`
    };

    return messages[status] || `Your application status has been updated.`;
  }
}