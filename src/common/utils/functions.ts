import { Response } from 'express';
import { APIResponse } from '../types/api.types';
import { compare, hash } from 'bcrypt';

export const parseExpiresInMs = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;

  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * units[unit]!;
};

export const sendResponse = (res: Response, result: APIResponse) => {
  res.status(result.statusCode!).json({
    size: result.size,
    message: result.message,
    data: result.data,
    timestamp: result.timestamp,
    accessToken: result.accessToken,
    passwordResetToken: result.passwordResetToken,
  });
};

export const hashCode = async (code: string) => {
  const saltRounds = 10;
  return await hash(code, saltRounds);
};

export const compareHash = async (code: string, hash: string) => {
  return await compare(code, hash);
};
