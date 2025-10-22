import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOTPEmail(email: string, otp: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - Echo',
        template: './otp-verification',
        context: {
          name,
          otp,
          expiryMinutes: 10,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`OTP email sent successfully to: ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send the OTP email to ${email}: ${err.message}`,
        err.stack
      );
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Echo!',
        template: './welcome',
        context: {
          name,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Welcome email sent successfully to: ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send welcome email to ${email}: ${err.message}`,
        err.stack
      );

      // I am not throwing an error here because it is not critical
    }
  }
}
