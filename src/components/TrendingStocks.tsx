'use client';

import { useEffect, useState } from 'react';
import styles from './TrendingStocks.module.css';

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

interface RedditPost {
  data: {
    title: string;
    score: number;
    created_utc: number;
    selftext: string;
    url: string;
  };
}

export default function TrendingStocks() {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple finance subreddits
        const subreddits = ['wallstreetbets', 'stocks', 'investing'];
        const allPosts: RedditPost[] = [];
        
        for (const subreddit of subreddits) {
          try {
            const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`);
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

        setStocks(trendingStocks);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trending stocks');
        setLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Trending Stocks</h2>
          <p className={styles.subtitle}>Reddit mentions in the last 24 hours</p>
        </div>
        <div className={styles.loading}>Loading trending stocks from Reddit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Trending Stocks</h2>
          <p className={styles.subtitle}>Reddit mentions in the last 24 hours</p>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Trending Stocks</h2>
        <p className={styles.subtitle}>Reddit mentions in the last 24 hours</p>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Change</th>
              <th>Stock</th>
              <th>Symbol</th>
              <th>Mentions</th>
              <th>24h %</th>
              <th>Upvotes</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.symbol} className={styles.row}>
                <td className={styles.rank}>
                  <span className={styles.rankNumber}>{stock.rank}</span>
                </td>
                <td className={styles.rankChange}>
                  <span className={`${styles.change} ${stock.rankChange > 0 ? styles.positive : stock.rankChange < 0 ? styles.negative : styles.neutral}`}>
                    {stock.rankChange > 0 ? '+' : ''}{stock.rankChange}
                  </span>
                </td>
                <td className={styles.stockInfo}>
                  <div className={styles.stockLogo}>{stock.logo}</div>
                  <div className={styles.stockName}>{stock.name}</div>
                </td>
                <td className={styles.symbol}>{stock.symbol}</td>
                <td className={styles.mentions}>{stock.mentions.toLocaleString()}</td>
                <td className={styles.mentionsIncrease}>
                  <span className={`${styles.percentage} ${stock.mentionsIncrease > 0 ? styles.positive : stock.mentionsIncrease < 0 ? styles.negative : styles.neutral}`}>
                    {stock.mentionsIncrease > 0 ? '+' : ''}{stock.mentionsIncrease}%
                  </span>
                </td>
                <td className={styles.upvotes}>{stock.upvotes.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 