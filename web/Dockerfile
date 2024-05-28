FROM node:latest AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM nginx
COPY --from=build /usr/src/app /usr/share/nginx/html