import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
          min: Number(process.env.PG_POOL_MIN ?? 2),
          max: Number(process.env.PG_POOL_MAX ?? 10),
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
