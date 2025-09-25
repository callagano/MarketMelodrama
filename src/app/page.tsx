'use client';

import { useEffect, useState } from 'react';
import FearGreedCharts from '@/components/charts/FearGreedCharts';
import TrendingStocks from '@/components/TrendingStocks';
import HybridCalendar from '@/components/HybridCalendar';
import TLDRWidget from '@/components/TLDRWidget';
import LanguageToggle from '@/components/LanguageToggle';
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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
        console.log('FearGreedCharts data received:', jsonData.data?.length || jsonData.length, 'items');
        setData(jsonData.data || jsonData);
        setLastUpdated(jsonData.lastUpdated || null);
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
              <p className="subtitle">Markets aren't always rational. <span className="people-highlight">People</span> either.</p>
            </div>
          </div>
        </div>
        
        <TLDRWidget />
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText} data-i18n data-i18n-key="Loading charts...">Loading charts...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText} data-i18n data-i18n-key="Error loading charts">Error loading charts: {error}</p>
          </div>
        ) : data.length > 0 ? (
          <>
            <FearGreedCharts data={data} lastUpdated={lastUpdated || undefined} />
            <TrendingStocks />
            <HybridCalendar />
          </>
        ) : (
          <div className={styles.noDataCard}>
            <p className={styles.noDataText} data-i18n data-i18n-key="No chart data available">No chart data available</p>
          </div>
        )}
        
        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <p className={styles.disclaimerText} data-i18n data-i18n-key="Marketmelodrama.vercel.app is for educational and entertainment purposes only. It is based on real market data but is not investment advice. Content is generated using AI language models that can be unpredictable. Market insights may be inaccurate or misleading. Creator assumes no liability whatsoever for any decisions made based on this information. Do not use for investment decisions.">
            Marketmelodrama.vercel.app is for educational and entertainment purposes only. It is based on real market data but is not investment advice. Content is generated using AI language models that can be unpredictable. Market insights may be inaccurate or misleading. Creator assumes no liability whatsoever for any decisions made based on this information. Do not use for investment decisions.
          </p>
        </div>
        <LanguageToggle />
      </main>
    </TimeframeProvider>
  );
}
