FROM node:6

MAINTAINER 3846masa <3846masahiro+git@gmail.com>

WORKDIR /usr/src/app
COPY ./package.json /usr/src/app/package.json
RUN npm install
COPY . /usr/src/app

CMD [ "npm", "start" ]
