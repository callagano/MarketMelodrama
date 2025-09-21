'use client';

import { useEffect, useState } from 'react';
import FearGreedCharts from '@/components/charts/FearGreedCharts';
import TrendingStocks from '@/components/TrendingStocks';
import HybridCalendar from '@/components/HybridCalendar';
import WorkingTLDRWidget from '@/components/WorkingTLDRWidget';
import { TimeframeProvider } from '@/context/TimeframeContext';
import styles from './page.module.css';

interface ChartData {
  date: string;
  momentum: number;
  strength: number;
  safe_haven: number;
  Fear_Greed_Index: number;
}

export default function Home() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fear-greed-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const jsonData = await response.json();
        console.log('FearGreedCharts data received:', jsonData.length, 'items');
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <TimeframeProvider>
      <main className={styles.mainContainer}>
        <div className={styles.headerCard}>
          <div className={styles.headerContainer}>
            <img 
              src="/logo.png" 
              alt="Market Melodrama Logo" 
              className={styles.logo}
            />
            <div className={styles.textContainer}>
              <h1 className={styles.title}>Market Melodrama</h1>
              <p className="subtitle">Markets aren't always rational. People either.</p>
            </div>
          </div>
        </div>
        
        <WorkingTLDRWidget />
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading charts...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>Error loading charts: {error}</p>
          </div>
        ) : data.length > 0 ? (
          <>
            <FearGreedCharts data={data} />
            <TrendingStocks />
            <HybridCalendar />
          </>
        ) : (
          <div className={styles.noDataCard}>
            <p className={styles.noDataText}>No chart data available</p>
          </div>
        )}
      </main>
    </TimeframeProvider>
  );
}
