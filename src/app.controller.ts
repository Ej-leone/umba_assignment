import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Simple health/hello endpoint' })
  @ApiResponse({ status: 200, description: 'Service is up' })
  getHello(): string {
    return this.appService.getHello();
  }
}
