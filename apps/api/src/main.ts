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

  // Confia no reverse proxy (Render/Cloudflare) para rate-limiting por IP real e desativa X-Powered-By
  const httpAdapter = app.getHttpAdapter().getInstance();
  if (httpAdapter && typeof httpAdapter.set === 'function') {
    httpAdapter.set('trust proxy', 1);
    httpAdapter.disable('x-powered-by');
  }

  // Headers de segurança HTTP
  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Luizianne Leis — Core API')
      .setDescription('Plataforma de transparência e inteligência legislativa')
      .setVersion('0.2.0')
      .addBearerAuth()
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
