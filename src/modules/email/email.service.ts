import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { AppConfig } from 'src/config/configuration';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly i18nNamespace = 'messages.email';

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly i18n: I18nService
  ) {}

  async sendVerificationEmail(email: string, otp: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: this.i18n.t(`${this.i18nNamespace}.verificationSubject`),
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
      throw new Error(this.i18n.t(`${this.i18nNamespace}.verificationFailed`));
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: this.i18n.t(`${this.i18nNamespace}.passwordResetSubject`),
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
      throw new Error(this.i18n.t(`${this.i18nNamespace}.passwordResetFailed`));
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: this.i18n.t(`${this.i18nNamespace}.welcomeSubject`),
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

      // Not throwing an error here because it is not critical
    }
  }
}
