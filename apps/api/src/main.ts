import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import Helmet from 'helmet';
import { AppModule } from './app.module';
import { FileLogger } from './common/logger/file-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(FileLogger);
  app.useLogger(logger);

  app.useGlobalPipes(new ZodValidationPipe());
  app.use(Helmet());
  app.setGlobalPrefix('/api/v1');

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  app.enableCors({
    exposedHeaders: ['Content-Disposition'],
  });
  const port = process.env.SERVER_PORT || '5000';

  await app.listen(port);
  logger.log(`Server is running on port ${port}`, 'Bootstrap');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
