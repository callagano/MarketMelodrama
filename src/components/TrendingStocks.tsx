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
        setLoading(true);
        
        const response = await fetch('/api/trending-stocks');
        if (!response.ok) {
          throw new Error('Failed to fetch trending stocks');
        }
        
        const data = await response.json();
        setStocks(data);
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