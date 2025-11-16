import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateQuotesTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quotes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'currency_in',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'currency_out',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'payin_method',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'payout_method',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            default: "CURRENT_TIMESTAMP + INTERVAL '60 seconds'",
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('quotes');
  }
}

