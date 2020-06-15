FROM node:12-slim as build
WORKDIR /usr/secret-backup-operator
COPY ./package*.json ./
RUN npm ci
COPY . .

FROM build as test
CMD ["npm", "run", "test"]