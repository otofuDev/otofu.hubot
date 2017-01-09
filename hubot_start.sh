#!/bin/sh

WRK_DIR=$(cd $(dirname $0) && pwd)
cd ${WRK_DIR}

if [ -f .env ]; then
  source .env
fi

./bin/hubot --adapter slack
