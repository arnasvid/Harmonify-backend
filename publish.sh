#!/bin/bash
docker build -t arnasvid/backend-harmonify --platform linux/amd64 .
docker push arnasvid/backend-harmonify