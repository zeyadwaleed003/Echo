import { MailerOptions } from '@nestjs-modules/mailer';
import { configuration } from './configuration';

const env = configuration();

const mailerOptions: MailerOptions = {
  transport: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
};

export default mailerOptions;
