# Market Melodrama

The human side of the Financial markets.

## Features

- Real-time Fear & Greed Index calculation
- Historical data visualization
- Component breakdown:
  - Market Momentum
  - Stock Price Strength
  - Safe Haven Demand
- Responsive design
- Interactive time frame selection (1M, 6M, 3Y)
- Economic Calendar with TradingView integration
- Earnings Calendar using Alpha Vantage API
- IPO Calendar with real-time data

## Tech Stack

- Next.js 14
- React
- TypeScript
- Recharts
- Python (for data processing)
- Financial Modeling Prep API
- Alpha Vantage API
- TradingView Widgets

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/market-melodrama.git
cd market-melodrama
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your API keys:
```
# Financial Modeling Prep API key
API_KEY=your_fmp_api_key_here

# Alpha Vantage API key (for earnings calendar)
# Get your free API key from: https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

4. Set up Python environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install pandas numpy matplotlib requests
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Calendar Implementation

The Market Calendar uses a hybrid approach:

### Economic Events
- **TradingView Widget**: Embedded economic calendar with real-time data
- **Features**: Country flags, importance indicators, actual/forecast/prior values
- **Dark Mode**: Optimized for dark theme

### Earnings Calendar
- **Alpha Vantage API**: Real earnings data from major exchanges
- **Features**: EPS estimates, fiscal periods, company information
- **Free Tier**: 500 API calls per day

### IPO Calendar
- **Mock Data**: Currently using sample IPO data
- **Future**: Can be integrated with IEX Cloud or Financial Modeling Prep for real IPO data
- **Features**: Price ranges, share offerings, underwriters

### API Setup
The application is currently configured with a working Alpha Vantage API key:
- **API Key**: `WLHZLTATM9PMFVX9` (configured in code)
- **Cache Duration**: 24 hours (with automatic expiration)
- **Earnings Horizon**: 1 month
- **Free Tier**: 500 calls per day (Alpha Vantage)

### Cache Management
The application uses a sophisticated 24-hour caching system:
- **File-based Cache**: Stored in `.cache/` directory
- **Automatic Expiration**: Data expires after 24 hours
- **Cache Status**: View cache info at `/api/cache-status`
- **Cache Control**: Clear cache with `/api/cache-status?action=clear`

### Cache Keys
- `earnings-1month`: Earnings calendar data
- `ipo-calendar`: IPO calendar data

For production use, consider:
1. Getting your own free API key: https://www.alphavantage.co/support/#api-key
2. Adding it to your `.env.local` file as `ALPHA_VANTAGE_API_KEY`
3. Updating the API routes to use environment variables

## License

MIT
