import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';

@ApiTags('Quotes')
@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new FX quote' })
  @ApiBody({ type: CreateQuoteDto })
  @ApiCreatedResponse({
    description: 'Quote created successfully',
    type: QuoteResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or quote could not be created',
  })
  async createQuote(
    @Body() createQuoteDto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    try {
      await this.quoteService.checkRate(
        createQuoteDto.currencyIn,
        createQuoteDto.currencyOut,
      );
      return await this.quoteService.createQuote(createQuoteDto);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create quote');
    }
  }
}
