import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import requests
import os
from datetime import datetime, timedelta

API_KEY = 'e42miF33vkeNq9DsB4UZ5270pYg7Tp9W'
base_url = "https://financialmodelingprep.com/api/v3/historical-price-full"

end_date = datetime.now()
start_date = end_date - timedelta(days=1825)  # 5 years

# Local CSV database to limit API calls
def load_or_fetch_data(symbol):
    filename = f"data_{symbol}.csv"
    if os.path.exists(filename):
        print(f"Loading {symbol} from local cache")
        df = pd.read_csv(filename, parse_dates=['date'], index_col='date')
    else:
        print(f"Fetching {symbol} data from API")
        url = f"{base_url}/{symbol}?from={start_date.date()}&to={end_date.date()}&apikey={API_KEY}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            json_data = response.json()
            if 'historical' not in json_data:
                raise ValueError(f"'historical' key not in response for {symbol}: {json_data}")
            df = pd.DataFrame(json_data['historical'])
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            df.sort_index(inplace=True)
            df.to_csv(filename)
        except Exception as e:
            raise RuntimeError(f"Failed to fetch {symbol} from API: {e}")
    return df

spy_df = load_or_fetch_data('SPY')
tlt_df = load_or_fetch_data('TLT')

print("Calculating Market Momentum")
spy_df['momentum'] = spy_df['close'] / spy_df['close'].rolling(window=125, min_periods=1).mean()

print("Calculating Stock Price Strength")
spy_df['high_52w'] = spy_df['close'].rolling(window=252, min_periods=1).max()
spy_df['low_52w'] = spy_df['close'].rolling(window=252, min_periods=1).min()
spy_df['strength'] = (spy_df['close'] - spy_df['low_52w']) / (spy_df['high_52w'] - spy_df['low_52w'])

print("Calculating Safe Haven Demand")
safe_haven = (tlt_df['close'] / spy_df['close']).dropna()
safe_haven_ratio = safe_haven / safe_haven.rolling(window=125, min_periods=1).mean()

print("Normalizing Components")
def normalize(series):
    return 100 * (series - series.min()) / (series.max() - series.min())

components = pd.DataFrame({
    'momentum': normalize(spy_df['momentum']),
    'strength': normalize(spy_df['strength']),
    'safe_haven': 100 - normalize(safe_haven_ratio)
}).dropna()

# Set relative weights (they'll be normalized automatically)
# To adjust influence of a component, increase or decrease its value
weights = {
    'momentum': 1,
    'strength': 1,
    'safe_haven': 1
}

print("Aggregating Weighted Fear and Greed Score")
weight_total = sum(weights.values())
normalized_weights = {k: v / weight_total for k, v in weights.items()}
components['Fear_Greed_Index'] = sum(components[k] * normalized_weights[k] for k in components.columns)

print("Exporting results to CSV")
components.to_csv('fear_greed_index.csv')

# Don't generate plots in Vercel environment
print("Skipping plot generation in Vercel environment") 