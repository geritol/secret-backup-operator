FROM node:12-slim AS build
WORKDIR /usr/secret-backup-operator
COPY ./package*.json ./
RUN npm ci
COPY . .

FROM build AS test
CMD ["npm", "run", "test"]

FROM build AS prod
CMD ["npm", "run"]