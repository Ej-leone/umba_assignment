import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getRates } from './util/ratesapi';
import { InjectRedis } from '@nestjs-redis/kit';
import { RedisClientType } from 'redis';

const ALL_PAIRS = [
  { USD: ['KES', 'NGN', 'EUR'] },
  { EUR: ['USD', 'KES', 'NGN'] },
  { KES: ['USD', 'NGN', 'EUR'] },
  { NGN: ['USD', 'KES', 'EUR'] },
];

@Injectable()
export class RatesService {
  constructor(@InjectRedis() private readonly redis: RedisClientType) {}
  private readonly logger = new Logger(RatesService.name);

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleRefreshRates() {
    this.logger.debug('Called every 10 seconds');

    for (const pair of ALL_PAIRS) {
      const base = Object.keys(pair)[0];
      const symbols = Object.values(pair)[0];

      try {
        const ratesResponse = await getRates(base, symbols);
        for (const currency of Object.keys(ratesResponse.rates)) {
          const rate = ratesResponse.rates[currency];
          const base = ratesResponse.base;
          const timestamp = ratesResponse.timestamp;

          this.logger.debug(
            `updating rate for ${base}/${currency} with rate ${rate} and timestamp ${timestamp}`,
          );
          // Create base key
          const keyBase = `rate:${base}/${currency}`;

          // Store rate and timestamp separatelyy
          await this.redis.set(`${keyBase}:rate`, rate);
          await this.redis.set(`${keyBase}:timestamp`, timestamp);
        }
      } catch (error) {
        // remove rates to invalidate stale rates
        symbols.map(async (symbol:string) => {
          const keyBase = `rate:${base}/${symbol}`;
          await this.redis.del(`${keyBase}:rate`);
          await this.redis.del(`${keyBase}:timestamp`);
        });
      }
    }
  }
}
