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

export default function TrendingStocks() {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        // For now, using mock data until we implement Reddit API
        const mockStocks: TrendingStock[] = [
          {
            rank: 1,
            rankChange: 0,
            name: "Apple Inc.",
            logo: "🍎",
            symbol: "AAPL",
            mentions: 1250,
            mentionsIncrease: 15.2,
            upvotes: 2847
          },
          {
            rank: 2,
            rankChange: 2,
            name: "Tesla Inc.",
            logo: "⚡",
            symbol: "TSLA",
            mentions: 1180,
            mentionsIncrease: 8.7,
            upvotes: 2654
          },
          {
            rank: 3,
            rankChange: -1,
            name: "NVIDIA Corporation",
            logo: "🟢",
            symbol: "NVDA",
            mentions: 980,
            mentionsIncrease: 12.3,
            upvotes: 2341
          },
          {
            rank: 4,
            rankChange: 1,
            name: "Microsoft Corporation",
            logo: "🪟",
            symbol: "MSFT",
            mentions: 890,
            mentionsIncrease: 5.4,
            upvotes: 1987
          },
          {
            rank: 5,
            rankChange: 3,
            name: "GameStop Corp.",
            logo: "🎮",
            symbol: "GME",
            mentions: 750,
            mentionsIncrease: 25.8,
            upvotes: 1876
          },
          {
            rank: 6,
            rankChange: -2,
            name: "Amazon.com Inc.",
            logo: "📦",
            symbol: "AMZN",
            mentions: 720,
            mentionsIncrease: 3.2,
            upvotes: 1654
          },
          {
            rank: 7,
            rankChange: 1,
            name: "Palantir Technologies",
            logo: "🔮",
            symbol: "PLTR",
            mentions: 680,
            mentionsIncrease: 18.9,
            upvotes: 1543
          },
          {
            rank: 8,
            rankChange: -1,
            name: "Meta Platforms Inc.",
            logo: "📘",
            symbol: "META",
            mentions: 650,
            mentionsIncrease: 7.1,
            upvotes: 1432
          },
          {
            rank: 9,
            rankChange: 4,
            name: "Advanced Micro Devices",
            logo: "🔴",
            symbol: "AMD",
            mentions: 590,
            mentionsIncrease: 22.4,
            upvotes: 1321
          },
          {
            rank: 10,
            rankChange: 0,
            name: "Alphabet Inc.",
            logo: "🔍",
            symbol: "GOOGL",
            mentions: 540,
            mentionsIncrease: 4.8,
            upvotes: 1187
          },
          {
            rank: 11,
            rankChange: 2,
            name: "Netflix Inc.",
            logo: "📺",
            symbol: "NFLX",
            mentions: 520,
            mentionsIncrease: 11.6,
            upvotes: 1098
          },
          {
            rank: 12,
            rankChange: -3,
            name: "Salesforce Inc.",
            logo: "☁️",
            symbol: "CRM",
            mentions: 480,
            mentionsIncrease: 2.1,
            upvotes: 987
          },
          {
            rank: 13,
            rankChange: 1,
            name: "PayPal Holdings",
            logo: "💳",
            symbol: "PYPL",
            mentions: 450,
            mentionsIncrease: 9.3,
            upvotes: 876
          },
          {
            rank: 14,
            rankChange: 5,
            name: "Coinbase Global",
            logo: "🪙",
            symbol: "COIN",
            mentions: 420,
            mentionsIncrease: 31.7,
            upvotes: 765
          },
          {
            rank: 15,
            rankChange: -2,
            name: "Adobe Inc.",
            logo: "🎨",
            symbol: "ADBE",
            mentions: 390,
            mentionsIncrease: 6.8,
            upvotes: 654
          },
          {
            rank: 16,
            rankChange: 3,
            name: "Shopify Inc.",
            logo: "🛒",
            symbol: "SHOP",
            mentions: 360,
            mentionsIncrease: 14.2,
            upvotes: 543
          },
          {
            rank: 17,
            rankChange: -1,
            name: "Intel Corporation",
            logo: "🔵",
            symbol: "INTC",
            mentions: 330,
            mentionsIncrease: 5.9,
            upvotes: 432
          },
          {
            rank: 18,
            rankChange: 2,
            name: "Spotify Technology",
            logo: "🎵",
            symbol: "SPOT",
            mentions: 300,
            mentionsIncrease: 12.8,
            upvotes: 321
          },
          {
            rank: 19,
            rankChange: -4,
            name: "Oracle Corporation",
            logo: "🗄️",
            symbol: "ORCL",
            mentions: 280,
            mentionsIncrease: 1.5,
            upvotes: 298
          },
          {
            rank: 20,
            rankChange: 1,
            name: "Zoom Video Communications",
            logo: "📹",
            symbol: "ZM",
            mentions: 250,
            mentionsIncrease: 8.4,
            upvotes: 267
          }
        ];

        setStocks(mockStocks);
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
        <div className={styles.loading}>Loading trending stocks...</div>
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