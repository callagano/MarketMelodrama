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

type TabType = 'upvotes' | 'percentage';

export default function TrendingStocks() {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upvotes');

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

  // Sort stocks based on active tab
  const getSortedStocks = () => {
    if (activeTab === 'upvotes') {
      return [...stocks]
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 10)
        .map((stock, index) => ({ ...stock, displayRank: index + 1 }));
    } else {
      return [...stocks]
        .sort((a, b) => b.mentionsIncrease - a.mentionsIncrease)
        .slice(0, 10)
        .map((stock, index) => ({ ...stock, displayRank: index + 1 }));
    }
  };

  const currentStocks = getSortedStocks();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className="title">Trending stocks</h2>
          <p className="subtitle">Trending topics on Reddit over the past 24 hours</p>
        </div>
        <div className={styles.loading}>Loading people's picks from Reddit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className="title">Trending stocks</h2>
          <p className="subtitle">Trending topics on Reddit over the past 24 hours</p>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className="title">Trending stocks</h2>
        <p className="subtitle">Trending topics on Reddit over the past 24 hours</p>
      </div>
      
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'upvotes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('upvotes')}
        >
          Most relevant
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'percentage' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('percentage')}
        >
          Trending Up
        </button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Stock</th>
              <th>Symbol</th>
              <th>Mentions</th>
              <th>Upvotes</th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.map((stock) => (
              <tr key={stock.symbol} className={styles.row}>
                <td className={styles.rank}>
                  <div className={styles.rankContainer}>
                    <div className={styles.rankNumber}>#{stock.displayRank}</div>
                    <div className={styles.rankChange}>
                      <span className={`${styles.change} ${stock.rankChange > 0 ? styles.positive : stock.rankChange < 0 ? styles.negative : styles.neutral}`}>
                        {stock.rankChange > 0 ? '+' : ''}{stock.rankChange}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={styles.stockInfo}>
                  <div className={styles.stockName}>
                    <a 
                      href={`https://www.google.com/finance/quote/${stock.symbol}:nasdaq`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.stockLink}
                    >
                      {stock.name}
                    </a>
                  </div>
                </td>
                <td className={styles.symbol}>{stock.symbol}</td>
                <td className={styles.mentions}>
                  <div className={styles.mentionsContainer}>
                    <span className={styles.mentionsValue}>{stock.mentions.toLocaleString()}</span>
                    <span className={`${styles.percentage} ${stock.mentionsIncrease > 0 ? styles.positive : stock.mentionsIncrease < 0 ? styles.negative : styles.neutral}`}>
                      {stock.mentionsIncrease > 0 ? '+' : ''}{stock.mentionsIncrease}%
                    </span>
                  </div>
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