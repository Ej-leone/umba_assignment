
FROM node:18-alpine As development


WORKDIR /usr/src/app


COPY --chown=node:node package.json yarn.lock ./


RUN yarn install --frozen-lockfile

COPY --chown=node:node . .

USER node



FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./


COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn build


ENV NODE_ENV production


RUN yarn install --production --frozen-lockfile && yarn cache clean

USER node

# PRODUCTION


FROM node:18-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
