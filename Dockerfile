FROM node:0.12.5

MAINTAINER Ville Tainio <tainio.ville@gmail.com>

ADD . git-task

RUN apt-get update && \
    apt-get install -y \
    git

# Install dependencies
RUN cd git-task && npm install

# Run temporary git information for tests.
RUN git config --global user.email "test@localhost"
RUN git config --global user.name "Test User"

# Run tests.
RUN cd git-task && npm test

CMD cd git-task && \
    npm install && \
    bash
