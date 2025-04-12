#!/bin/bash
# Install Python
curl -sSf https://download.python.org/3.9.0/Python-3.9.0.tgz -o python.tgz
tar -xzf python.tgz
cd Python-3.9.0
./configure --prefix=$VERCEL_BUILD_DIR/python
make
make install
cd ..

# Install pip
curl -sSf https://bootstrap.pypa.io/get-pip.py -o get-pip.py
$VERCEL_BUILD_DIR/python/bin/python3 get-pip.py

# Install required Python packages
$VERCEL_BUILD_DIR/python/bin/pip install pandas numpy matplotlib requests

# Run the Next.js build
npm run build 