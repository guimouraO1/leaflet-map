FROM node:21.1.0

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY . .
COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 443