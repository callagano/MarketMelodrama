# API Setup for Real Data

## Current Implementation

The application is now configured to use **Alpha Vantage API** with the provided API key `WLHZLTATM9PMFVX9` for real financial data.

## API Endpoints Used

### Earnings Calendar
- **API**: Alpha Vantage `EARNINGS_CALENDAR` function
- **Data**: Company earnings reports, estimates, fiscal dates
- **Format**: CSV response parsed to JSON
- **Update**: Daily at 7 AM via cron job
- **Cache**: 24 hours

### IPO Calendar  
- **API**: Alpha Vantage `IPO_CALENDAR` function
- **Data**: Upcoming IPOs, pricing, shares, underwriters
- **Format**: CSV response parsed to JSON
- **Update**: Daily at 7 AM via cron job
- **Cache**: 24 hours

## Daily Cron Job

The application automatically refreshes all data daily at 7:00 AM via Vercel cron jobs:

- **Earnings Calendar**: Real earnings data from Alpha Vantage API
- **IPO Calendar**: Real IPO data from Alpha Vantage API  
- **Trending Stocks**: Market data refresh
- **Economic Calendar**: Economic events refresh

## Data Processing

### CSV to JSON Conversion
Both Alpha Vantage endpoints return CSV data which is automatically converted to structured JSON:

**Earnings Calendar Fields:**
- Symbol, Company Name, Report Date, Fiscal Date Ending, Estimate, Currency

**IPO Calendar Fields:**
- Company, Symbol, Date, Price Range, Shares Offered, Total Value, Exchange, Underwriters

### Filtering & Sorting
- **Time Range**: Next month only
- **Sorting**: By date (earliest first)
- **Limits**: Top 100 results for earnings, all for IPOs

## Testing

1. **API Endpoints are ready** with your Alpha Vantage key
2. **Test the endpoints**:
   - `/api/earnings-calendar`
   - `/api/ipo-calendar`
   - `/api/cron` (manual trigger for testing)

## Alpha Vantage API Limits

- **Free Tier**: 25 API calls per day
- **Current Usage**: 2 calls per day (earnings + IPO)
- **Remaining**: 23 calls for other features

## Fallback Behavior

If the Alpha Vantage API fails, the endpoints will return appropriate error messages while maintaining the application's stability.
