import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import Helmet from 'helmet';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: true,
    }),
  });

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

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.BACKOFFICE_URL,
    process.env.LANDING_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  await app.listen(process.env.SERVER_PORT || '5000', '0.0.0.0');
  console.log(`Server is running on port ${process.env.SERVER_PORT || '5000'}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
