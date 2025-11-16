import { plainToInstance } from 'class-transformer';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsUrl, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_HOST: string;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  RATES_API_KEY: string;

  @IsUrl()
  RATES_API_URL: string;
}

export function validateEnv(config: Record<string, any>) {
  // Normalize variable names: map DB_* to DATABASE_* if DATABASE_* is not set
  const normalizedConfig = {
    ...config,
    DATABASE_HOST: config.DATABASE_HOST || config.DB_HOST,
    DATABASE_PORT: config.DATABASE_PORT || config.DB_PORT,
    DATABASE_USER: config.DATABASE_USER || config.DB_USERNAME,
    DATABASE_PASSWORD: config.DATABASE_PASSWORD || config.DB_PASSWORD,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, normalizedConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Config validation error:\n${errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
