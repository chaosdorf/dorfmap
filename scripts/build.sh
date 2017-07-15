#!/bin/bash -e

project_name=${PWD##*/}
build_image="chaosdorf/${project_name}-build:latest"
reports_dir=${PWD}/reports

# build image with everything the tests need
docker build --tag $build_image \
  --build-arg COVERAGE=true \
  --file Dockerfile .

mkdir -p $reports_dir

# run the test and build project in the build container
# build: will contain the test results
# assets: will contain the built client files
docker run --rm \
  --name=${project_name}-build-`date +%Y%m%d_%H%M%S` \
  --volume $reports_dir:/project/reports \
  --env ENVIRONMENT=$project_env \
  --env COVERAGE=true \
  ${build_image}
