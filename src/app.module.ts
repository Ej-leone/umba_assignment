import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuoteModule } from './quote/quote.module';
import { TransactionModule } from './transaction/transaction.module';
import { RatesModule } from './rates/rates.module';
import { validateEnv } from './env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './quote/quote.entity';
import { Transaction } from './transaction/transaction.entity';
import { RedisModule } from '@nestjs-redis/kit';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    BullModule.forRoot({
      connection: {
        url: 'redis://default:8FjTasFNn20Rm6fR4FzsTVTUY6PdUeXq@redis-10489.c280.us-central1-2.gce.cloud.redislabs.com:10489',
      },
    }),
    RedisModule.forRoot({
      isGlobal: true,
      options: {
        url: 'redis://default:8FjTasFNn20Rm6fR4FzsTVTUY6PdUeXq@redis-10489.c280.us-central1-2.gce.cloud.redislabs.com:10489',
      },
    }),
    BullModule.registerQueue({
      name: 'transactions',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(
        process.env.DATABASE_PORT || process.env.DB_PORT || '5432',
        10,
      ),
      username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'root',
      password:
        process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'test',
      entities: [Quote, Transaction],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
        ca: '-----BEGIN CERTIFICATE-----MIIEUDCCArigAwIBAgIUG47al2uaZ7dLXncFSSDlBJqVsYkwDQYJKoZIhvcNAQEMBQAwQDE+MDwGA1UEAww1OGU1YTI1N2YtZGYxNy00YzU5LWFhNDEtYmNkMGE0NDJkOWY1IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMTE1MjIwOTAwWhcNMzUxMTEzMjIwOTAwWjBAMT4wPAYDVQQDDDU4ZTVhMjU3Zi1kZjE3LTRjNTktYWE0MS1iY2QwYTQ0MmQ5ZjUgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAIHovA4eCSeUfQtCcUrfxj8SJ9h3ujdeucQP1EwKF0XBmWQZQy7K0ngr78S1DZ3gaDspy6RIfuxjQfJF4HwTtQCAEhf7/XMLK1uxBxYIf2mulNkbarGRr8LwAZbiaxsIriuAJxxNtvCqBr2MiYon4fkQkgUfiujFvEjngyN/u+SdR+J+dyUn0ZxM18w/BK2UxP6I8fROXARK3KFGU9/JDfu8rDnc8nZmQfx9xCRvomwHFZ9cunWvHaC2Jc2jG7WSMtK/d9OeNApaEowItQlAaRGh4dDKHfFWAGtoRmbXQViU8hmCecX9RNGBJMKvlasXMINkagdqyIDLUUpFNJSW80OjuN9pnljbsLpWp3ehne2GGC1d1rMohHHlnHe+V/gfNu5SGtwbnp0/cRmGsTwRGz2HdZfVBMuwqNTPHbP/AaoyYOKAQx8aAGyqrf1lxvqYOesRzEGhhjt0iYWpsKrS+Kf+6PLl2ZmeBUxEUyon/RDm6ZfJahMgw4CjvQ/sT6SGGQIDAQABo0IwQDAdBgNVHQ4EFgQUhczSlVF/Za4wtB97L0ZcDgIcJF4wEgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAEjDu6ZHpKYnTjLValSQLuQhFQEUZJ86I0IPbZF2gxby9CLa/HLOxq6lJ01K4fxP1MfnOZ0nZILMZ7fM5ZeQA/Ki1KnPiqBQMaeMsb3m45RPnWVjGVsNpCfMjgz/ht6WBrfxvo8UWgklXin5LmrC4mHjbPXIAhjAAtbOr3wZ/7TXrIJQIkcvRGslhCos9vf2xiiokH+zXCcH0kXgOtoLLb2TPym8NPDrgsS4qDwrbVhNJy3MoKG314YpZIpYWRHZMn3X4wYCrniBbRFEpPtFHKcBoIj4Gfh2qouq60ehgppU/CLYKGwxUiy3wzUFWI3Iw7Q7KHC1UQVJnw3kB8L8kRDCHZaiPYCePA7M3CfSW+ysJ8It9l0i2COLWG33NatNQsUGJRa6adQg/O7u9+ZX9GkG1zseIIl46M9DYPGHlchWlayn0mgJW/Fxd6LwVpzkMlHHdoQATHT0Psvs2ghvPu3dU2nuUfZWDjLB4Y6rupubzff/rc01RtAc2eAFnB4UQw==-----END CERTIFICATE-----',
      },
    }),
    QuoteModule,
    TransactionModule,
    RatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'BULL_QUEUES',
      // expose existing BullMQ queues (currently: "transactions") for Bull Board
      useFactory: (transactionsQueue: Queue) => {
        return [transactionsQueue];
      },
      inject: [getQueueToken('transactions')],
    },
  ],
})
export class AppModule {}
