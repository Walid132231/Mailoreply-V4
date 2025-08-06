#!/bin/bash

echo "🚀 Starting MailoReply AI Application..."

# Build the application
echo "📦 Building frontend..."
yarn build

echo "🔧 Building backend..."
yarn build:server

# Start the backend server (which also serves the frontend)
echo "🚀 Starting server on port 8080..."
PORT=8080 node dist/server/node-build.mjs