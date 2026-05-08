import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './infra/database/database.module';
import { RedisModule } from './infra/redis/redis.module';
import { CacheModule } from './infra/cache/cache.module';
import { SharedModule } from './shared/shared.module';
import { HealthModule } from './modules/health/health.module';

import { CoreModule } from './modules/core/core.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { EditaisModule } from './modules/editais/editais.module';
import { EmendasOrcModule } from './modules/emendas-orc/emendas-orc.module';
import { DemandasModule } from './modules/demandas/demands.module';

// FIX #2: Guard JWT global
import { JwtAuthGuard } from './infra/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 50 }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      },
    ]),

    DatabaseModule,
    RedisModule,
    CacheModule,
    SharedModule,

    HealthModule,
    CoreModule,
    AnalyticsModule,
    NotificationsModule,
    CommissionsModule,
    IngestionModule,
    EditaisModule,
    EmendasOrcModule,
    AdminModule,
    DemandasModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
