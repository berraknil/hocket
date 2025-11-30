FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY lerna.json ./
COPY packages ./packages
RUN npm ci
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Copy node_modules but we need to handle workspace symlinks
COPY --from=builder /app/node_modules ./node_modules

# Replace symlinked workspace packages with actual built packages
RUN rm -rf ./node_modules/@flok-editor/server-middleware ./node_modules/@flok-editor/pubsub ./node_modules/@flok-editor/session 2>/dev/null || true
COPY --from=builder /app/packages/server-middleware ./node_modules/@flok-editor/server-middleware
COPY --from=builder /app/packages/pubsub ./node_modules/@flok-editor/pubsub
COPY --from=builder /app/packages/session ./node_modules/@flok-editor/session

# Ensure package.json files are present for workspace packages
# (these are included in the directory copies above, but explicit for verification)
# server-middleware/package.json - copied with directory
# pubsub/package.json - copied with directory

# Copy the built web package files
COPY --from=builder /app/packages/web/dist ./dist
COPY --from=builder /app/packages/web/bin ./bin
COPY --from=builder /app/packages/web/server.js ./
COPY --from=builder /app/packages/web/vite-express.js ./
COPY --from=builder /app/packages/web/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
