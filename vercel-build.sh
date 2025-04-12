#!/bin/bash

echo "Starting build process..."

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

echo "Creating public/data directory if it doesn't exist..."
mkdir -p public/data

# Build the Next.js application
echo "Building application..."
DISABLE_ESLINT_PLUGIN=true npx next build

echo "Build process completed!"