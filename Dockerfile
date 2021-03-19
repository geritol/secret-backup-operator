FROM node:12-slim AS build
WORKDIR /usr/secret-backup-operator

RUN apt update && \
    apt upgrade -y && \
    apt-get clean && \
    rm -r /var/lib/apt/lists/*

COPY ./package*.json ./
RUN npm ci
COPY . .

FROM build AS test
CMD ["npm", "run", "test"]

FROM build AS prod
USER 65534
CMD ["npm", "start"]
