import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';

@Injectable()
export class CloudinaryService {
  private cloudinary = cloudinary;
  constructor(private configService: ConfigService<AppConfig, true>) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloudName,
      apiKey,
      apiSecret,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const b64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return await cloudinary.uploader.upload(b64, {
      folder: 'echo',
    });
  }

  async uploadMultipleFiles(files: Express.Multer.File[]) {
    return await Promise.all(files.map((file) => this.uploadFile(file)));
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const urlParts = url.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const fileName = fileNameWithExt!.split('.')[0];

      const publicId = `${folder}/${fileName}`;

      const result = await this.cloudinary.uploader.destroy(publicId);

      if (result.result !== 'ok') {
        console.warn(
          `Failed to delete file from Cloudinary: ${publicId}`,
          result
        );
      }
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }
  }

  async deleteMultipleFiles(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.deleteFile(url)));
  }
}
