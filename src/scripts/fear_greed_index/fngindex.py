import requests, csv, json, urllib
import pandas as pd
import time
from fake_useragent import UserAgent
from datetime import datetime

BASE_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata/"
START_DATE = '2020-09-19'
END_DATE = datetime.now().strftime('%Y-%m-%d')
ua = UserAgent()

headers = {
   'User-Agent': ua.random,
   }

# Get historical data
r = requests.get(BASE_URL + START_DATE, headers = headers)
historical_data = r.json()

# Get recent data (last 30 days)
recent_date = (datetime.now() - pd.Timedelta(days=30)).strftime('%Y-%m-%d')
r_recent = requests.get(BASE_URL + recent_date, headers = headers)
recent_data = r_recent.json()

# Load existing data
try:
    fng_data = pd.read_csv('fear-greed.csv', usecols=['Date', 'Fear Greed'])
    fng_data['Date'] = pd.to_datetime(fng_data['Date'], format='%Y-%m-%d')
except FileNotFoundError:
    # Create empty dataframe if file doesn't exist
    fng_data = pd.DataFrame(columns=['Date', 'Fear Greed'])
    fng_data['Date'] = pd.to_datetime(fng_data['Date'], format='%Y-%m-%d')

fng_data.set_index('Date', inplace=True)

# Fill missing dates
missing_dates = []
all_dates = (pd.date_range(fng_data.index[0] if not fng_data.empty else START_DATE, END_DATE, freq='D'))
for date in all_dates:
	if date not in fng_data.index:
		missing_dates.append(date)
		fng_data.loc[date] = [0]
fng_data.sort_index(inplace=True)

# Update with historical data
if 'fear_and_greed_historical' in historical_data:
    for data_point in historical_data['fear_and_greed_historical']['data']:
        x = int(data_point['x'])
        x = datetime.fromtimestamp(x / 1000).strftime('%Y-%m-%d')
        y = int(data_point['y'])
        fng_data.at[x, 'Fear Greed'] = y

# Update with recent data
if 'fear_and_greed_historical' in recent_data:
    for data_point in recent_data['fear_and_greed_historical']['data']:
        x = int(data_point['x'])
        x = datetime.fromtimestamp(x / 1000).strftime('%Y-%m-%d')
        y = int(data_point['y'])
        fng_data.at[x, 'Fear Greed'] = y
#currently any days that do not have data points from cnn are filled with zeros, uncomment the following line to backfill
#fng_data['Fear Greed'].replace(to_replace=0, method='bfill')

fng_data.to_pickle('all_fng.pkl')
fng_data.to_csv('all_fng_csv.csv')

