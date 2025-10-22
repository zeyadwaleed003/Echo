import z from 'zod';
import { config } from 'dotenv';

config();

const validatedEnv = z
  .object({
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
      .default('info'),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(0).max(65535),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    EMAIL_FROM: z.string(),

    MT_HOST: z.string().min(1),
    MT_PORT: z.coerce.number(),
    MT_USER: z.string().min(1),
    MT_PASS: z.string().min(1),
  })
  .parse(process.env);

let SMTP_HOST: string,
  SMTP_PORT: number,
  SMTP_USER: string,
  SMTP_PASS: string,
  SOURCE_FOLDER;

if (validatedEnv.NODE_ENV === 'development') {
  SOURCE_FOLDER = 'src';

  SMTP_HOST = validatedEnv.MT_HOST;
  SMTP_PORT = validatedEnv.MT_PORT;
  SMTP_USER = validatedEnv.MT_USER;
  SMTP_PASS = validatedEnv.MT_PASS;
} else {
  SOURCE_FOLDER = 'dist';
}

export type AppConfig = typeof validatedEnv & {
  SOURCE_FOLDER: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
};

export const configuration = (): AppConfig => ({
  ...validatedEnv,
  SOURCE_FOLDER,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
});
