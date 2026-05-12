import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // FIX #25: CORS não permite '*' por padrão — exige CORS_ORIGINS explícito em produção
  const isProduction = process.env.NODE_ENV === 'production';
  let corsOrigin: boolean | string[];
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    if (isProduction) {
      Logger.warn('CORS_ORIGINS not set in production — defaulting to restrictive. Set CORS_ORIGINS env var.', 'Bootstrap');
      corsOrigin = false;
    } else {
      corsOrigin = true; // dev: allow all
    }
  } else {
    corsOrigin = allowedOrigins;
  }

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      // FIX #11 (ALTO): Rejeita propriedades não previstas no DTO
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Luizianne Leis — Core API')
      .setDescription('Plataforma de transparência legislativa')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-token', description: 'Token de administrador (ADMIN_TOKEN)' }, 'x-admin-token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    Logger.log('Swagger at /docs', 'Bootstrap');
  }

  const port = Number(process.env.PORT ?? 8000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API ready on :${port}`, 'Bootstrap');
}

bootstrap();
