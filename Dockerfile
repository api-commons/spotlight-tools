# Node 16 reached end of life in September 2023. Shipping a "maintained, openly-governed
# build" on an end-of-life base image is the first thing a security-minded adopter checks,
# and it was wrong for two years.
#
# Note what this base image is and is not doing: the entrypoint is a self-contained
# binary, so the Node runtime in this image is not what executes `spectral`. The base is
# here for a current Alpine userland — its libc, its OpenSSL, and its package feed for
# curl and jq. That is why moving it is low risk, and it is also why it was easy to leave
# rotting.
FROM node:22-alpine

WORKDIR /usr/src/spectral

COPY scripts/install.sh /usr/src/spectral/
COPY packages/cli/package.json /usr/src/spectral/
COPY packages/cli/package.json /usr/local/lib/package.json
RUN apk --no-cache add curl jq
RUN ./install.sh $(cat package.json | jq -r '.version') \
  && rm ./install.sh && rm ./package.json
ENV NODE_ENV production

ENTRYPOINT ["spectral"]
