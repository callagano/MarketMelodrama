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
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 10;

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

  // Calculate pagination
  const totalPages = Math.min(10, Math.ceil(stocks.length / stocksPerPage)); // Max 10 pages (100 stocks)
  const startIndex = (currentPage - 1) * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const currentStocks = stocks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
              <th>Stock</th>
              <th>Symbol</th>
              <th>Mentions</th>
              <th>24h %</th>
              <th>Upvotes</th>
            </tr>
          </thead>
          <tbody>
            {currentStocks.map((stock) => (
              <tr key={stock.symbol} className={styles.row}>
                <td className={styles.rank}>
                  <div className={styles.rankContainer}>
                    <div className={styles.rankNumber}>#{stock.rank}</div>
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
                           href={`https://finance.yahoo.com/quote/${stock.symbol}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className={styles.stockLink}
                         >
                           {stock.name}
                         </a>
                       </div>
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

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 