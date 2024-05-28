FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM nginx

WORKDIR /usr/share/nginx/html

COPY . .
COPY ./conf/nginx.conf /etc/nginx/nginx.conf
# COPY ./conf/default.conf /etc/nginx/conf.d/default.conf