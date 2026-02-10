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

  app.enableCors();
  await app.listen(process.env.SERVER_PORT || '5000');
  console.log(`Server is running on port ${process.env.SERVER_PORT || '5000'}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
