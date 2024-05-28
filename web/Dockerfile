FROM node:latest AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM nginx
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY ./conf/nginx.conf /etc/nginx/nginx.conf
# COPY ./conf/default.conf /etc/nginx/conf.d/default.conf