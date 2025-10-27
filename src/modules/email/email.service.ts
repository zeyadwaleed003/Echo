import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  async sendVerificationEmail(email: string, otp: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - Echo',
        template: './otp-verification',
        context: {
          name,
          otp,
          expiryMinutes: this.configService.get<number>(
            'VERIFICATION_OTP_EXPIRES_IN'
          )!,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Verification email sent successfully to: ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send the OTP email to ${email}: ${err.message}`,
        err.stack
      );
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password - Echo',
        template: './password-reset',
        context: {
          name,
          otp,
          expiryMinutes: this.configService.get<number>(
            'PASSWORD_RESET_OTP_EXPIRES_IN'
          )!,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Password reset email sent successfully to: ${email}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${err.message}`,
        err.stack
      );
      throw new Error('Failed to send password reset email');
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
