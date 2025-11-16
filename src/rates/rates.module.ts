import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RatesService } from './rates.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RatesService],
})
export class RatesModule {}
