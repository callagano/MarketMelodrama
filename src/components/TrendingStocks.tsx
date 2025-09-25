'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import LastUpdated from './ui/LastUpdated';
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isInfoOpen) {
      // Store the current scroll position
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // Restore body styles
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
      // Restore scroll position after a small delay to ensure styles are applied
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [isInfoOpen]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/trending-stocks');
        if (!response.ok) {
          throw new Error('Failed to fetch trending stocks');
        }
        
        const data = await response.json();
        setStocks(data.data || data);
        setLastUpdated(data.lastUpdated || null);
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
          <div className={styles.titleRow}>
            <h2 className="title">Trending stocks</h2>
          </div>
          <button
            type="button"
            className={styles.infoButton}
            onClick={() => setIsInfoOpen(true)}
            aria-label="Learn more about Trending Stocks"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
          <p className="subtitle" data-i18n data-i18n-key="What people is talking about?">What <span className="people-highlight">people</span> is talking about?</p>
        </div>
        <div className={styles.loading} data-i18n data-i18n-key="Loading trending stocks...">Loading trending stocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className="title">Trending stocks</h2>
          </div>
          <button
            type="button"
            className={styles.infoButton}
            onClick={() => setIsInfoOpen(true)}
            aria-label="Learn more about Trending Stocks"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
          <p className="subtitle" data-i18n data-i18n-key="What people is talking about?">What <span className="people-highlight">people</span> is talking about?</p>
        </div>
        <div className={styles.error} data-i18n data-i18n-key="Error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className="title" data-i18n data-i18n-key="Trending stocks">Trending stocks</h2>
          <LastUpdated timestamp={lastUpdated || undefined} className={styles.lastUpdated} useCronTime={false} />
        </div>
        <button
          type="button"
          className={styles.infoButton}
          onClick={() => setIsInfoOpen(true)}
          aria-label="Learn more about Trending Stocks"
        >
          <span className="material-symbols-outlined">info</span>
        </button>
        <p className="subtitle" data-i18n data-i18n-key="What people is talking about?">What <span className="people-highlight">people</span> is talking about?</p>
      </div>
      
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'upvotes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('upvotes')}
          data-i18n
          data-i18n-key="Most relevant"
        >
          Most relevant
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'percentage' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('percentage')}
          data-i18n
          data-i18n-key="Trending Up"
        >
          Trending Up
        </button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th data-i18n data-i18n-key="Rank">Rank</th>
              <th data-i18n data-i18n-key="Stock">Stock</th>
              <th data-i18n data-i18n-key="Symbol">Symbol</th>
              <th data-i18n data-i18n-key="Mentions">Mentions</th>
              <th data-i18n data-i18n-key="Upvotes">Upvotes</th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.map((stock) => (
              <tr 
                key={stock.symbol} 
                className={styles.row}
                onClick={() => window.open(`https://www.google.com/finance/quote/${stock.symbol}:nasdaq`, '_blank')}
              >
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
                    {stock.name}
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

      {/* Info Modal rendered via portal to detach from widget */}
      {hasMounted && isInfoOpen && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setIsInfoOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3>About Trending Stocks</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsInfoOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <h4>What is Trending Stocks?</h4>
              <p>A ranked list of stocks that are currently popular or seeing a surge in mentions and upvotes on Reddit over the last 24 hours.</p>
              <h4>How is Trending Stocks ranking calculated?</h4>
              <p>The "Most relevant" ranking is based on the number of mentions received over the last 24 hours.</p>
              <p>The "Trending up" ranking is based on the percentage increase received over the last 24 hours.</p>
              <h4>When is Trending Stocks updated?</h4>
              <p>Every morning at 5 UTC.</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 