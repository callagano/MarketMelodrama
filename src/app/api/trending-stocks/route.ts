import { NextResponse } from 'next/server';

interface ApeWisdomStock {
  rank: number;
  rank_change: number;
  rank_24h_ago: number;
  ticker: string;
  name: string;
  mentions: number;
  mentions_change: number;
  mentions_24h_ago: number;
  upvotes: number;
  sentiment: number;
  sentiment_score: number;
}

interface TrendingStock {
  rank: number;
  rankChange: number;
  name: string;
  logo: string;
  symbol: string;
  mentions: number;
  mentionsIncrease: number;
  upvotes: number;
}

export async function GET() {
  try {
    // Stock logo mapping
    const stockLogos: { [key: string]: string } = {
      'AAPL': '🍎', 'TSLA': '⚡', 'NVDA': '🟢', 'MSFT': '🪟', 'GME': '🎮',
      'AMZN': '📦', 'PLTR': '🔮', 'META': '📘', 'AMD': '🔴', 'GOOGL': '🔍',
      'NFLX': '📺', 'CRM': '☁️', 'PYPL': '💳', 'COIN': '🪙', 'ADBE': '🎨',
      'SHOP': '🛒', 'INTC': '🔵', 'SPOT': '🎵', 'ORCL': '🗄️', 'ZM': '📹'
    };

    // Fetch data from ApeWisdom API
    const response = await fetch('https://apewisdom.io/api/v1.0/filter/all-stocks', {
      headers: {
        'User-Agent': 'MarketMelodrama/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`ApeWisdom API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn('No results from ApeWisdom API');
      return NextResponse.json([]);
    }

    // Convert ApeWisdom data to our format
    const trendingStocks: TrendingStock[] = data.results
      .slice(0, 100) // Get top 100
      .map((stock: ApeWisdomStock, index: number) => {
        // Calculate real rank change
        const rankChange = stock.rank_24h_ago && stock.rank 
          ? stock.rank_24h_ago - stock.rank 
          : stock.rank_change || 0;
        
        // Calculate real mentions percentage change
        const mentionsIncrease = stock.mentions_24h_ago && stock.mentions
          ? Math.round(((stock.mentions - stock.mentions_24h_ago) / stock.mentions_24h_ago) * 100)
          : stock.mentions_change || 0;
        
        return {
          rank: stock.rank || index + 1,
          rankChange,
          name: stock.name || stock.ticker,
          logo: stockLogos[stock.ticker] || '📈',
          symbol: stock.ticker,
          mentions: stock.mentions || 0,
          mentionsIncrease,
          upvotes: stock.upvotes || 0
        };
      });

    return NextResponse.json({
      data: trendingStocks,
      lastUpdated: new Date().toISOString(),
      source: 'apewisdom.io'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Last-Modified': new Date().toUTCString(),
      },
    });
  } catch (error) {
    console.error('Error fetching trending stocks from ApeWisdom:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending stocks' },
      { status: 500 }
    );
  }
} 