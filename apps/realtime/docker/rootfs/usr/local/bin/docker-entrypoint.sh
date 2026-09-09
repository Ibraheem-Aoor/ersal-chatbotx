#!/bin/bash
cd /app/apps/realtime;
# PartyKit dev reads .env from cwd — write the needed vars there
cat > .env << ENVEOF
REALTIME_BROADCAST_SECRET=${REALTIME_BROADCAST_SECRET}
REALTIME_API_KEY=${REALTIME_API_KEY}
REALTIME_AUTH_URL=${REALTIME_AUTH_URL}
ENVEOF
NODE_OPTIONS=--no-node-snapshot HOSTNAME=${HOSTNAME:-0.0.0.0} PORT=${PORT:-1999} pnpm dlx partykit dev;
