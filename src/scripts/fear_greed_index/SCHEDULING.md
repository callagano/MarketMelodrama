# Fear & Greed Index Daily Scheduling

This directory contains scripts to automatically update the Fear & Greed Index data once per day.

## Files

- `fngindex.py` - Main script that fetches and processes Fear & Greed data
- `daily_update.py` - Scheduler script that runs fngindex.py daily at 8:00 AM GMT+1
- `test_daily_update.py` - Test script to verify the update process works
- `requirements.txt` - Python dependencies
- `fear-greed.csv` - Historical Fear & Greed data
- `all_fng_csv.csv` - Complete updated dataset

## Scheduling Options

### 1. Vercel Cron Jobs (Production)
The script runs automatically on Vercel:
- **Schedule**: Monday-Friday at 8:00 AM GMT+1 (7:00 AM UTC)
- **Endpoint**: `/api/fear-greed-update`
- **Cron Expression**: `0 7 * * 1-5`

### 2. Local Development
Run the scheduler locally:

```bash
# Install dependencies
pip install -r requirements.txt

# Run the daily scheduler
python daily_update.py

# Or run immediately for testing
python daily_update.py --run-now
```

### 3. Test the Update Process
Test if the update works correctly:

```bash
python test_daily_update.py
```

## API Endpoints

### Manual Trigger
```bash
# Trigger the update manually
curl -X POST https://your-domain.vercel.app/api/fear-greed-update

# Check API status
curl https://your-domain.vercel.app/api/fear-greed-update
```

## Weekend Behavior

- **Weekdays (Mon-Fri)**: Script runs normally and updates data
- **Weekends (Sat-Sun)**: Script skips execution (markets are closed)

## Output Files

After successful execution:
- `all_fng.pkl` - Pickle file with complete dataset
- `all_fng_csv.csv` - CSV file with complete dataset
- `fear_greed_daily.log` - Log file with execution details

## Monitoring

Check the logs to monitor execution:
- **Vercel**: Check function logs in Vercel dashboard
- **Local**: Check `fear_greed_daily.log` file

## Troubleshooting

1. **Dependencies**: Make sure all packages in `requirements.txt` are installed
2. **Permissions**: Ensure the script has write permissions in the directory
3. **Network**: Verify internet connection for API calls
4. **Timeout**: Script has a 5-minute timeout limit

## Integration

The updated data can be used by:
- Fear & Greed charts in the web application
- API endpoints that serve historical data
- Analysis scripts that need current market sentiment data
