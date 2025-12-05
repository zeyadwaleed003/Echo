import {
  ArgumentMetadata,
  BadRequestException,
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

// Validate the group conversation avatar picture
// The picture size can't be more than 3 MB and it must be an image
@Injectable()
export class AvatarFilePipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const parseFilePipe = new ParseFilePipe({
      fileIsRequired: false,
      validators: [
        new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }), // 3 MB
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }), // The file must be an image
      ],
    });

    try {
      return await parseFilePipe.transform(value);
    } catch (error: any) {
      const msg = error.message.includes('File too large')
        ? this.i18n.t('validation.conversations.avatar.size')
        : this.i18n.t('validation.conversations.avatar.type');

      throw new BadRequestException(msg);
    }
  }
}
