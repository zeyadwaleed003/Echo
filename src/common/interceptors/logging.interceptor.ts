import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { winstonLogger } from 'src/config/logger.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.logCall(context, next);
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private logCall(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const startTime = Date.now();

    const { method, url, ip, body, query, params } = req;
    const requestId = this.generateRequestId();
    const accountId = req.account?.id || 'Anonymous';
    const userAgent = req.get('user-agent') || 'Unknown'; // What software is being used to access the API

    // Log Requests
    const requestLog ={
      message: 'Incoming Request',
      method,
      url,
      requestId,
      accountId,
      ip,
      userAgent,
      body,
      query: Object.keys(query).length > 0 ? query : undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
    };
    this.logger.log(requestLog);
    winstonLogger.info(requestLog);

    // Log Responses
    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const { statusCode } = res;
          const duration = Date.now() - startTime;

          const responseLog = {
            message: 'Outgoing Response',
            method,
            url,
            requestId,
            accountId,
            statusCode,
            duration: `${duration}ms`,
            data,
          };
          this.logger.log(responseLog);
          winstonLogger.info(responseLog);
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          const errorLog = {
            message: 'Error Response',
            method,
            url,
            requestId,
            accountId,
            ip,
            userAgent,
            statusCode,
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
          };
          this.logger.error(errorLog);
          winstonLogger.error(errorLog);

        },
      })
    );
  }
}
