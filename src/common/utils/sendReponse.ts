import { Response } from 'express';
import { APIResponse } from '../types/api.types';

export default function (res: Response, result: APIResponse) {
  res.status(result.statusCode!).json({
    size: result.size,
    message: result.message,
    data: result.data,
    timestamp: result.timestamp,
  });
}
