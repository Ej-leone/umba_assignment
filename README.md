
## Assumptions 
 1.  one does not need an account to  execute the fx just provide the necessary information
 2. the currency pairs are static .


 ## Architecture 
  scheduer to fetch rates in and update in-memory database (redis)
  use queing step system to run the transactions different steps atomically  for scale 
  store and update transaction in postgres 
  


## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Running with Docker  

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```


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

