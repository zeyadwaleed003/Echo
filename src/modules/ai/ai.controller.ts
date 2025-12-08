import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { UploadConfig } from "src/config/upload.config";

@Controller("ai")
export class AiController {
  constructor(private aiService: AiService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor(
      "file",
      UploadConfig.maxFilesPerPost,
      UploadConfig.multerOptions
    )
  )
  async classifyContent(
    @Body("content") content: string,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    return await this.aiService.classifyContent(content, files);
  }
}
