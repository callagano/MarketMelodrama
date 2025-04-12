#!/bin/bash

echo "Starting build process..."

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

# Build the Next.js application
echo "Building application..."
DISABLE_ESLINT_PLUGIN=true npx next build

echo "Build process completed!"