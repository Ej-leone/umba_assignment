
## Assumptions 
 1.  one does not need an account to  execute the fx just provide the necessary information
 2. the currency pairs are static .
 3. only two payin and payout methods mobile money and banks 


## if more time

  - added authentication and kyc 
  - added sentry for monitoring 
   - implemented an audit log 



 ## Architecture 
 
<img width="4043" height="1239" alt="Untitled-2025-06-29-1723-2 excalidraw" src="https://github.com/user-attachments/assets/1b85f868-71a8-4e0a-882a-31af0921e9b6" />


## Description

fx nest js backend system . provides quotes and executes  the quotes to mobile money and banks 

## Installation

```bash
$ yarn install
```

## Running the app (locally)

```bash
# development
$ yarn run start

# watch mode (uses .env)
$ yarn run start:dev

# production mode (assumes you've built the app)
$ yarn run start:prod
```

## Running with Docker

This project includes a `docker-compose.yml` that runs:

- api (NestJS app)
- postgres (PostgreSQL database)
- redis (for queues)

```bash
# start all services in the background
$ yarn run dev:docker
# or, directly:
$ docker-compose up -d

# rebuild images and start
$ yarn run dev:docker:rebuild
# or:
$ docker-compose up --build

# stop and remove containers
$ yarn run dev:docker:down
# or:
$ docker-compose down
```

By default, the API will be available at `http://localhost:3000`.

## API Documentation (Swagger)

Swagger is configured and exposed at the `/api-docs` path.

- When running locally (for example with `yarn start:dev`):
  - Open `http://localhost:3000/api-docs`
- When running via Docker (`yarn dev:docker` / `docker-compose up`):
  - Open `http://localhost:3000/api-docs`

From there you can explore the endpoints, view request/response schemas, and execute requests directly from the browser.

## Queue Monitoring (Bull Board)

The application also exposes a Bull Board UI to monitor BullMQ queues at the `/admin/queues` path.

- When running locally (for example with `yarn start:dev`):
  - Open `http://localhost:3000/admin/queues`
- When running via Docker (`yarn dev:docker` / `docker-compose up`):
  - Open `http://localhost:3000/admin/queues`

You can use this UI to see queued, active, failed, and completed jobs and inspect their payloads.


## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov


# Limitations
when executing tests on dev with a free api from exchange rates  they do not allow changing of the base currency
which EUR so for test use payin currency EUR . the rest wont be available


```

