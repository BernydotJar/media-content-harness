FROM node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Host verifies the immutable Git archive and its signed exact-SHA review.
# The workspace verification wrapper requires Git; the release archive excludes .git.
RUN node node_modules/next/dist/bin/next build && node scripts/prepare-runtime.mjs /app/runtime

FROM node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 git ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
RUN git init /opt/graph-harness && git -C /opt/graph-harness remote add origin https://github.com/BernydotJar/Graph-harness-sdlc.git && git -C /opt/graph-harness fetch --depth 1 origin 477bdcc3d390c30eb49d823e5c7fd105fee2cc4d && git -C /opt/graph-harness checkout --detach FETCH_HEAD && git config --system --add safe.directory /opt/graph-harness
WORKDIR /app
COPY --from=build --chown=node:node /app/runtime ./
RUN mkdir -p /app/data && chown node:node /app/data && chmod 700 /app/data
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 GRAPH_HARNESS_RUNTIME_ROOT=/opt/graph-harness MEDIA_FACTORY_DATA_ROOT=/app/data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
