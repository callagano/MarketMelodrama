#!/usr/bin/env python3
"""
Daily Fear & Greed Index Update Script
Runs fngindex.py once per day to update Fear & Greed data
"""

import os
import sys
import subprocess
import logging
from datetime import datetime, time
import schedule
import time as time_module

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fear_greed_daily.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_fear_greed_update():
    """Execute the Fear & Greed Index update script"""
    try:
        logging.info("Starting daily Fear & Greed Index update...")
        
        # Change to script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        # Run the fngindex.py script
        result = subprocess.run([sys.executable, 'fngindex.py'], 
                              capture_output=True, 
                              text=True, 
                              timeout=300)  # 5 minute timeout
        
        if result.returncode == 0:
            logging.info("Fear & Greed Index update completed successfully")
            logging.info(f"Output: {result.stdout}")
        else:
            logging.error(f"Fear & Greed Index update failed with return code {result.returncode}")
            logging.error(f"Error: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logging.error("Fear & Greed Index update timed out after 5 minutes")
    except Exception as e:
        logging.error(f"Error running Fear & Greed Index update: {str(e)}")

def schedule_daily_update():
    """Schedule the daily update at 8:00 AM GMT+1"""
    # Schedule for 8:00 AM GMT+1 (7:00 AM UTC)
    schedule.every().day.at("07:00").do(run_fear_greed_update)
    
    logging.info("Daily Fear & Greed Index update scheduled for 8:00 AM GMT+1")
    logging.info("Scheduler started. Press Ctrl+C to stop.")
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time_module.sleep(60)  # Check every minute

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--run-now":
        # Run immediately if --run-now flag is provided
        run_fear_greed_update()
    else:
        # Start the scheduler
        schedule_daily_update()
