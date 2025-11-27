import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // https://docs.nestjs.com/techniques/versioning#controller-versions
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw an exception if non-whitelisted properties, can't work without the *whitelist* option is set to true
    })
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false, // Set to true if you want more detailed error structure
    })
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Echo API')
    .setDescription('Echo - Social Media Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs/json',
  });

  app.set('query parser', 'extended');

  // Security stuff
  app.use(helmet());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
