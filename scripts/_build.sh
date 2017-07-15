#!/bin/bash -e

yarn test
NODE_ENV=production yarn build
