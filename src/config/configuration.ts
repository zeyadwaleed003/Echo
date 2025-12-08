import z from 'zod';
import { config } from 'dotenv';

config();

const jwtExpiresInSchema = z
  .string()
  .min(1)
  .regex(/^(\d+)([smhd])$/, {
    message:
      'Must be in format: number followed by s (seconds), m (minutes), h (hours), or d (days). Example: 15m, 7d, 1h',
  });

const urlListSchema = z
  .string()
  .min(1)
  .refine(
    (val) =>
      val
        .split(',')
        .map((url) => url.trim())
        .every((url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        }),
    {
      message: 'ALLOWED_ORIGINS must be a comma-separated list of valid URLs',
    }
  );

const validatedEnv = z
  .object({
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
      .default('info'),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(0).max(65535),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    EMAIL_FROM: z.string().min(1),

    MT_HOST: z.string().min(1),
    MT_PORT: z.coerce.number(),
    MT_USER: z.string().min(1),
    MT_PASS: z.string().min(1),

    VERIFICATION_OTP_EXPIRES_IN: z.coerce.number(),
    PASSWORD_RESET_OTP_EXPIRES_IN: z.coerce.number(),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    ACCESS_TOKEN_SECRET: z.string().min(1),
    ACCESS_TOKEN_EXPIRES_IN: jwtExpiresInSchema,
    REFRESH_TOKEN_SECRET: z.string().min(1),
    REFRESH_TOKEN_EXPIRES_IN: jwtExpiresInSchema,
    PASSWORD_RESET_TOKEN_SECRET: z.string().min(1),
    PASSWORD_RESET_TOKEN_EXPIRES_IN: jwtExpiresInSchema,

    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),

    REACTIVATION_TOKEN_SECRET: z.string().min(1),
    REACTIVATION_TOKEN_EXPIRES_IN: jwtExpiresInSchema,
    SETUP_TOKEN_SECRET: z.string().min(1),
    SETUP_TOKEN_EXPIRES_IN: jwtExpiresInSchema,

    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),

    ELASTICSEARCH_NODE: z.string().min(1),

    ALLOWED_ORIGINS: urlListSchema,

    DEFAULT_CONVERSATION_AVATAR_URL: z.string().min(1).optional(),

    REDIS_HOST: z.string().min(1).optional(),
    REDIS_PORT: z.coerce.number().optional(),
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
