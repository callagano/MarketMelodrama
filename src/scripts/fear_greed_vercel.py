import os
import sys
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variable
API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
BASE_URL = os.getenv('ALPHA_VANTAGE_BASE_URL', 'https://www.alphavantage.co/query')

def fetch_stock_data(symbol):
    """Fetch stock data from Alpha Vantage API"""
    params = {
        'function': 'TIME_SERIES_DAILY',
        'symbol': symbol,
        'apikey': API_KEY,
        'outputsize': 'compact'
    }
    
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    
    if 'Time Series (Daily)' not in data:
        print(f"Error fetching data for {symbol}: {data.get('Note', 'Unknown error')}")
        return None
    
    df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
    df.index = pd.to_datetime(df.index)
    df = df.astype(float)
    return df

def calculate_market_momentum(spy_data, tlt_data):
    """Calculate market momentum component"""
    spy_returns = spy_data['4. close'].pct_change()
    tlt_returns = tlt_data['4. close'].pct_change()
    
    # Calculate 10-day momentum
    spy_momentum = spy_returns.rolling(window=10).mean()
    tlt_momentum = tlt_returns.rolling(window=10).mean()
    
    # Combine momentum signals
    momentum = (spy_momentum - tlt_momentum).fillna(0)
    return momentum

def calculate_stock_price_strength(spy_data):
    """Calculate stock price strength component"""
    # Calculate moving averages
    ma50 = spy_data['4. close'].rolling(window=50).mean()
    ma200 = spy_data['4. close'].rolling(window=200).mean()
    
    # Calculate strength based on moving average relationship
    strength = ((ma50 / ma200) - 1).fillna(0)
    return strength

def calculate_safe_haven_demand(tlt_data):
    """Calculate safe haven demand component"""
    # Calculate TLT price relative to its 50-day moving average
    ma50 = tlt_data['4. close'].rolling(window=50).mean()
    demand = ((tlt_data['4. close'] / ma50) - 1).fillna(0)
    return demand

def normalize_component(component):
    """Normalize component to range [-1, 1]"""
    return 2 * (component - component.min()) / (component.max() - component.min()) - 1

def calculate_fear_greed_index(spy_data, tlt_data):
    """Calculate the Fear and Greed Index"""
    # Calculate components
    momentum = calculate_market_momentum(spy_data, tlt_data)
    strength = calculate_stock_price_strength(spy_data)
    demand = calculate_safe_haven_demand(tlt_data)
    
    # Normalize components
    momentum_norm = normalize_component(momentum)
    strength_norm = normalize_component(strength)
    demand_norm = normalize_component(demand)
    
    # Calculate weighted index
    weights = {'momentum': 0.4, 'strength': 0.3, 'demand': 0.3}
    index = (
        weights['momentum'] * momentum_norm +
        weights['strength'] * strength_norm +
        weights['demand'] * demand_norm
    )
    
    # Scale to 0-100 range
    index_scaled = 50 * (index + 1)
    
    return pd.DataFrame({
        'date': index_scaled.index,
        'fear_greed_index': index_scaled.values,
        'momentum': momentum_norm.values,
        'strength': strength_norm.values,
        'demand': demand_norm.values
    })

def main():
    print("Fetching SPY data from API")
    spy_data = fetch_stock_data('SPY')
    if spy_data is None:
        sys.exit(1)
    
    print("Fetching TLT data from API")
    tlt_data = fetch_stock_data('TLT')
    if tlt_data is None:
        sys.exit(1)
    
    print("Calculating Market Momentum")
    momentum = calculate_market_momentum(spy_data, tlt_data)
    
    print("Calculating Stock Price Strength")
    strength = calculate_stock_price_strength(spy_data)
    
    print("Calculating Safe Haven Demand")
    demand = calculate_safe_haven_demand(tlt_data)
    
    print("Normalizing Components")
    momentum_norm = normalize_component(momentum)
    strength_norm = normalize_component(strength)
    demand_norm = normalize_component(demand)
    
    print("Aggregating Weighted Fear and Greed Score")
    weights = {'momentum': 0.4, 'strength': 0.3, 'demand': 0.3}
    index = (
        weights['momentum'] * momentum_norm +
        weights['strength'] * strength_norm +
        weights['demand'] * demand_norm
    )
    
    # Scale to 0-100 range
    index_scaled = 50 * (index + 1)
    
    # Create DataFrame with results
    results = pd.DataFrame({
        'date': index_scaled.index,
        'fear_greed_index': index_scaled.values,
        'momentum': momentum_norm.values,
        'strength': strength_norm.values,
        'demand': demand_norm.values
    })
    
    # Save to CSV
    csv_path = os.path.join(os.getcwd(), 'fear_greed_index.csv')
    results.to_csv(csv_path, index=False)
    print(f"Exporting results to CSV: {csv_path}")
    
    # Only generate plots if not in Vercel environment
    if not os.getenv('VERCEL'):
        print("Generating plots...")
        plt.figure(figsize=(12, 6))
        plt.plot(results['date'], results['fear_greed_index'], label='Fear & Greed Index')
        plt.plot(results['date'], results['momentum'], label='Momentum')
        plt.plot(results['date'], results['strength'], label='Strength')
        plt.plot(results['date'], results['demand'], label='Demand')
        plt.title('Fear & Greed Index Components')
        plt.xlabel('Date')
        plt.ylabel('Value')
        plt.legend()
        plt.grid(True)
        
        # Save plot
        plot_path = os.path.join(os.getcwd(), 'public', 'fear_greed_plot.png')
        plt.savefig(plot_path)
        print(f"Plot saved to: {plot_path}")
    else:
        print("Skipping plot generation in Vercel environment")

if __name__ == "__main__":
    main() 