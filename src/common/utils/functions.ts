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
  });
};

export const hashPassword = async (password: string) => {
  const hashed = await hash(password, 10);
  return hashed;
};

export const comparePassword = async (password: string, hashed: string) => {
  return await compare(password, hashed);
};
