#!/usr/bin/env python3
"""
Test script for daily Fear & Greed Index update
Run this to test the update process locally
"""

import os
import sys
import subprocess
from datetime import datetime

def test_fear_greed_update():
    """Test the Fear & Greed Index update process"""
    print(f"Testing Fear & Greed Index update at {datetime.now()}")
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"Working directory: {os.getcwd()}")
    
    try:
        # Check if required files exist
        required_files = ['fngindex.py', 'fear-greed.csv']
        for file in required_files:
            if not os.path.exists(file):
                print(f"ERROR: Required file {file} not found")
                return False
            print(f"✓ Found {file}")
        
        # Run the fngindex.py script
        print("Running fngindex.py...")
        result = subprocess.run([sys.executable, 'fngindex.py'], 
                              capture_output=True, 
                              text=True, 
                              timeout=300)
        
        print(f"Return code: {result.returncode}")
        
        if result.stdout:
            print("STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("✓ Fear & Greed Index update completed successfully")
            
            # Check if output files were created
            output_files = ['all_fng.pkl', 'all_fng_csv.csv']
            for file in output_files:
                if os.path.exists(file):
                    size = os.path.getsize(file)
                    print(f"✓ Created {file} ({size} bytes)")
                else:
                    print(f"⚠ Warning: {file} not created")
            
            return True
        else:
            print("✗ Fear & Greed Index update failed")
            return False
            
    except subprocess.TimeoutExpired:
        print("✗ Fear & Greed Index update timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"✗ Error running Fear & Greed Index update: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_fear_greed_update()
    sys.exit(0 if success else 1)
