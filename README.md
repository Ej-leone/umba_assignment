
## Assumptions 
 1.  one does not need an account to  execute the fx just provide the necessary information
 2. the currency pairs are static .


 ## Architecture 
 
<img width="4043" height="1239" alt="Untitled-2025-06-29-1723-2 excalidraw" src="https://github.com/user-attachments/assets/1b85f868-71a8-4e0a-882a-31af0921e9b6" />


## Description

fx nest js backend system . provides quotes and executes  the quotes to mobile money and banks 

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

