import { NextResponse } from 'next/server';

// Free economic calendar API endpoints
const ECONOMIC_CALENDAR_URL = 'https://api.tradingeconomics.com/calendar';
const EARNINGS_CALENDAR_URL = 'https://api.tradingeconomics.com/earnings';
const IPO_CALENDAR_URL = 'https://api.tradingeconomics.com/ipos';

// Mock data for development (since free APIs have limited calls)
const generateMockEconomicData = () => {
  const events = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const eventTypes = ['Earnings', 'Economic Indicator', 'IPO', 'Fed Meeting', 'GDP Release'];
    const countries = ['US', 'EU', 'UK', 'JP', 'CN'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
    
    events.push({
      id: i + 1,
      date: date.toISOString().split('T')[0],
      time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      category: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      event: `Sample ${eventTypes[Math.floor(Math.random() * eventTypes.length)]} Event ${i + 1}`,
      reference: Math.floor(Math.random() * 100),
      source: 'Mock Data',
      actual: Math.floor(Math.random() * 100),
      previous: Math.floor(Math.random() * 100),
      forecast: Math.floor(Math.random() * 100),
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      importance: Math.floor(Math.random() * 3) + 1
    });
  }
  
  return events;
};

const generateMockEarningsData = () => {
  const earnings = [];
  const today = new Date();
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const companies = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
    
    earnings.push({
      id: i + 1,
      date: date.toISOString().split('T')[0],
      time: '16:00',
      symbol: companies[Math.floor(Math.random() * companies.length)],
      company: `${companies[Math.floor(Math.random() * companies.length)]} Inc.`,
      eps_estimate: (Math.random() * 5).toFixed(2),
      eps_actual: (Math.random() * 5).toFixed(2),
      revenue_estimate: (Math.random() * 100).toFixed(2) + 'B',
      revenue_actual: (Math.random() * 100).toFixed(2) + 'B',
      market_cap: (Math.random() * 1000).toFixed(2) + 'B'
    });
  }
  
  return earnings;
};

const generateMockIPOData = () => {
  const ipos = [];
  const today = new Date();
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i * 7); // Weekly IPOs
    
    const companies = ['TechStart', 'BioInnovate', 'GreenEnergy', 'FinTech', 'CloudCorp'];
    
    ipos.push({
      id: i + 1,
      date: date.toISOString().split('T')[0],
      company: companies[Math.floor(Math.random() * companies.length)],
      symbol: companies[Math.floor(Math.random() * companies.length)].substring(0, 4).toUpperCase(),
      price_range: `$${(Math.random() * 50 + 10).toFixed(2)} - $${(Math.random() * 50 + 60).toFixed(2)}`,
      shares_offered: Math.floor(Math.random() * 50 + 10) + 'M',
      total_value: '$' + (Math.random() * 5 + 1).toFixed(2) + 'B',
      exchange: ['NYSE', 'NASDAQ'][Math.floor(Math.random() * 2)],
      underwriters: ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan'][Math.floor(Math.random() * 3)]
    });
  }
  
  return ipos;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const days = parseInt(searchParams.get('days') || '30');
    
    let data: any = {};
    
    if (type === 'economic' || type === 'all') {
      data.economic = generateMockEconomicData();
    }
    
    if (type === 'earnings' || type === 'all') {
      data.earnings = generateMockEarningsData();
    }
    
    if (type === 'ipo' || type === 'all') {
      data.ipo = generateMockIPOData();
    }
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      source: 'Mock Data (Free API alternative)'
    });
    
  } catch (error) {
    console.error('Error fetching economic calendar data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch economic calendar data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

