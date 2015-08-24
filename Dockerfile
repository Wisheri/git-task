FROM node:0.12.5

MAINTAINER Ville Tainio <tainio.ville@gmail.com>

ADD . git-task

RUN apt-get update && \
    apt-get install -y \
    git

CMD cd git-task && \
    npm install && \
    bash
