import { QuoteService } from './quote.service';
import Decimal from 'decimal.js';

describe('QuoteService', () => {
  let service: QuoteService;
  let redisMock: { get: jest.Mock };
  let quoteRepositoryMock: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let configServiceMock: { get: jest.Mock };

  beforeEach(async () => {
    quoteRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    redisMock = {
      get: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'PERCENTAGE_FEE') {
          // 2.5% fee
          return '2.5';
        }
        if (key === 'RATE_EXPIRY_TIME') {
          // 10 minutes in ms
          return '600000';
        }
        return undefined;
      }),
    };

    service = new QuoteService(
      // order matches constructor: repository, redis, config
      quoteRepositoryMock as any,
      redisMock as any,
      configServiceMock as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuote', () => {
    it('should calculate convertedAmount and fee correctly', async () => {
      // Arrange
      const amount = 100;
      const rateString = '150.322339';

      // Redis returns rate and timestamp
      redisMock.get
        .mockResolvedValueOnce(rateString) // rate
        .mockResolvedValueOnce('1763323447'); // timestamp (not used in calculation here)

      const createdQuote = {
        id: 'quote-id',
        currencyIn: 'EUR',
        currencyOut: 'KES',
        fee: 0,
        amount,
        payinMethod: 'mobile_money',
        payoutMethod: 'mobile_money',
        expiresAt: new Date(),
      };

      quoteRepositoryMock.create.mockReturnValue(createdQuote);
      quoteRepositoryMock.save.mockResolvedValue(createdQuote);

      const dto: any = {
        currencyIn: 'EUR',
        currencyOut: 'KES',
        amount,
        payinMethod: 'mobile_money',
        payoutMethod: 'mobile_money',
      };

      // Expected calculations (mirror service logic)
      const amountDecimal = new Decimal(amount);
      const rateDecimal = new Decimal(rateString);
      const convertedAmountDecimal = amountDecimal.mul(rateDecimal);
      const feeDecimal = convertedAmountDecimal.mul(new Decimal('2.5').div(100));

      const expectedConvertedAmount = convertedAmountDecimal.toNumber();
      const expectedFee = feeDecimal.toNumber();

      // Act
      const result = await service.createQuote(dto);

      // Assert
      expect(result.convertedAmount).toBeCloseTo(expectedConvertedAmount, 6);
      expect(result.fee).toBeCloseTo(expectedFee, 6);

      expect(quoteRepositoryMock.create).toHaveBeenCalled();
      expect(quoteRepositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('checkRate', () => {
    const NOW_MS = 1_600_000_000_000;
    let nowSpy: jest.SpyInstance<number, []>;

    beforeEach(() => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
    });

    afterEach(() => {
      nowSpy.mockRestore();
    });

    it('should not throw when rate is within expiry window', async () => {
      // rate timestamp 1 second ago
      const timestampSeconds = Math.floor((NOW_MS - 1000) / 1000);

      redisMock.get
        .mockResolvedValueOnce('150.322339') // rate
        .mockResolvedValueOnce(timestampSeconds.toString()); // timestamp

      await expect(service.checkRate('EUR', 'KES')).resolves.toBeUndefined();
    });

    it('should throw "Rate expired" when rate is older than expiry window', async () => {
      // older than RATE_EXPIRY_TIME (600000 ms) by 1 second
      const timestampSeconds = Math.floor(
        (NOW_MS - 600000 - 1000) / 1000,
      );

      redisMock.get
        .mockResolvedValueOnce('150.322339') // rate
        .mockResolvedValueOnce(timestampSeconds.toString()); // timestamp

      await expect(service.checkRate('EUR', 'KES')).rejects.toThrow(
        'Rate expired',
      );
    });

    it('should throw NotFoundException when rate or timestamp is missing', async () => {
      redisMock.get.mockResolvedValueOnce(null); // rate missing

      await expect(service.checkRate('EUR', 'KES')).rejects.toBeInstanceOf(
        Error,
      );
    });
  });
});
