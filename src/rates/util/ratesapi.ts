import { ConfigService } from '@nestjs/config';

export async function getRates(base?: string, symbols?: string[]) {
  const configService = new ConfigService();
  const RATES_API_URL = configService.get('RATES_API_URL');
  const RATES_API_KEY = configService.get('RATES_API_KEY');

  try {
    const response = await fetch(
      `${RATES_API_URL}?access_key=${RATES_API_KEY}&base=${base}&symbols=${symbols}`,
    );

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      'Failed to get rates for base ${base} and symbols ${symbols}',
    );
  }
}
