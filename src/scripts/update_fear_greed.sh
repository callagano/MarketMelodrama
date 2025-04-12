#!/bin/bash

# Change to the script directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "../.venv" ]; then
  source ../.venv/bin/activate
fi

# Run the Python script
python fear_greed.py

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Fear and Greed Index updated successfully at $(date)"
else
  echo "Error updating Fear and Greed Index at $(date)"
  exit 1
fi 