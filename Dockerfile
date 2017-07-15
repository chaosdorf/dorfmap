FROM node:8

WORKDIR /project

# install production dependencies only
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn

COPY ./ ./

CMD ["./scripts/_build.sh"]
