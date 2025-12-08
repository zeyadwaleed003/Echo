import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { Request, Response } from "express";
import { BaseExceptionFilter } from "@nestjs/core";
import { UploadConfig } from "src/config/upload.config";

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = "Internal server error";

    // TypeORM Query Failed Error
    if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;

      // PostgresQL error codes
      const pgError = exception.driverError;

      if (pgError.code === "23505") {
        // Unique constraint violation
        message = "This record already exists";
      } else if (pgError.code === "23503") {
        // Foreign key violation
        message = "Related record not found";
      } else if (pgError.code === "23502") {
        // Not null violation
        message = "Required field is missing";
      } else if (pgError.code === "22P02") {
        // Invalid text representation
        message = "Invalid data format";
      } else if (pgError.code === "42703") {
        // Undefined column
        message = "Database query error";
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      } else {
        message = "Database operation failed";
      }

      this.logger.error(`Database Error: ${pgError.code} - ${pgError.message}`);
    }

    // Cloudinary Errors
    else if (exception.error?.http_code) {
      const httpCode = exception.error.http_code;

      switch (httpCode) {
        case 400:
          status = HttpStatus.BAD_REQUEST;
          message = "Invalid file format or file is corrupted";
          break;
        case 420:
          status = HttpStatus.TOO_MANY_REQUESTS;
          message = "Upload rate limit exceeded. Please try again later";
          break;
        case 499:
          status = HttpStatus.REQUEST_TIMEOUT;
          message =
            "File upload timed out. Please try again with a smaller file or check your connection";
          break;
        case 500:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = "File upload service is temporarily unavailable";
          break;
        case 503:
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = "File upload service is temporarily unavailable";
          break;
        default:
          status = httpCode || HttpStatus.BAD_REQUEST;
          message = "File upload failed. Please try again";
      }
    }

    // Multer File Upload Errors
    else if (exception.code === "LIMIT_FILE_SIZE") {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = `File size exceeds maximum limit of ${UploadConfig.formatSize(UploadConfig.maxFileSize)}`;
    } else if (
      exception instanceof BadRequestException &&
      (exception.message === "Too many files" ||
        exception.message?.toLowerCase().includes("too many files"))
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = `Maximum number of files exceeded (limit: ${UploadConfig.maxFilesPerPost} files)`;
    } else if (
      exception instanceof BadRequestException &&
      exception.message?.toLowerCase().includes("unexpected field")
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = `Maximum number of files exceeded (limit: ${UploadConfig.maxFilesPerPost} files)`;
    } else if (
      exception instanceof BadRequestException &&
      exception.message?.startsWith("UNSUPPORTED_FILE_TYPE:")
    ) {
      status = HttpStatus.BAD_REQUEST;
      const mimetype = exception.message.split(":")[1];
      const fileExtension = mimetype?.split("/")[1]?.toUpperCase() || "unknown";
      message = `Unsupported file type: ${fileExtension}. Allowed types: JPEG, PNG, GIF images and MP4 videos`;
    }

    // Elasticsearch/Search Errors
    else if (exception.name === "ConnectionError" && exception.meta) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = "Search service is temporarily unavailable";
      this.logger.error(`Elasticsearch Connection Error: ${exception.message}`);
    } else if (
      exception.name === "ResponseError" &&
      exception.meta?.statusCode
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = "Invalid search query";
      this.logger.error(`Elasticsearch Query Error: ${exception.message}`);
    }

    // JWT/Token Errors
    else if (exception.name === "JsonWebTokenError") {
      status = HttpStatus.UNAUTHORIZED;
      message = "Invalid authentication token";
    } else if (exception.name === "TokenExpiredError") {
      status = HttpStatus.UNAUTHORIZED;
      message = "Authentication token has expired";
    }

    // AI/Gemini Errors
    else if (exception.message?.includes("API key")) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "AI service configuration error";
      this.logger.error(`Gemini API Error: ${exception.message}`);
    } else if (
      exception.message?.includes("quota") ||
      exception.message?.includes("rate limit")
    ) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = "AI service rate limit reached. Please try again later";
      this.logger.warn(`Gemini Rate Limit: ${exception.message}`);
    }

    // EntityNotFoundError
    else if (exception.name === "EntityNotFoundError") {
      status = HttpStatus.NOT_FOUND;
      message = "Record not found";
    }

    // HTTP Exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    // Validation Errors
    else if (
      exception.response?.statusCode === 400 &&
      exception.response?.message
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.response.message;
    }
    // other Error instances
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Error: ${exception.stack}`);
    }

    const errorResponse =
      process.env.NODE_ENV === "development"
        ? this.getDevErrorResponse(exception, request, status, message)
        : this.getProdErrorResponse(request, status, message);

    response.status(status).json(errorResponse);
  }

  private getDevErrorResponse(
    exception: any,
    request: Request,
    status: number,
    message: any
  ) {
    return {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === "string" ? message : message.message || message,
      error: exception.name,
      stack: exception.stack,
    };
  }

  private getProdErrorResponse(request: Request, status: number, message: any) {
    return {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === "string" ? message : message.message || message,
    };
  }
}
