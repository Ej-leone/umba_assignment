# Database Migrations

This directory contains TypeORM database migrations for the application.

## Migration Files

- `1700000000000-CreateQuotesTable.ts` - Creates the `quotes` table
- `1700000000001-CreateTransactionsTable.ts` - Creates the `transactions` table with foreign key to `quotes`

## Running Migrations

### Run all pending migrations
```bash
npm run migration:run
```

### Revert the last migration
```bash
npm run migration:revert
```

### Show migration status
```bash
npm run migration:show
```

### Generate a new migration (after entity changes)
```bash
npm run migration:generate src/migrations/MigrationName
```

### Create an empty migration file
```bash
npm run migration:create src/migrations/MigrationName
```

## Notes

- Migrations use PostgreSQL's built-in `gen_random_uuid()` for UUID generation (PostgreSQL 13+)
- For older PostgreSQL versions, you may need to enable the `uuid-ossp` extension
- The `synchronize` option in `app.module.ts` is disabled in production to use migrations instead

