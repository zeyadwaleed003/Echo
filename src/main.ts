import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  Logger,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('ValidationPipe');

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // https://docs.nestjs.com/techniques/versioning#controller-versions
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true, // Extra warning messages in console
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw an exception if non-whitelisted properties, can't work without the *whitelist* option is set to true

      // Need this for better logging
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
        }));

        logger.error('Validation failed:', JSON.stringify(messages));
        return new BadRequestException(
          errors.map((e) => Object.values(e.constraints || {}).join(', '))
        );
      },
    })
  );

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
