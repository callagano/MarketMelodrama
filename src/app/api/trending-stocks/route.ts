import { NextResponse } from 'next/server';

interface RedditPost {
  data: {
    title: string;
    score: number;
    created_utc: number;
    selftext: string;
    url: string;
  };
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
    // Stock symbols to track
    const stockSymbols = [
      'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GME', 'AMZN', 'PLTR', 'META', 'AMD', 'GOOGL',
      'NFLX', 'CRM', 'PYPL', 'COIN', 'ADBE', 'SHOP', 'INTC', 'SPOT', 'ORCL', 'ZM'
    ];

    // Stock name mapping
    const stockNames: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'MSFT': 'Microsoft Corporation',
      'GME': 'GameStop Corp.',
      'AMZN': 'Amazon.com Inc.',
      'PLTR': 'Palantir Technologies',
      'META': 'Meta Platforms Inc.',
      'AMD': 'Advanced Micro Devices',
      'GOOGL': 'Alphabet Inc.',
      'NFLX': 'Netflix Inc.',
      'CRM': 'Salesforce Inc.',
      'PYPL': 'PayPal Holdings',
      'COIN': 'Coinbase Global',
      'ADBE': 'Adobe Inc.',
      'SHOP': 'Shopify Inc.',
      'INTC': 'Intel Corporation',
      'SPOT': 'Spotify Technology',
      'ORCL': 'Oracle Corporation',
      'ZM': 'Zoom Video Communications'
    };

    // Stock logo mapping
    const stockLogos: { [key: string]: string } = {
      'AAPL': '🍎', 'TSLA': '⚡', 'NVDA': '🟢', 'MSFT': '🪟', 'GME': '🎮',
      'AMZN': '📦', 'PLTR': '🔮', 'META': '📘', 'AMD': '🔴', 'GOOGL': '🔍',
      'NFLX': '📺', 'CRM': '☁️', 'PYPL': '💳', 'COIN': '🪙', 'ADBE': '🎨',
      'SHOP': '🛒', 'INTC': '🔵', 'SPOT': '🎵', 'ORCL': '🗄️', 'ZM': '📹'
    };

    // Fetch data from multiple finance subreddits
    const subreddits = ['wallstreetbets', 'stocks', 'investing'];
    const allPosts: RedditPost[] = [];
    
    for (const subreddit of subreddits) {
      try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`, {
          headers: {
            'User-Agent': 'MarketMelodrama/1.0 (by /u/marketmelodrama)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          allPosts.push(...data.data.children);
        }
      } catch (err) {
        console.warn(`Failed to fetch from r/${subreddit}:`, err);
      }
    }

    // Count mentions for each stock symbol
    const mentions: { [key: string]: number } = {};
    const upvotes: { [key: string]: number } = {};
    
    allPosts.forEach(post => {
      const content = `${post.data.title} ${post.data.selftext}`.toUpperCase();
      
      stockSymbols.forEach(symbol => {
        if (content.includes(symbol)) {
          mentions[symbol] = (mentions[symbol] || 0) + 1;
          upvotes[symbol] = (upvotes[symbol] || 0) + post.data.score;
        }
      });
    });

    // Convert to trending stocks array
    const trendingStocks: TrendingStock[] = Object.keys(mentions)
      .map(symbol => ({
        rank: 0, // Will be set below
        rankChange: 0, // Mock data for now
        name: stockNames[symbol] || symbol,
        logo: stockLogos[symbol] || '📈',
        symbol,
        mentions: mentions[symbol],
        mentionsIncrease: Math.floor(Math.random() * 30) + 1, // Mock data for now
        upvotes: upvotes[symbol]
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20)
      .map((stock, index) => ({
        ...stock,
        rank: index + 1
      }));

    return NextResponse.json(trendingStocks);
  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending stocks' },
      { status: 500 }
    );
  }
} 