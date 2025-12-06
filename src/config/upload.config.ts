import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import multer from "multer";

// Define constants first
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const allowedVideoTypes = ["video/mp4"];
const maxImageSize = 3 * 1024 * 1024; // 3MB
const maxVideoSize = 50 * 1024 * 1024; // 50MB
const maxFileSize = 50 * 1024 * 1024; // Max for any file
const maxFilesPerPost = 4;

export const UploadConfig = {
  // File size limits
  maxImageSize,
  maxVideoSize,
  maxFileSize,

  // File count limits
  maxFilesPerPost,

  // Allowed file types
  allowedImageTypes,
  allowedVideoTypes,

  // Multer options
  multerOptions: {
    fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
      const allowed = [...allowedImageTypes, ...allowedVideoTypes];

      if (!allowed.includes(file.mimetype)) {
        return cb(
          new BadRequestException(`UNSUPPORTED_FILE_TYPE:${file.mimetype}`),
          false
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: maxFileSize,
      files: maxFilesPerPost,
    },
    storage: multer.memoryStorage(),
  } as MulterOptions,

  // check if file is image
  isImage(mimetype: string): boolean {
    return this.allowedImageTypes.includes(mimetype);
  },

  // check if file is video
  isVideo(mimetype: string): boolean {
    return this.allowedVideoTypes.includes(mimetype);
  },

  // Get max size for file type
  getMaxSize(mimetype: string): number {
    if (this.isImage(mimetype)) return this.maxImageSize;
    if (this.isVideo(mimetype)) return this.maxVideoSize;
    return this.maxFileSize;
  },

  // Format size for error messages
  formatSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  },
};
