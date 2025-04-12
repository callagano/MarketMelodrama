import { NextResponse } from 'next/server';

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

async function fetchHistoricalData(symbol: string, limit: number = 1825) {
  const url = `${BASE_URL}/historical-price-full/${symbol}?apikey=${API_KEY}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${symbol} data`);
  }
  const data = await response.json();
  return data.historical;
}

function calculateMetrics(spyData: any[], tltData: any[]) {
  // Calculate momentum (125-day moving average)
  const momentum = spyData.map((day, i) => {
    const slice = spyData.slice(Math.max(0, i - 124), i + 1);
    const avg = slice.reduce((sum, d) => sum + d.close, 0) / slice.length;
    return {
      date: day.date,
      value: day.close / avg * 100
    };
  });

  // Calculate strength (52-week high/low)
  const strength = spyData.map((day, i) => {
    const yearData = spyData.slice(Math.max(0, i - 251), i + 1);
    const high = Math.max(...yearData.map(d => d.close));
    const low = Math.min(...yearData.map(d => d.close));
    return {
      date: day.date,
      value: ((day.close - low) / (high - low)) * 100
    };
  });

  // Calculate safe haven demand (125-day moving average of TLT/SPY ratio)
  const safeHaven = spyData.map((day, i) => {
    const tltDay = tltData.find(d => d.date === day.date);
    if (!tltDay) return null;
    
    const ratio = tltDay.close / day.close;
    const slice = spyData.slice(Math.max(0, i - 124), i + 1)
      .map((item: { close: number, date: string } | null) => {
        if (!item) return null;
        // @ts-ignore: Multiple null checks ensure runtime safety
        const d = tltData.find(d => d?.date === item.date);
        if (d === null || d === undefined) return null;
        
        // Type guard to ensure d has the correct shape
        const isTltDataPoint = (x: any): x is { close: number } => {
          return x && typeof x === 'object' && 'close' in x && typeof x.close === 'number';
        };
        
        if (!isTltDataPoint(d)) return null;
        return d.close / item.close;
      })
      .filter((item): item is number => item !== null && !isNaN(item));
    
    if (!slice.length) return null;
    const avg = slice.reduce((sum, r) => sum + r, 0) / slice.length;
    return {
      date: day.date,
      value: 100 - (ratio / avg * 100) // Invert the value
    };
  }).filter(Boolean);

  // Combine all metrics
  const combined = momentum.map(day => {
    const s = strength.find(d => d.date === day.date);
    // @ts-ignore: Multiple null checks ensure runtime safety
    const sh = safeHaven.find(d => d.date === day.date);
    if (!s || !sh) return null;

    const fearGreedIndex = (day.value + s.value + sh.value) / 3;
    
    return {
      date: day.date,
      momentum: day.value,
      strength: s.value,
      safe_haven: sh.value,
      Fear_Greed_Index: fearGreedIndex
    };
  }).filter(Boolean);

  return combined;
}

export async function GET() {
  try {
    // Fetch historical data for SPY and TLT
    const [spyData, tltData] = await Promise.all([
      fetchHistoricalData('SPY'),
      fetchHistoricalData('TLT')
    ]);

    // Calculate metrics
    const metrics = calculateMetrics(spyData, tltData);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update data' },
      { status: 500 }
    );
  }
} 