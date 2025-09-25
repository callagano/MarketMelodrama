#!/bin/bash

# Setup Python environment for Vercel deployment
echo "Setting up Python environment for Fear & Greed Index..."

# Navigate to the fear_greed_index directory
cd src/scripts/fear_greed_index

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Python environment setup complete!"
